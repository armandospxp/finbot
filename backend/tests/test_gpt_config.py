import pytest
import os
from unittest.mock import patch, MagicMock

# Importar las funciones a probar
from gpt_config import (
    get_gpt_oss_config,
    is_gpt_oss_available,
    get_llm_client,
    generate_text
)

# Pruebas para get_gpt_oss_config
def test_get_gpt_oss_config():
    """Prueba la función get_gpt_oss_config."""
    # Configurar variables de entorno para la prueba
    with patch.dict(os.environ, {
        "GPT_OSS_MODEL_PATH": "/test/models/gpt-oss-20b",
        "GPT_OSS_MAX_TOKENS": "2048",
        "GPT_OSS_TEMPERATURE": "0.8",
        "GPT_OSS_TOP_P": "0.95",
        "GPT_OSS_TOP_K": "50"
    }):
        # Recargar el módulo para que tome las nuevas variables de entorno
        import importlib
        import gpt_config
        importlib.reload(gpt_config)
        
        # Obtener la configuración
        config = gpt_config.get_gpt_oss_config()
        
        # Verificar la configuración
        assert config["model_path"] == "/test/models/gpt-oss-20b"
        assert config["max_tokens"] == 2048
        assert config["temperature"] == 0.8
        assert config["top_p"] == 0.95
        assert config["top_k"] == 50

# Pruebas para is_gpt_oss_available
@patch('os.path.exists')
@patch('importlib.import_module')
def test_is_gpt_oss_available_true(mock_import, mock_exists):
    """Prueba la función is_gpt_oss_available cuando el modelo está disponible."""
    # Configurar los mocks
    mock_import.return_value = MagicMock()
    mock_exists.return_value = True
    
    # Verificar que la función retorna True
    with patch.dict(os.environ, {"GPT_OSS_MODEL_PATH": "/test/models/gpt-oss-20b"}):
        import importlib
        import gpt_config
        importlib.reload(gpt_config)
        
        assert gpt_config.is_gpt_oss_available() == True

@patch('os.path.exists')
@patch('importlib.import_module')
def test_is_gpt_oss_available_false_no_model(mock_import, mock_exists):
    """Prueba la función is_gpt_oss_available cuando el modelo no existe."""
    # Configurar los mocks
    mock_import.return_value = MagicMock()
    mock_exists.return_value = False
    
    # Verificar que la función retorna False
    with patch.dict(os.environ, {"GPT_OSS_MODEL_PATH": "/test/models/gpt-oss-20b"}):
        import importlib
        import gpt_config
        importlib.reload(gpt_config)
        
        assert gpt_config.is_gpt_oss_available() == False

@patch('importlib.import_module')
def test_is_gpt_oss_available_false_import_error(mock_import):
    """Prueba la función is_gpt_oss_available cuando hay un error de importación."""
    # Configurar el mock para lanzar ImportError
    mock_import.side_effect = ImportError("No module named 'gpt_oss_20b'")
    
    # Verificar que la función retorna False
    import importlib
    import gpt_config
    importlib.reload(gpt_config)
    
    assert gpt_config.is_gpt_oss_available() == False

# Pruebas para get_llm_client
@patch('gpt_config.is_gpt_oss_available')
def test_get_llm_client_gpt_oss(mock_is_available):
    """Prueba la función get_llm_client cuando gpt-oss-20b está disponible."""
    # Configurar el mock
    mock_is_available.return_value = True
    
    # Crear un mock para el cliente de gpt-oss-20b
    mock_client = MagicMock()
    mock_gpt_oss = MagicMock()
    mock_gpt_oss.GPTOSSClient.return_value = mock_client
    
    # Mockear la importación de gpt_oss_20b
    with patch.dict('sys.modules', {'gpt_oss_20b': mock_gpt_oss}):
        import importlib
        import gpt_config
        importlib.reload(gpt_config)
        
        # Obtener el cliente
        client = gpt_config.get_llm_client()
        
        # Verificar que se retornó el cliente de gpt-oss-20b
        assert client == mock_client

@patch('gpt_config.is_gpt_oss_available')
def test_get_llm_client_openai_fallback(mock_is_available):
    """Prueba la función get_llm_client cuando se usa el fallback a OpenAI."""
    # Configurar el mock
    mock_is_available.return_value = False
    
    # Crear un mock para el cliente de OpenAI
    mock_client = MagicMock()
    mock_openai = MagicMock()
    mock_openai.OpenAI.return_value = mock_client
    
    # Mockear la importación de openai
    with patch.dict('sys.modules', {'openai': mock_openai}):
        # Configurar variables de entorno
        with patch.dict(os.environ, {
            "USE_OPENAI_FALLBACK": "true",
            "OPENAI_API_KEY": "test-api-key"
        }):
            import importlib
            import gpt_config
            importlib.reload(gpt_config)
            
            # Obtener el cliente
            client = gpt_config.get_llm_client()
            
            # Verificar que se retornó el cliente de OpenAI
            assert client == mock_client

@patch('gpt_config.is_gpt_oss_available')
def test_get_llm_client_no_model_available(mock_is_available):
    """Prueba la función get_llm_client cuando no hay modelo disponible."""
    # Configurar el mock
    mock_is_available.return_value = False
    
    # Configurar variables de entorno
    with patch.dict(os.environ, {
        "USE_OPENAI_FALLBACK": "false"
    }):
        import importlib
        import gpt_config
        importlib.reload(gpt_config)
        
        # Verificar que se lanza una excepción
        with pytest.raises(ValueError) as excinfo:
            gpt_config.get_llm_client()
        
        assert "No se encontró un modelo LLM disponible" in str(excinfo.value)

# Pruebas para generate_text
@patch('gpt_config.get_llm_client')
def test_generate_text_gpt_oss(mock_get_client):
    """Prueba la función generate_text con el cliente de gpt-oss-20b."""
    # Crear un mock para el cliente de gpt-oss-20b
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Esta es una respuesta de prueba."
    mock_client.generate.return_value = mock_response
    
    # Configurar el mock para retornar el cliente
    mock_get_client.return_value = mock_client
    
    # Verificar que el cliente tiene el atributo generate
    assert hasattr(mock_client, "generate")
    
    # Generar texto
    result = generate_text("Hola, ¿cómo estás?", max_tokens=100, temperature=0.5)
    
    # Verificar que se llamó al método generate con los parámetros correctos
    mock_client.generate.assert_called_once_with(
        prompt="Hola, ¿cómo estás?",
        max_tokens=100,
        temperature=0.5,
        top_p=0.9,
        top_k=40
    )
    
    # Verificar el resultado
    assert result == "Esta es una respuesta de prueba."

@patch('gpt_config.get_llm_client')
def test_generate_text_openai(mock_get_client):
    """Prueba la función generate_text con el cliente de OpenAI."""
    # Crear un mock para el cliente de OpenAI
    mock_client = MagicMock()
    mock_chat = MagicMock()
    mock_completions = MagicMock()
    mock_create = MagicMock()
    mock_response = MagicMock()
    mock_choice = MagicMock()
    mock_message = MagicMock()
    
    # Configurar la estructura del cliente de OpenAI
    mock_client.chat = mock_chat
    mock_chat.completions = mock_completions
    mock_completions.create = mock_create
    
    # Configurar la respuesta
    mock_message.content = "Esta es una respuesta de OpenAI."
    mock_choice.message = mock_message
    mock_response.choices = [mock_choice]
    mock_create.return_value = mock_response
    
    # Configurar el mock para retornar el cliente
    mock_get_client.return_value = mock_client
    
    # Verificar que el cliente no tiene el atributo generate
    assert not hasattr(mock_client, "generate")
    
    # Generar texto
    with patch.dict(os.environ, {"OPENAI_MODEL": "gpt-3.5-turbo"}):
        import importlib
        import gpt_config
        importlib.reload(gpt_config)
        
        result = gpt_config.generate_text("Hola, ¿cómo estás?", max_tokens=100, temperature=0.5)
    
    # Verificar que se llamó al método create con los parámetros correctos
    mock_create.assert_called_once()
    args, kwargs = mock_create.call_args
    assert kwargs["model"] == "gpt-3.5-turbo"
    assert kwargs["max_tokens"] == 100
    assert kwargs["temperature"] == 0.5
    assert len(kwargs["messages"]) == 2
    assert kwargs["messages"][0]["role"] == "system"
    assert kwargs["messages"][1]["role"] == "user"
    assert kwargs["messages"][1]["content"] == "Hola, ¿cómo estás?"
    
    # Verificar el resultado
    assert result == "Esta es una respuesta de OpenAI."