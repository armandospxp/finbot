import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app

# Configurar base de datos de prueba en memoria
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Crear las tablas en la base de datos de prueba
    Base.metadata.create_all(bind=engine)
    
    # Crear una sesión de prueba
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        
    # Limpiar las tablas después de cada prueba
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    # Sobreescribir la dependencia get_db para usar la base de datos de prueba
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Crear un cliente de prueba
    with TestClient(app) as c:
        yield c
    
    # Restaurar la dependencia original
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def test_user(db):
    """Fixture para crear un usuario de prueba"""
    from models import User
    from passlib.context import CryptContext
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Crear un usuario de prueba
    user = User(
        email="test@example.com",
        hashed_password=pwd_context.hash("testpassword"),
        full_name="Test User",
        is_admin=True
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

@pytest.fixture(scope="function")
def auth_headers(client, test_user):
    """Fixture para obtener headers de autenticación"""
    from routes.users import create_access_token
    
    # Crear un token de acceso para el usuario de prueba
    access_token = create_access_token(data={"sub": test_user.email})
    
    # Devolver los headers con el token
    return {"Authorization": f"Bearer {access_token}"}