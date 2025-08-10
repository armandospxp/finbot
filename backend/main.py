from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List
import uvicorn
import os
from dotenv import load_dotenv

# Importaciones internas
from database import get_db, engine
import models
from routes import agents, campaigns, users, dashboard, credit_policies, applications, chat

# Cargar variables de entorno
load_dotenv()

# Crear tablas en la base de datos
models.Base.metadata.create_all(bind=engine)

# Inicializar la aplicación FastAPI
app = FastAPI(
    title="Sistema de Agentes Vendedores de Créditos",
    description="API para gestionar agentes virtuales de venta de créditos",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["campaigns"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(credit_policies.router, prefix="/api/policies", tags=["policies"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(applications.router)

@app.get("/")
async def root():
    return {"message": "Bienvenido al API del Sistema de Agentes Vendedores de Créditos"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    # Configuración para desarrollo
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )