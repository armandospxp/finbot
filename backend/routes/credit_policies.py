from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import os
import shutil
from pathlib import Path

# Importaciones internas
from database import get_db
import models
from routes.users import get_current_active_user, get_current_admin_user

router = APIRouter()

# Modelos Pydantic para validación de datos
class CreditPolicyBase(BaseModel):
    name: str
    description: str

class CreditPolicyCreate(CreditPolicyBase):
    pass

class CreditPolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class CreditPolicyResponse(CreditPolicyBase):
    id: int
    is_active: bool
    original_document: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# Función para procesar el documento PDF en segundo plano
def process_policy_document(policy_id: int, file_path: str, db: Session):
    try:
        # Aquí iría la lógica para procesar el documento PDF
        # Por ejemplo, extraer texto, procesarlo con LangChain, etc.
        # Y luego almacenar el contenido procesado en la base de datos
        
        # Simulación de procesamiento
        import time
        time.sleep(2)  # Simular procesamiento
        
        # Actualizar la política con el contenido procesado
        db_policy = db.query(models.CreditPolicy).filter(models.CreditPolicy.id == policy_id).first()
        if db_policy:
            db_policy.policy_content = "Contenido procesado del documento de política de crédito"
            db.commit()
    except Exception as e:
        # Manejar errores
        print(f"Error processing policy document: {str(e)}")

# Rutas
@router.post("/", response_model=CreditPolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_credit_policy(policy: CreditPolicyCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    # Solo los administradores pueden crear políticas de crédito
    
    # Crear nueva política
    db_policy = models.CreditPolicy(
        name=policy.name,
        description=policy.description,
        is_active=True
    )
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.get("/", response_model=List[CreditPolicyResponse])
async def read_credit_policies(skip: int = 0, limit: int = 100, active_only: bool = False, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # Filtrar políticas
    query = db.query(models.CreditPolicy)
    if active_only:
        query = query.filter(models.CreditPolicy.is_active == True)
    
    policies = query.offset(skip).limit(limit).all()
    return policies

@router.get("/{policy_id}", response_model=CreditPolicyResponse)
async def read_credit_policy(policy_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_policy = db.query(models.CreditPolicy).filter(models.CreditPolicy.id == policy_id).first()
    if db_policy is None:
        raise HTTPException(status_code=404, detail="Credit policy not found")
    return db_policy

@router.put("/{policy_id}", response_model=CreditPolicyResponse)
async def update_credit_policy(policy_id: int, policy: CreditPolicyUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    # Solo los administradores pueden actualizar políticas de crédito
    
    db_policy = db.query(models.CreditPolicy).filter(models.CreditPolicy.id == policy_id).first()
    if db_policy is None:
        raise HTTPException(status_code=404, detail="Credit policy not found")
    
    # Actualizar campos si están presentes en la solicitud
    update_data = policy.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_policy, key, value)
    
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_credit_policy(policy_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    # Solo los administradores pueden eliminar políticas de crédito
    
    db_policy = db.query(models.CreditPolicy).filter(models.CreditPolicy.id == policy_id).first()
    if db_policy is None:
        raise HTTPException(status_code=404, detail="Credit policy not found")
    
    db.delete(db_policy)
    db.commit()
    return None

@router.post("/{policy_id}/upload", response_model=CreditPolicyResponse)
async def upload_policy_document(policy_id: int, background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    # Solo los administradores pueden subir documentos de políticas
    
    # Verificar que la política existe
    db_policy = db.query(models.CreditPolicy).filter(models.CreditPolicy.id == policy_id).first()
    if db_policy is None:
        raise HTTPException(status_code=404, detail="Credit policy not found")
    
    # Verificar que el archivo es un PDF
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Crear directorio para almacenar documentos si no existe
    upload_dir = Path("./uploads/policies")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generar nombre de archivo único
    file_name = f"policy_{policy_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    file_path = upload_dir / file_name
    
    # Guardar archivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Actualizar ruta del documento en la base de datos
    db_policy.original_document = str(file_path)
    db.commit()
    db.refresh(db_policy)
    
    # Procesar documento en segundo plano
    background_tasks.add_task(process_policy_document, policy_id, str(file_path), db)
    
    return db_policy

@router.get("/{policy_id}/content")
async def get_policy_content(policy_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    db_policy = db.query(models.CreditPolicy).filter(models.CreditPolicy.id == policy_id).first()
    if db_policy is None:
        raise HTTPException(status_code=404, detail="Credit policy not found")
    
    if not db_policy.policy_content:
        raise HTTPException(status_code=404, detail="Policy content not available")
    
    return {"content": db_policy.policy_content}

@router.post("/{policy_id}/activate", response_model=CreditPolicyResponse)
async def activate_policy(policy_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    # Solo los administradores pueden activar políticas
    
    db_policy = db.query(models.CreditPolicy).filter(models.CreditPolicy.id == policy_id).first()
    if db_policy is None:
        raise HTTPException(status_code=404, detail="Credit policy not found")
    
    db_policy.is_active = True
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.post("/{policy_id}/deactivate", response_model=CreditPolicyResponse)
async def deactivate_policy(policy_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_user)):
    # Solo los administradores pueden desactivar políticas
    
    db_policy = db.query(models.CreditPolicy).filter(models.CreditPolicy.id == policy_id).first()
    if db_policy is None:
        raise HTTPException(status_code=404, detail="Credit policy not found")
    
    db_policy.is_active = False
    db.commit()
    db.refresh(db_policy)
    return db_policy