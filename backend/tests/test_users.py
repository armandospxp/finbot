import pytest
from fastapi import status

# Pruebas para los endpoints de usuarios

def test_create_user(client, auth_headers):
    """Prueba la creación de un nuevo usuario"""
    # Datos para crear un nuevo usuario
    user_data = {
        "email": "newuser@example.com",
        "password": "newpassword",
        "full_name": "New User",
        "is_admin": False
    }
    
    # Enviar solicitud para crear usuario
    response = client.post(
        "/api/users/", 
        json=user_data,
        headers=auth_headers
    )
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["full_name"] == user_data["full_name"]
    assert "password" not in data  # Asegurar que la contraseña no se devuelve

def test_read_users(client, auth_headers, test_user):
    """Prueba la obtención de la lista de usuarios"""
    response = client.get("/api/users/", headers=auth_headers)
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1  # Al menos el usuario de prueba
    
    # Verificar que el usuario de prueba está en la lista
    user_emails = [user["email"] for user in data]
    assert test_user.email in user_emails

def test_read_user(client, auth_headers, test_user):
    """Prueba la obtención de un usuario específico"""
    response = client.get(f"/api/users/{test_user.id}", headers=auth_headers)
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.full_name

def test_update_user(client, auth_headers, test_user):
    """Prueba la actualización de un usuario"""
    # Datos para actualizar el usuario
    update_data = {
        "full_name": "Updated Name"
    }
    
    # Enviar solicitud para actualizar usuario
    response = client.patch(
        f"/api/users/{test_user.id}", 
        json=update_data,
        headers=auth_headers
    )
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["full_name"] == update_data["full_name"]
    assert data["email"] == test_user.email  # El email no debe cambiar

def test_delete_user(client, auth_headers, test_user):
    """Prueba la eliminación de un usuario"""
    # Crear un usuario para eliminar
    user_data = {
        "email": "delete@example.com",
        "password": "deletepassword",
        "full_name": "Delete User",
        "is_admin": False
    }
    
    create_response = client.post(
        "/api/users/", 
        json=user_data,
        headers=auth_headers
    )
    
    new_user_id = create_response.json()["id"]
    
    # Enviar solicitud para eliminar usuario
    delete_response = client.delete(
        f"/api/users/{new_user_id}", 
        headers=auth_headers
    )
    
    # Verificar respuesta
    assert delete_response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verificar que el usuario ya no existe
    get_response = client.get(f"/api/users/{new_user_id}", headers=auth_headers)
    assert get_response.status_code == status.HTTP_404_NOT_FOUND

def test_login(client, test_user):
    """Prueba el inicio de sesión"""
    # Datos para iniciar sesión
    login_data = {
        "username": test_user.email,
        "password": "testpassword"
    }
    
    # Enviar solicitud para iniciar sesión
    response = client.post("/api/users/token", data=login_data)
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client):
    """Prueba el inicio de sesión con credenciales inválidas"""
    # Datos para iniciar sesión con credenciales inválidas
    login_data = {
        "username": "wrong@example.com",
        "password": "wrongpassword"
    }
    
    # Enviar solicitud para iniciar sesión
    response = client.post("/api/users/token", data=login_data)
    
    # Verificar respuesta
    assert response.status_code == status.HTTP_401_UNAUTHORIZED