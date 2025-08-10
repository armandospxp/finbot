import pytest
import os
import json
from unittest.mock import patch, MagicMock

# Importar el cliente desde el directorio padre
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from gpt_oss_client import GPTOSSClient, GPTOSSResponse

@pytest.fixture
def mock_response():
    """Fixture para crear una respuesta mock."""
    mock = MagicMock()
    mock.status_code = 200
    mock.json.return_value = {
        "id": "chatcmpl-123",
        "object": "chat.completion",
        "created": 1677858242,
        "model": "gpt-oss-20b",
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "Esta es una respuesta de prueba."
                },
                "finish_reason": "stop",
                "index": 0
            }
        ],
        "usage": {
            "prompt_tokens": 10,
            "completion_tokens": 20,
            "total_tokens": 30
        }
    }
    return mock

@pytest.fixture
def mock_health_response():
    """Fixture para crear una respuesta mock para el endpoint de salud."""
    mock = MagicMock()
    mock.status_code = 200
    mock.json.return_value = {"status": "ok"}
    return mock

def test_init():
    """Prueba la inicialización del cliente."""
    # Probar con valores predeterminados
    client = GPTOSSClient()
    assert client.model_path == "/models/gpt-oss-20b"
    assert client.max_tokens == 1024
    assert client.temperature == 0.7
    assert client.top_p == 0.9
    assert client.top_k == 40
    
    # Probar con valores personalizados
    client = GPTOSSClient(
        model_path="/custom/path",
        max_tokens=2048,
        temperature=0.8,
        top_p=0.95,
        top_k=50,
        api_url="http://custom-url:8080"
    )
    assert client.model_path == "/custom/path"
    assert client.max_tokens == 2048
    assert client.temperature == 0.8
    assert client.top_p == 0.95
    assert client.top_k == 50
    assert client.api_url == "http://custom-url:8080"

def test_format_messages():
    """Prueba el método _format_messages."""
    client = GPTOSSClient()
    messages = client._format_messages("Hola, ¿cómo estás?")
    
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert "asistente" in messages[0]["content"]
    assert messages[1]["role"] == "user"
    assert messages[1]["content"] == "Hola, ¿cómo estás?"

@patch('requests.post')
def test_generate(mock_post, mock_response):
    """Prueba el método generate."""
    # Configurar el mock
    mock_post.return_value = mock_response
    
    # Crear el cliente y generar texto
    client = GPTOSSClient(api_url="http://test-url:8080")
    response = client.generate("Hola, ¿cómo estás?")
    
    # Verificar que se llamó a requests.post con los parámetros correctos
    mock_post.assert_called_once()
    args, kwargs = mock_post.call_args
    assert args[0] == "http://test-url:8080/v1/chat/completions"
    assert kwargs["json"]["messages"] == client._format_messages("Hola, ¿cómo estás?")
    assert kwargs["json"]["max_tokens"] == 1024
    assert kwargs["json"]["temperature"] == 0.7
    assert kwargs["json"]["top_p"] == 0.9
    assert kwargs["json"]["top_k"] == 40
    assert kwargs["json"]["stream"] == False
    
    # Verificar la respuesta
    assert isinstance(response, GPTOSSResponse)
    assert response.text == "Esta es una respuesta de prueba."
    assert response.usage == {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30}
    assert response.model == "gpt-oss-20b"
    assert response.id == "chatcmpl-123"

@patch('requests.post')
def test_generate_with_custom_params(mock_post, mock_response):
    """Prueba el método generate con parámetros personalizados."""
    # Configurar el mock
    mock_post.return_value = mock_response
    
    # Crear el cliente y generar texto con parámetros personalizados
    client = GPTOSSClient()
    response = client.generate(
        prompt="Hola, ¿cómo estás?",
        max_tokens=100,
        temperature=0.5,
        top_p=0.8,
        top_k=30,
        stream=True
    )
    
    # Verificar que se llamó a requests.post con los parámetros correctos
    args, kwargs = mock_post.call_args
    assert kwargs["json"]["max_tokens"] == 100
    assert kwargs["json"]["temperature"] == 0.5
    assert kwargs["json"]["top_p"] == 0.8
    assert kwargs["json"]["top_k"] == 30
    assert kwargs["json"]["stream"] == True

@patch('requests.post')
def test_generate_error_handling(mock_post):
    """Prueba el manejo de errores en el método generate."""
    # Configurar el mock para simular un error de conexión
    mock_post.side_effect = Exception("Error de conexión")
    
    # Crear el cliente
    client = GPTOSSClient()
    
    # Verificar que se lanza una excepción
    with pytest.raises(Exception) as excinfo:
        client.generate("Hola, ¿cómo estás?")
    
    assert "Error" in str(excinfo.value)

@patch('requests.get')
def test_health_check(mock_get, mock_health_response):
    """Prueba el método health_check."""
    # Configurar el mock
    mock_get.return_value = mock_health_response
    
    # Crear el cliente y verificar la salud
    client = GPTOSSClient(api_url="http://test-url:8080")
    result = client.health_check()
    
    # Verificar que se llamó a requests.get con los parámetros correctos
    mock_get.assert_called_once_with("http://test-url:8080/health", timeout=5)
    
    # Verificar el resultado
    assert result == True

@patch('requests.get')
def test_health_check_error(mock_get):
    """Prueba el método health_check cuando hay un error."""
    # Configurar el mock para simular un error
    mock_get.side_effect = Exception("Error de conexión")
    
    # Crear el cliente
    client = GPTOSSClient()
    
    # Verificar que el método retorna False en caso de error
    result = client.health_check()
    assert result == False