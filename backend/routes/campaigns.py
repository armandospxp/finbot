from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
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
class CampaignBase(BaseModel):
    name: str
    description: str
    campaign_type: str  # whatsapp, email, sms
    start_date: datetime
    end_date: Optional[datetime] = None
    target_audience: Dict[str, Any] = {}
    message_template: str
    agent_id: int

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    campaign_type: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    target_audience: Optional[Dict[str, Any]] = None
    message_template: Optional[str] = None
    agent_id: Optional[int] = None

class CampaignResponse(CampaignBase):
    id: int
    status: str
    creator_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# Función para ejecutar campaña en segundo plano
def run_campaign_task(campaign_id: int, db: Session):
    # Aquí iría la lógica para ejecutar la campaña
    # Por ejemplo, enviar mensajes a través de WhatsApp, Email o SMS
    # Actualizar el estado de la campaña
    db_campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if db_campaign:
        db_campaign.status = models.CampaignStatus.RUNNING
        db.commit()

# Rutas
@router.post("/", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(campaign: CampaignCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # Verificar que el agente existe
    db_agent = db.query(models.Agent).filter(models.Agent.id == campaign.agent_id).first()
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Verificar permisos sobre el agente
    if not current_user.is_admin and db_agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions for this agent")
    
    # Validar el tipo de campaña
    try:
        campaign_type = models.CampaignType(campaign.campaign_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid campaign type")
    
    # Crear nueva campaña
    db_campaign = models.Campaign(
        name=campaign.name,
        description=campaign.description,
        campaign_type=campaign_type,
        start_date=campaign.start_date,
        end_date=campaign.end_date,
        target_audience=campaign.target_audience,
        message_template=campaign.message_template,
        agent_id=campaign.agent_id,
        creator_id=current_user.id,
        status=models.CampaignStatus.DRAFT
    )
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

@router.get("/", response_model=List[CampaignResponse])
async def read_campaigns(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # Si es admin, puede ver todas las campañas, si no, solo las suyas
    if current_user.is_admin:
        campaigns = db.query(models.Campaign).offset(skip).limit(limit).all()
    else:
        campaigns = db.query(models.Campaign).filter(models.Campaign.creator_id == current_user.id).offset(skip).limit(limit).all()
    return campaigns

@router.get("/{campaign_id}", response_model=CampaignResponse)
async def read_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if db_campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Verificar permisos
    if not current_user.is_admin and db_campaign.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return db_campaign

@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(campaign_id: int, campaign: CampaignUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if db_campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Verificar permisos
    if not current_user.is_admin and db_campaign.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # No permitir modificar campañas en ejecución o completadas
    if db_campaign.status in [models.CampaignStatus.RUNNING, models.CampaignStatus.COMPLETED]:
        raise HTTPException(status_code=400, detail="Cannot modify a running or completed campaign")
    
    # Actualizar campos si están presentes en la solicitud
    update_data = campaign.dict(exclude_unset=True)
    
    # Si se actualiza el tipo de campaña, verificar que sea un valor válido
    if "campaign_type" in update_data:
        try:
            update_data["campaign_type"] = models.CampaignType(update_data["campaign_type"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid campaign type")
    
    # Si se actualiza el estado, verificar que sea un valor válido
    if "status" in update_data:
        try:
            update_data["status"] = models.CampaignStatus(update_data["status"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status value")
    
    # Si se actualiza el agente, verificar que exista y que el usuario tenga permisos
    if "agent_id" in update_data:
        db_agent = db.query(models.Agent).filter(models.Agent.id == update_data["agent_id"]).first()
        if db_agent is None:
            raise HTTPException(status_code=404, detail="Agent not found")
        if not current_user.is_admin and db_agent.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions for this agent")
    
    for key, value in update_data.items():
        setattr(db_campaign, key, value)
    
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if db_campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Verificar permisos
    if not current_user.is_admin and db_campaign.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # No permitir eliminar campañas en ejecución
    if db_campaign.status == models.CampaignStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Cannot delete a running campaign")
    
    db.delete(db_campaign)
    db.commit()
    return None

@router.post("/{campaign_id}/schedule", response_model=CampaignResponse)
async def schedule_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if db_campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Verificar permisos
    if not current_user.is_admin and db_campaign.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Solo se pueden programar campañas en estado borrador
    if db_campaign.status != models.CampaignStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft campaigns can be scheduled")
    
    db_campaign.status = models.CampaignStatus.SCHEDULED
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

@router.post("/{campaign_id}/start", response_model=CampaignResponse)
async def start_campaign(campaign_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if db_campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Verificar permisos
    if not current_user.is_admin and db_campaign.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Solo se pueden iniciar campañas programadas o en borrador
    if db_campaign.status not in [models.CampaignStatus.SCHEDULED, models.CampaignStatus.DRAFT]:
        raise HTTPException(status_code=400, detail="Only scheduled or draft campaigns can be started")
    
    # Iniciar la campaña en segundo plano
    background_tasks.add_task(run_campaign_task, campaign_id, db)
    
    # Actualizar el estado de la campaña
    db_campaign.status = models.CampaignStatus.RUNNING
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

@router.post("/{campaign_id}/stop", response_model=CampaignResponse)
async def stop_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if db_campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Verificar permisos
    if not current_user.is_admin and db_campaign.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Solo se pueden detener campañas en ejecución
    if db_campaign.status != models.CampaignStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Only running campaigns can be stopped")
    
    # Aquí iría la lógica para detener la campaña
    
    db_campaign.status = models.CampaignStatus.CANCELLED
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

@router.get("/{campaign_id}/stats", response_model=Dict[str, Any])
async def get_campaign_stats(campaign_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if db_campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Verificar permisos
    if not current_user.is_admin and db_campaign.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Obtener estadísticas de la campaña
    from sqlalchemy import func
    
    total_interactions = db.query(func.count(models.Interaction.id)).filter(
        models.Interaction.campaign_id == campaign_id
    ).scalar() or 0
    
    # Aquí se podrían calcular más estadísticas
    
    return {
        "campaign_id": campaign_id,
        "name": db_campaign.name,
        "status": db_campaign.status.value,
        "total_interactions": total_interactions,
        "start_date": db_campaign.start_date,
        "end_date": db_campaign.end_date,
        # Más estadísticas
    }