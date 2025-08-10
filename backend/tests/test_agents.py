import pytest
from fastapi import status

# Pruebas para los endpoints de agentes

@pytest.fixture
def test_agent(client, auth_headers):
    """Fixture para crear un agente de prueba"""
    # Datos para crear un nuevo agente
    agent_data = {
        "name": "Test Agent",
        "description": "Agent for testing",
        "agent_type": "credit_sales",
        "model_name": "gpt-3.5-turbo",
        "temperature": 0.7,
        "system_prompt": "You are a helpful assistant."
    }
    
    # Enviar solicitud para crear agente
    response = client.post(
        "/api/agents/", 
        json=agent_data,
        headers=auth_headers
    )
    
    # Verificar que se creó correctamente
    assert response.status_code == status.HTTP_201_CREATED
    
    return response.json()

def test_create_agent(client, auth_headers):
    """Prueba la creación de un nuevo agente"""
    # Datos para crear un nuevo agente
    agent_data = {
        "name": "Sales Agent",
        "description": "Agent for selling credits",
        "agent_type": "credit_sales",
        "model_name": "gpt-3.5-turbo",
        "temperature": 0.7,
        "system_prompt": "You are a helpful assistant specialized in credit sales."
    }
    
    # Enviar solicitud para crear agente
    response = client.post(
        "/api/agents/", 
        json=agent_data,
        headers=auth_headers
    )
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == agent_data["name"]
    assert data["description"] == agent_data["description"]
    assert data["agent_type"] == agent_data["agent_type"]
    assert data["model_name"] == agent_data["model_name"]
    assert data["temperature"] == agent_data["temperature"]
    assert data["system_prompt"] == agent_data["system_prompt"]

def test_read_agents(client, auth_headers, test_agent):
    """Prueba la obtención de la lista de agentes"""
    response = client.get("/api/agents/", headers=auth_headers)
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1  # Al menos el agente de prueba
    
    # Verificar que el agente de prueba está en la lista
    agent_ids = [agent["id"] for agent in data]
    assert test_agent["id"] in agent_ids

def test_read_agent(client, auth_headers, test_agent):
    """Prueba la obtención de un agente específico"""
    response = client.get(f"/api/agents/{test_agent['id']}", headers=auth_headers)
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_agent["id"]
    assert data["name"] == test_agent["name"]
    assert data["description"] == test_agent["description"]

def test_update_agent(client, auth_headers, test_agent):
    """Prueba la actualización de un agente"""
    # Datos para actualizar el agente
    update_data = {
        "name": "Updated Agent Name",
        "temperature": 0.8
    }
    
    # Enviar solicitud para actualizar agente
    response = client.patch(
        f"/api/agents/{test_agent['id']}", 
        json=update_data,
        headers=auth_headers
    )
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["temperature"] == update_data["temperature"]
    assert data["description"] == test_agent["description"]  # No debe cambiar

def test_delete_agent(client, auth_headers, test_agent):
    """Prueba la eliminación de un agente"""
    # Enviar solicitud para eliminar agente
    delete_response = client.delete(
        f"/api/agents/{test_agent['id']}", 
        headers=auth_headers
    )
    
    # Verificar respuesta
    assert delete_response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verificar que el agente ya no existe
    get_response = client.get(f"/api/agents/{test_agent['id']}", headers=auth_headers)
    assert get_response.status_code == status.HTTP_404_NOT_FOUND

def test_agent_conversation(client, auth_headers, test_agent):
    """Prueba la conversación con un agente"""
    # Datos para la conversación
    conversation_data = {
        "message": "Hello, I need information about credit options."
    }
    
    # Enviar solicitud para conversar con el agente
    response = client.post(
        f"/api/agents/{test_agent['id']}/conversation", 
        json=conversation_data,
        headers=auth_headers
    )
    
    # Verificar respuesta
    # Nota: Esta prueba puede fallar si no hay un modelo real disponible
    # En un entorno de prueba real, se debería mockear la respuesta del modelo
    assert response.status_code in [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE]
    
    if response.status_code == status.HTTP_200_OK:
        data = response.json()
        assert "response" in data
        assert "status" in data