from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

# Importaciones internas
from database import get_db
import models
from routes.users import get_current_active_user, get_current_admin_user

router = APIRouter()

# Modelos Pydantic para validación de datos
class AgentBase(BaseModel):
    name: str
    description: str
    configuration: Dict[str, Any] = {}

class AgentCreate(AgentBase):
    pass

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None

class AgentResponse(AgentBase):
    id: int
    status: str
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# Rutas
@router.post("/", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(agent: AgentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # Crear nuevo agente
    db_agent = models.Agent(
        name=agent.name,
        description=agent.description,
        configuration=agent.configuration,
        owner_id=current_user.id
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

@router.get("/", response_model=List[AgentResponse])
async def read_agents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # Si es admin, puede ver todos los agentes, si no, solo los suyos
    if current_user.is_admin:
        agents = db.query(models.Agent).offset(skip).limit(limit).all()
    else:
        agents = db.query(models.Agent).filter(models.Agent.owner_id == current_user.id).offset(skip).limit(limit).all()
    return agents

@router.get("/{agent_id}", response_model=AgentResponse)
async def read_agent(agent_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Verificar permisos
    if not current_user.is_admin and db_agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return db_agent

@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(agent_id: int, agent: AgentUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Verificar permisos
    if not current_user.is_admin and db_agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Actualizar campos si están presentes en la solicitud
    update_data = agent.dict(exclude_unset=True)
    
    # Si se actualiza el estado, verificar que sea un valor válido
    if "status" in update_data:
        try:
            update_data["status"] = models.AgentStatus(update_data["status"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status value")
    
    for key, value in update_data.items():
        setattr(db_agent, key, value)
    
    db.commit()
    db.refresh(db_agent)
    return db_agent

@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(agent_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Verificar permisos
    if not current_user.is_admin and db_agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db.delete(db_agent)
    db.commit()
    return None

@router.post("/{agent_id}/activate", response_model=AgentResponse)
async def activate_agent(agent_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Verificar permisos
    if not current_user.is_admin and db_agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db_agent.status = models.AgentStatus.ACTIVE
    db.commit()
    db.refresh(db_agent)
    return db_agent

@router.post("/{agent_id}/deactivate", response_model=AgentResponse)
async def deactivate_agent(agent_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Verificar permisos
    if not current_user.is_admin and db_agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db_agent.status = models.AgentStatus.INACTIVE
    db.commit()
    db.refresh(db_agent)
    return db_agent

@router.get("/{agent_id}/performance", response_model=List[Dict[str, Any]])
async def get_agent_performance(agent_id: int, days: int = 30, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Verificar permisos
    if not current_user.is_admin and db_agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Obtener métricas de rendimiento
    from datetime import timedelta
    from sqlalchemy import func
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    performance_metrics = db.query(models.AgentPerformance).filter(
        models.AgentPerformance.agent_id == agent_id,
        models.AgentPerformance.date >= cutoff_date
    ).order_by(models.AgentPerformance.date).all()
    
    return [{
        "date": metric.date,
        "interactions_count": metric.interactions_count,
        "successful_applications": metric.successful_applications,
        "conversion_rate": metric.conversion_rate,
        "average_response_time": metric.average_response_time,
        **metric.metrics_data
    } for metric in performance_metrics]