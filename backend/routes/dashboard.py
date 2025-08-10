from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any
from datetime import datetime, timedelta

# Importaciones internas
from database import get_db
import models
from routes.users import get_current_active_user, get_current_admin_user

router = APIRouter()

@router.get("/summary")
async def get_dashboard_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # Verificar si el usuario es administrador
    is_admin = current_user.is_admin
    
    # Filtro base para las consultas
    base_filter = []
    if not is_admin:
        # Si no es admin, solo ver sus propios agentes
        agent_ids = [agent.id for agent in db.query(models.Agent).filter(models.Agent.owner_id == current_user.id).all()]
        base_filter.append(models.Interaction.agent_id.in_(agent_ids))
    
    # Fecha de inicio para las estadísticas (último mes)
    start_date = datetime.utcnow() - timedelta(days=30)
    base_filter.append(models.Interaction.created_at >= start_date)
    
    # Total de interacciones en el último mes
    total_interactions = db.query(func.count(models.Interaction.id)).filter(*base_filter).scalar() or 0
    
    # Total de solicitudes de crédito
    credit_applications_filter = base_filter.copy()
    if not is_admin:
        # Si no es admin, solo ver sus propias solicitudes
        credit_applications_filter = [models.CreditApplication.client_id.in_(
            db.query(models.Client.id).join(models.Interaction, models.Interaction.client_id == models.Client.id)
            .filter(models.Interaction.agent_id.in_(agent_ids))
        )]
    
    total_applications = db.query(func.count(models.CreditApplication.id)).filter(
        models.CreditApplication.created_at >= start_date,
        *credit_applications_filter
    ).scalar() or 0
    
    # Solicitudes aprobadas
    approved_applications = db.query(func.count(models.CreditApplication.id)).filter(
        models.CreditApplication.created_at >= start_date,
        models.CreditApplication.status == models.CreditStatus.APPROVED,
        *credit_applications_filter
    ).scalar() or 0
    
    # Tasa de conversión
    conversion_rate = (approved_applications / total_applications * 100) if total_applications > 0 else 0
    
    # Agentes activos
    if is_admin:
        active_agents = db.query(func.count(models.Agent.id)).filter(
            models.Agent.status == models.AgentStatus.ACTIVE
        ).scalar() or 0
    else:
        active_agents = db.query(func.count(models.Agent.id)).filter(
            models.Agent.owner_id == current_user.id,
            models.Agent.status == models.AgentStatus.ACTIVE
        ).scalar() or 0
    
    # Campañas activas
    if is_admin:
        active_campaigns = db.query(func.count(models.Campaign.id)).filter(
            models.Campaign.status == models.CampaignStatus.RUNNING
        ).scalar() or 0
    else:
        active_campaigns = db.query(func.count(models.Campaign.id)).filter(
            models.Campaign.creator_id == current_user.id,
            models.Campaign.status == models.CampaignStatus.RUNNING
        ).scalar() or 0
    
    return {
        "total_interactions": total_interactions,
        "total_applications": total_applications,
        "approved_applications": approved_applications,
        "conversion_rate": round(conversion_rate, 2),
        "active_agents": active_agents,
        "active_campaigns": active_campaigns
    }

@router.get("/interactions/daily")
async def get_daily_interactions(days: int = 30, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # Verificar si el usuario es administrador
    is_admin = current_user.is_admin
    
    # Filtro base para las consultas
    base_filter = []
    if not is_admin:
        # Si no es admin, solo ver sus propios agentes
        agent_ids = [agent.id for agent in db.query(models.Agent).filter(models.Agent.owner_id == current_user.id).all()]
        base_filter.append(models.Interaction.agent_id.in_(agent_ids))
    
    # Fecha de inicio para las estadísticas
    start_date = datetime.utcnow() - timedelta(days=days)
    base_filter.append(models.Interaction.created_at >= start_date)
    
    # Consulta para obtener interacciones diarias
    from sqlalchemy import func, cast, Date
    
    daily_interactions = db.query(
        cast(models.Interaction.created_at, Date).label('date'),
        func.count(models.Interaction.id).label('count')
    ).filter(*base_filter).group_by('date').order_by('date').all()
    
    # Formatear resultados
    result = [{
        "date": str(day.date),
        "count": day.count
    } for day in daily_interactions]
    
    return result

@router.get("/agents/performance")
async def get_agents_performance(days: int = 30, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # Verificar si el usuario es administrador
    is_admin = current_user.is_admin
    
    # Filtro base para las consultas
    base_filter = []
    if not is_admin:
        # Si no es admin, solo ver sus propios agentes
        base_filter.append(models.Agent.owner_id == current_user.id)
    
    # Fecha de inicio para las estadísticas
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Obtener rendimiento de los agentes
    agents_performance = db.query(
        models.Agent.id,
        models.Agent.name,
        func.count(models.Interaction.id).label('interactions'),
        func.count(models.CreditApplication.id).label('applications'),
        func.sum(case((models.CreditApplication.status == models.CreditStatus.APPROVED, 1), else_=0)).label('approved')
    ).outerjoin(
        models.Interaction, models.Interaction.agent_id == models.Agent.id
    ).outerjoin(
        models.CreditApplication,
        models.CreditApplication.client_id == models.Interaction.client_id
    ).filter(
        *base_filter,
        models.Interaction.created_at >= start_date if models.Interaction.created_at else True
    ).group_by(
        models.Agent.id, models.Agent.name
    ).all()
    
    # Formatear resultados
    result = []
    for agent in agents_performance:
        conversion_rate = (agent.approved / agent.applications * 100) if agent.applications > 0 else 0
        result.append({
            "agent_id": agent.id,
            "agent_name": agent.name,
            "interactions": agent.interactions,
            "applications": agent.applications,
            "approved": agent.approved,
            "conversion_rate": round(conversion_rate, 2)
        })
    
    # Ordenar por tasa de conversión
    result.sort(key=lambda x: x["conversion_rate"], reverse=True)
    
    return result

@router.get("/campaigns/performance")
async def get_campaigns_performance(days: int = 30, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # Verificar si el usuario es administrador
    is_admin = current_user.is_admin
    
    # Filtro base para las consultas
    base_filter = []
    if not is_admin:
        # Si no es admin, solo ver sus propias campañas
        base_filter.append(models.Campaign.creator_id == current_user.id)
    
    # Fecha de inicio para las estadísticas
    start_date = datetime.utcnow() - timedelta(days=days)
    base_filter.append(models.Campaign.created_at >= start_date)
    
    # Obtener rendimiento de las campañas
    campaigns_performance = db.query(
        models.Campaign.id,
        models.Campaign.name,
        models.Campaign.campaign_type,
        models.Campaign.status,
        func.count(models.Interaction.id).label('interactions')
    ).outerjoin(
        models.Interaction, models.Interaction.campaign_id == models.Campaign.id
    ).filter(
        *base_filter
    ).group_by(
        models.Campaign.id, models.Campaign.name, models.Campaign.campaign_type, models.Campaign.status
    ).all()
    
    # Formatear resultados
    result = [{
        "campaign_id": campaign.id,
        "campaign_name": campaign.name,
        "campaign_type": campaign.campaign_type.value if campaign.campaign_type else None,
        "status": campaign.status.value if campaign.status else None,
        "interactions": campaign.interactions
    } for campaign in campaigns_performance]
    
    # Ordenar por número de interacciones
    result.sort(key=lambda x: x["interactions"], reverse=True)
    
    return result

@router.get("/credit-applications/status")
async def get_credit_applications_status(days: int = 30, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # Verificar si el usuario es administrador
    is_admin = current_user.is_admin
    
    # Filtro base para las consultas
    base_filter = []
    if not is_admin:
        # Si no es admin, solo ver sus propias solicitudes
        agent_ids = [agent.id for agent in db.query(models.Agent).filter(models.Agent.owner_id == current_user.id).all()]
        client_ids = db.query(models.Client.id).join(
            models.Interaction, models.Interaction.client_id == models.Client.id
        ).filter(models.Interaction.agent_id.in_(agent_ids)).distinct().all()
        client_ids = [client_id for (client_id,) in client_ids]
        base_filter.append(models.CreditApplication.client_id.in_(client_ids))
    
    # Fecha de inicio para las estadísticas
    start_date = datetime.utcnow() - timedelta(days=days)
    base_filter.append(models.CreditApplication.created_at >= start_date)
    
    # Obtener estado de las solicitudes de crédito
    status_counts = db.query(
        models.CreditApplication.status,
        func.count(models.CreditApplication.id).label('count')
    ).filter(
        *base_filter
    ).group_by(
        models.CreditApplication.status
    ).all()
    
    # Formatear resultados
    result = [{
        "status": status.status.value if status.status else None,
        "count": status.count
    } for status in status_counts]
    
    return result

@router.get("/top-clients")
async def get_top_clients(limit: int = 10, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    # Esta ruta solo está disponible para administradores
    
    # Obtener los clientes con más solicitudes de crédito aprobadas
    top_clients = db.query(
        models.Client.id,
        models.Client.full_name,
        func.count(models.CreditApplication.id).label('total_applications'),
        func.sum(case((models.CreditApplication.status == models.CreditStatus.APPROVED, 1), else_=0)).label('approved_applications'),
        func.sum(models.CreditApplication.amount).label('total_amount')
    ).join(
        models.CreditApplication, models.CreditApplication.client_id == models.Client.id
    ).group_by(
        models.Client.id, models.Client.full_name
    ).order_by(
        desc('approved_applications')
    ).limit(limit).all()
    
    # Formatear resultados
    result = [{
        "client_id": client.id,
        "client_name": client.full_name,
        "total_applications": client.total_applications,
        "approved_applications": client.approved_applications,
        "total_amount": float(client.total_amount) if client.total_amount else 0
    } for client in top_clients]
    
    return result