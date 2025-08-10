from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel
import logging

# Importaciones internas
from database import get_db
import models
from routes.users import get_current_active_user
from gpt_config import generate_text

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Modelos Pydantic para validación de datos
class ChatRequest(BaseModel):
    agent_id: int
    message: str
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    metadata: Optional[Dict[str, Any]] = None

@router.post("/test", response_model=ChatResponse)
async def test_chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Endpoint para probar el chat con un agente sin usar Twilio.
    Este endpoint es solo para desarrollo y pruebas.
    """
    # Verificar que el agente existe
    agent = db.query(models.Agent).filter(models.Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Verificar permisos
    if not current_user.is_admin and agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    try:
        # Construir el prompt para el modelo
        prompt = f"""Eres un agente virtual de ventas de créditos llamado {agent.name}.
        
        Información del agente:
        {agent.description}
        
        Configuración adicional:
        {agent.configuration}
        
        Mensaje del cliente: {request.message}
        
        Responde de manera amable, profesional y concisa. Proporciona información precisa sobre los productos de crédito y ayuda al cliente a resolver sus dudas.
        """
        
        # Generar respuesta usando el modelo
        response_text = generate_text(prompt)
        
        # Registrar la interacción para análisis (opcional)
        # Esto podría usarse para mejorar el modelo en el futuro
        
        return ChatResponse(
            response=response_text,
            metadata={
                "agent_id": agent.id,
                "agent_name": agent.name,
                "prompt_tokens": len(prompt.split()),
                "response_tokens": len(response_text.split()),
            }
        )
    
    except Exception as e:
        logger.error(f"Error al generar respuesta: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar respuesta: {str(e)}"
        )