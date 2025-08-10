import pytest
from fastapi import status

# Pruebas para los endpoints del dashboard

def test_dashboard_summary(client, auth_headers):
    """Prueba la obtención del resumen del dashboard"""
    response = client.get("/api/dashboard/summary", headers=auth_headers)
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Verificar estructura de la respuesta
    assert "total_applications" in data
    assert "approved_applications" in data
    assert "pending_applications" in data
    assert "rejected_applications" in data
    assert "total_loan_amount" in data
    assert "average_loan_amount" in data
    
    # Verificar tipos de datos
    assert isinstance(data["total_applications"], int)
    assert isinstance(data["approved_applications"], int)
    assert isinstance(data["pending_applications"], int)
    assert isinstance(data["rejected_applications"], int)
    assert isinstance(data["total_loan_amount"], (int, float))
    assert isinstance(data["average_loan_amount"], (int, float))

def test_dashboard_applications_by_status(client, auth_headers):
    """Prueba la obtención de solicitudes por estado"""
    response = client.get("/api/dashboard/applications-by-status", headers=auth_headers)
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Verificar estructura de la respuesta
    assert isinstance(data, list)
    
    # Verificar que cada elemento tiene la estructura correcta
    if len(data) > 0:
        assert "status" in data[0]
        assert "count" in data[0]
        assert isinstance(data[0]["status"], str)
        assert isinstance(data[0]["count"], int)

def test_dashboard_applications_over_time(client, auth_headers):
    """Prueba la obtención de solicitudes a lo largo del tiempo"""
    # Probar con diferentes períodos
    periods = ["week", "month", "year"]
    
    for period in periods:
        response = client.get(f"/api/dashboard/applications-over-time?period={period}", headers=auth_headers)
        
        # Verificar respuesta
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verificar estructura de la respuesta
        assert isinstance(data, list)
        
        # Verificar que cada elemento tiene la estructura correcta
        if len(data) > 0:
            assert "date" in data[0]
            assert "count" in data[0]
            assert isinstance(data[0]["date"], str)
            assert isinstance(data[0]["count"], int)

def test_dashboard_loan_amounts_by_purpose(client, auth_headers):
    """Prueba la obtención de montos de préstamos por propósito"""
    response = client.get("/api/dashboard/loan-amounts-by-purpose", headers=auth_headers)
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Verificar estructura de la respuesta
    assert isinstance(data, list)
    
    # Verificar que cada elemento tiene la estructura correcta
    if len(data) > 0:
        assert "purpose" in data[0]
        assert "total_amount" in data[0]
        assert isinstance(data[0]["purpose"], str)
        assert isinstance(data[0]["total_amount"], (int, float))

def test_dashboard_agent_performance(client, auth_headers):
    """Prueba la obtención del rendimiento de los agentes"""
    response = client.get("/api/dashboard/agent-performance", headers=auth_headers)
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Verificar estructura de la respuesta
    assert isinstance(data, list)
    
    # Verificar que cada elemento tiene la estructura correcta
    if len(data) > 0:
        assert "agent_id" in data[0]
        assert "agent_name" in data[0]
        assert "total_conversations" in data[0]
        assert "successful_conversions" in data[0]
        assert "conversion_rate" in data[0]
        assert isinstance(data[0]["agent_id"], int)
        assert isinstance(data[0]["agent_name"], str)
        assert isinstance(data[0]["total_conversations"], int)
        assert isinstance(data[0]["successful_conversions"], int)
        assert isinstance(data[0]["conversion_rate"], (int, float))

def test_dashboard_campaign_performance(client, auth_headers):
    """Prueba la obtención del rendimiento de las campañas"""
    response = client.get("/api/dashboard/campaign-performance", headers=auth_headers)
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Verificar estructura de la respuesta
    assert isinstance(data, list)
    
    # Verificar que cada elemento tiene la estructura correcta
    if len(data) > 0:
        assert "campaign_id" in data[0]
        assert "campaign_name" in data[0]
        assert "total_applications" in data[0]
        assert "approved_applications" in data[0]
        assert "total_loan_amount" in data[0]
        assert isinstance(data[0]["campaign_id"], int)
        assert isinstance(data[0]["campaign_name"], str)
        assert isinstance(data[0]["total_applications"], int)
        assert isinstance(data[0]["approved_applications"], int)
        assert isinstance(data[0]["total_loan_amount"], (int, float))

def test_dashboard_recent_applications(client, auth_headers):
    """Prueba la obtención de solicitudes recientes"""
    response = client.get("/api/dashboard/recent-applications?limit=5", headers=auth_headers)
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Verificar estructura de la respuesta
    assert isinstance(data, list)
    assert len(data) <= 5  # No debe exceder el límite
    
    # Verificar que cada elemento tiene la estructura correcta
    if len(data) > 0:
        assert "id" in data[0]
        assert "client_name" in data[0]
        assert "amount" in data[0]
        assert "status" in data[0]
        assert "application_date" in data[0]