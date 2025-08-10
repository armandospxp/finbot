import pytest
import json
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Importar la aplicación FastAPI desde server.py
import sys
import os

# Asegurar que podemos importar desde el directorio padre
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from server import app, load_model, tokenizer, model

# Cliente de prueba
client = TestClient(app)

# Fixture para mockear el modelo y tokenizer
@pytest.fixture(autouse=True)
def mock_model_and_tokenizer():
    # Crear mocks para el modelo y tokenizer
    mock_tokenizer = MagicMock()
    mock_model = MagicMock()
    
    # Configurar comportamiento del tokenizer mock
    mock_tokenizer.encode.return_value = [1, 2, 3, 4, 5]  # IDs de tokens simulados
    mock_tokenizer.decode.return_value = "This is a test response from the model."  # Texto decodificado simulado
    mock_tokenizer.model_max_length = 2048
    
    # Configurar comportamiento del modelo mock
    mock_output = MagicMock()
    mock_output.sequences = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]]
    mock_model.generate.return_value = mock_output
    
    # Aplicar los mocks
    with patch('server.tokenizer', mock_tokenizer), \
         patch('server.model', mock_model):
        yield

def test_health_endpoint():
    """Prueba el endpoint de salud"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_chat_completions_endpoint():
    """Prueba el endpoint de chat completions"""
    # Datos de prueba para la solicitud
    request_data = {
        "model": "gpt-oss-20b",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello, how are you?"}
        ],
        "temperature": 0.7,
        "max_tokens": 100
    }
    
    # Enviar solicitud al endpoint
    response = client.post(
        "/v1/chat/completions",
        json=request_data
    )
    
    # Verificar respuesta
    assert response.status_code == 200
    data = response.json()
    
    # Verificar estructura de la respuesta
    assert "id" in data
    assert "object" in data
    assert "created" in data
    assert "model" in data
    assert "choices" in data
    assert isinstance(data["choices"], list)
    assert len(data["choices"]) > 0
    assert "message" in data["choices"][0]
    assert "role" in data["choices"][0]["message"]
    assert "content" in data["choices"][0]["message"]
    assert "usage" in data
    assert "prompt_tokens" in data["usage"]
    assert "completion_tokens" in data["usage"]
    assert "total_tokens" in data["usage"]

def test_chat_completions_with_invalid_data():
    """Prueba el endpoint de chat completions con datos inválidos"""
    # Datos de prueba inválidos (sin mensajes)
    request_data = {
        "model": "gpt-oss-20b",
        "temperature": 0.7,
        "max_tokens": 100
    }
    
    # Enviar solicitud al endpoint
    response = client.post(
        "/v1/chat/completions",
        json=request_data
    )
    
    # Verificar que la respuesta indica un error
    assert response.status_code == 422  # Unprocessable Entity

def test_chat_completions_streaming():
    """Prueba el endpoint de chat completions con streaming"""
    # Datos de prueba para la solicitud con streaming
    request_data = {
        "model": "gpt-oss-20b",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello, how are you?"}
        ],
        "temperature": 0.7,
        "max_tokens": 100,
        "stream": True
    }
    
    # Enviar solicitud al endpoint
    response = client.post(
        "/v1/chat/completions",
        json=request_data
    )
    
    # Verificar respuesta
    assert response.status_code == 200
    
    # Verificar que la respuesta es un stream
    content = response.content.decode('utf-8')
    assert content.startswith('data:')
    
    # Verificar que podemos parsear al menos una línea del stream
    lines = [line for line in content.split('\n') if line.startswith('data:')]
    assert len(lines) > 0
    
    # Intentar parsear la primera línea de datos
    first_line = lines[0].replace('data:', '').strip()
    if first_line != "[DONE]":
        data = json.loads(first_line)
        assert "id" in data
        assert "choices" in data

def test_model_loading_error():
    """Prueba el manejo de errores al cargar el modelo"""
    # Simular un error al cargar el modelo
    with patch('server.load_model', side_effect=Exception("Error al cargar el modelo")):
        # Reiniciar la aplicación para que intente cargar el modelo nuevamente
        from server import app as new_app
        test_client = TestClient(new_app)
        
        # Probar el endpoint de salud
        response = test_client.get("/health")
        assert response.status_code == 503  # Service Unavailable
        assert response.json()["status"] == "error"
        
        # Probar el endpoint de chat completions
        request_data = {
            "model": "gpt-oss-20b",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello, how are you?"}
            ]
        }
        
        response = test_client.post(
            "/v1/chat/completions",
            json=request_data
        )
        
        assert response.status_code == 503  # Service Unavailable