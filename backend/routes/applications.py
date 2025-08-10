from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
import models
from routes.users import get_current_user

router = APIRouter(prefix="/api/applications", tags=["applications"])

@router.get("/", response_model=List[models.ApplicationResponse])
async def get_applications(
    status: Optional[str] = Query(None, description="Filter by status"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get all credit applications with optional filters
    """
    query = db.query(models.Application)
    
    if status:
        query = query.filter(models.Application.status == status)
    
    if client_id:
        query = query.filter(models.Application.client_id == client_id)
    
    applications = query.order_by(models.Application.created_at.desc()).all()
    return applications

@router.post("/", response_model=models.ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    application: models.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Create a new credit application
    """
    # Verify client exists
    client = db.query(models.Client).filter(models.Client.id == application.client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {application.client_id} not found"
        )
    
    # Verify credit policy exists if provided
    if application.credit_policy_id:
        credit_policy = db.query(models.CreditPolicy).filter(models.CreditPolicy.id == application.credit_policy_id).first()
        if not credit_policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Credit policy with ID {application.credit_policy_id} not found"
            )
    
    # Create new application
    new_application = models.Application(
        client_id=application.client_id,
        loan_amount=application.loan_amount,
        term=application.term,
        interest_rate=application.interest_rate,
        monthly_payment=application.monthly_payment,
        purpose=application.purpose,
        status="pending",
        credit_policy_id=application.credit_policy_id,
        additional_comments=application.additional_comments,
        created_by=current_user.id
    )
    
    # Add documents if provided
    if application.documents:
        for doc in application.documents:
            document = models.Document(
                name=doc.name,
                url=doc.url,
                type=doc.type,
                size=doc.size
            )
            new_application.documents.append(document)
    
    # Add activity record
    activity = models.ApplicationActivity(
        action="Application created",
        user=f"{current_user.first_name} {current_user.last_name}",
        timestamp=datetime.now()
    )
    new_application.activity_history.append(activity)
    
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    
    return new_application

@router.get("/{application_id}", response_model=models.ApplicationDetailResponse)
async def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get a specific credit application by ID
    """
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found"
        )
    
    return application

@router.put("/{application_id}", response_model=models.ApplicationResponse)
async def update_application(
    application_id: int,
    application_update: models.ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Update an existing credit application
    """
    # Find the application
    db_application = db.query(models.Application).filter(models.Application.id == application_id).first()
    
    if not db_application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found"
        )
    
    # Check if application can be updated (only pending applications can be updated)
    if db_application.status not in ["pending", "review"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update application with status '{db_application.status}'"
        )
    
    # Update application fields
    update_data = application_update.dict(exclude_unset=True)
    
    # Handle client_id update
    if "client_id" in update_data:
        client = db.query(models.Client).filter(models.Client.id == update_data["client_id"]).first()
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Client with ID {update_data['client_id']} not found"
            )
    
    # Handle credit_policy_id update
    if "credit_policy_id" in update_data and update_data["credit_policy_id"]:
        credit_policy = db.query(models.CreditPolicy).filter(models.CreditPolicy.id == update_data["credit_policy_id"]).first()
        if not credit_policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Credit policy with ID {update_data['credit_policy_id']} not found"
            )
    
    # Update application fields
    for key, value in update_data.items():
        if key != "documents":  # Handle documents separately
            setattr(db_application, key, value)
    
    # Handle documents update if provided
    if "documents" in update_data and update_data["documents"]:
        # Clear existing documents and add new ones
        db_application.documents = []
        
        for doc in update_data["documents"]:
            document = models.Document(
                name=doc["name"],
                url=doc["url"],
                type=doc["type"],
                size=doc["size"]
            )
            db_application.documents.append(document)
    
    # Add activity record
    activity = models.ApplicationActivity(
        action="Application updated",
        user=f"{current_user.first_name} {current_user.last_name}",
        timestamp=datetime.now()
    )
    db_application.activity_history.append(activity)
    
    db.commit()
    db.refresh(db_application)
    
    return db_application

@router.put("/{application_id}/review", response_model=models.ApplicationResponse)
async def review_application(
    application_id: int,
    review: models.ApplicationReview,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Review a credit application (approve or reject)
    """
    # Find the application
    db_application = db.query(models.Application).filter(models.Application.id == application_id).first()
    
    if not db_application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found"
        )
    
    # Check if application can be reviewed (only pending applications can be reviewed)
    if db_application.status not in ["pending", "review"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot review application with status '{db_application.status}'"
        )
    
    # Update application status
    db_application.status = review.status
    
    # Add approval or rejection details
    if review.status == "approved":
        db_application.approval_details = models.ApprovalDetails(
            date=datetime.now(),
            approved_by=f"{current_user.first_name} {current_user.last_name}",
            comments=review.comments
        )
    elif review.status == "rejected":
        db_application.rejection_details = models.RejectionDetails(
            date=datetime.now(),
            rejected_by=f"{current_user.first_name} {current_user.last_name}",
            reason="Manual rejection",
            comments=review.comments
        )
    
    # Add activity record
    activity = models.ApplicationActivity(
        action=f"Application {review.status}",
        user=f"{current_user.first_name} {current_user.last_name}",
        comments=review.comments,
        timestamp=datetime.now()
    )
    db_application.activity_history.append(activity)
    
    db.commit()
    db.refresh(db_application)
    
    return db_application

@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Delete a credit application (admin only)
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete applications"
        )
    
    # Find the application
    db_application = db.query(models.Application).filter(models.Application.id == application_id).first()
    
    if not db_application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID {application_id} not found"
        )
    
    # Delete the application
    db.delete(db_application)
    db.commit()
    
    return None