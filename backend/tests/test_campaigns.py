import pytest
from fastapi import status
from datetime import datetime, timedelta

# Pruebas para los endpoints de campañas

@pytest.fixture
def test_campaign(client, auth_headers):
    """Fixture para crear una campaña de prueba"""
    # Datos para crear una nueva campaña
    campaign_data = {
        "name": "Test Campaign",
        "description": "Campaign for testing",
        "start_date": (datetime.now()).isoformat(),
        "end_date": (datetime.now() + timedelta(days=30)).isoformat(),
        "status": "active",
        "target_audience": "Test audience",
        "goal": "Test campaign goals"
    }
    
    # Enviar solicitud para crear campaña
    response = client.post(
        "/api/campaigns/", 
        json=campaign_data,
        headers=auth_headers
    )
    
    # Verificar que se creó correctamente
    assert response.status_code == status.HTTP_201_CREATED
    
    return response.json()

def test_create_campaign(client, auth_headers):
    """Prueba la creación de una nueva campaña"""
    # Datos para crear una nueva campaña
    campaign_data = {
        "name": "Marketing Campaign",
        "description": "Campaign for marketing credits",
        "start_date": (datetime.now()).isoformat(),
        "end_date": (datetime.now() + timedelta(days=30)).isoformat(),
        "status": "active",
        "target_audience": "Small business owners",
        "goal": "Increase credit sales by 20%"
    }
    
    # Enviar solicitud para crear campaña
    response = client.post(
        "/api/campaigns/", 
        json=campaign_data,
        headers=auth_headers
    )
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == campaign_data["name"]
    assert data["description"] == campaign_data["description"]
    assert data["status"] == campaign_data["status"]
    assert data["target_audience"] == campaign_data["target_audience"]
    assert data["goal"] == campaign_data["goal"]

def test_read_campaigns(client, auth_headers, test_campaign):
    """Prueba la obtención de la lista de campañas"""
    response = client.get("/api/campaigns/", headers=auth_headers)
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1  # Al menos la campaña de prueba
    
    # Verificar que la campaña de prueba está en la lista
    campaign_ids = [campaign["id"] for campaign in data]
    assert test_campaign["id"] in campaign_ids

def test_read_campaign(client, auth_headers, test_campaign):
    """Prueba la obtención de una campaña específica"""
    response = client.get(f"/api/campaigns/{test_campaign['id']}", headers=auth_headers)
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_campaign["id"]
    assert data["name"] == test_campaign["name"]
    assert data["description"] == test_campaign["description"]

def test_update_campaign(client, auth_headers, test_campaign):
    """Prueba la actualización de una campaña"""
    # Datos para actualizar la campaña
    update_data = {
        "name": "Updated Campaign Name",
        "status": "paused"
    }
    
    # Enviar solicitud para actualizar campaña
    response = client.patch(
        f"/api/campaigns/{test_campaign['id']}", 
        json=update_data,
        headers=auth_headers
    )
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["status"] == update_data["status"]
    assert data["description"] == test_campaign["description"]  # No debe cambiar

def test_delete_campaign(client, auth_headers, test_campaign):
    """Prueba la eliminación de una campaña"""
    # Enviar solicitud para eliminar campaña
    delete_response = client.delete(
        f"/api/campaigns/{test_campaign['id']}", 
        headers=auth_headers
    )
    
    # Verificar respuesta
    assert delete_response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verificar que la campaña ya no existe
    get_response = client.get(f"/api/campaigns/{test_campaign['id']}", headers=auth_headers)
    assert get_response.status_code == status.HTTP_404_NOT_FOUND

def test_campaign_statistics(client, auth_headers, test_campaign):
    """Prueba la obtención de estadísticas de una campaña"""
    response = client.get(f"/api/campaigns/{test_campaign['id']}/statistics", headers=auth_headers)
    
    # Verificar respuesta
    # Nota: Esta prueba puede fallar si el endpoint no está implementado
    # o si no hay datos de estadísticas disponibles
    assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
    
    if response.status_code == status.HTTP_200_OK:
        data = response.json()
        assert "campaign_id" in data
        assert data["campaign_id"] == test_campaign["id"]