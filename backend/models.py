from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

# Enumeraciones
class AgentStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TRAINING = "training"

class CampaignStatus(enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class CampaignType(enum.Enum):
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    SMS = "sms"

class CreditStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# Modelos
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    agents = relationship("Agent", back_populates="owner")
    campaigns = relationship("Campaign", back_populates="creator")

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    status = Column(Enum(AgentStatus), default=AgentStatus.INACTIVE)
    configuration = Column(JSON)  # Configuración específica del agente
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    owner = relationship("User", back_populates="agents")
    campaigns = relationship("Campaign", back_populates="agent")
    interactions = relationship("Interaction", back_populates="agent")
    performance_metrics = relationship("AgentPerformance", back_populates="agent")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    campaign_type = Column(Enum(CampaignType))
    status = Column(Enum(CampaignStatus), default=CampaignStatus.DRAFT)
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    target_audience = Column(JSON)  # Criterios de segmentación
    message_template = Column(Text)  # Plantilla del mensaje
    agent_id = Column(Integer, ForeignKey("agents.id"))
    creator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    agent = relationship("Agent", back_populates="campaigns")
    creator = relationship("User", back_populates="campaigns")
    interactions = relationship("Interaction", back_populates="campaign")

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    employment_status = Column(String)
    employment_tenure = Column(Integer)  # En meses
    monthly_income = Column(Float)
    additional_data = Column(JSON)  # Datos adicionales del cliente
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    interactions = relationship("Interaction", back_populates="client")
    credit_applications = relationship("CreditApplication", back_populates="client")

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    channel = Column(String)  # WhatsApp, Email, SMS
    interaction_data = Column(JSON)  # Contenido de la interacción
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    agent = relationship("Agent", back_populates="interactions")
    client = relationship("Client", back_populates="interactions")
    campaign = relationship("Campaign", back_populates="interactions")

class ApplicationStatus(enum.Enum):
    PENDING = "pending"
    REVIEW = "review"
    APPROVED = "approved"
    REJECTED = "rejected"

class DocumentType(enum.Enum):
    IDENTIFICATION = "identification"
    PROOF_OF_INCOME = "proof_of_income"
    BANK_STATEMENT = "bank_statement"
    PROPERTY_TITLE = "property_title"
    OTHER = "other"

class ActivityType(enum.Enum):
    CREATED = "created"
    UPDATED = "updated"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    REJECTED = "rejected"
    DOCUMENT_ADDED = "document_added"
    DOCUMENT_REMOVED = "document_removed"

class CreditApplication(Base):
    __tablename__ = "credit_applications"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    credit_policy_id = Column(Integer, ForeignKey("credit_policies.id"))
    amount = Column(Float)
    term = Column(Integer)  # En meses
    interest_rate = Column(Float)
    monthly_payment = Column(Float)
    purpose = Column(String)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING)
    external_application_id = Column(String, nullable=True)  # ID en sistema externo
    application_data = Column(JSON)  # Datos completos de la solicitud
    
    # Campos para aprobación/rechazo
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_comments = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    client = relationship("Client", back_populates="credit_applications")
    credit_policy = relationship("CreditPolicy", backref="applications")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    documents = relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan")
    activities = relationship("ApplicationActivity", back_populates="application", cascade="all, delete-orphan")

class ApplicationDocument(Base):
    __tablename__ = "application_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("credit_applications.id"))
    document_type = Column(Enum(DocumentType))
    filename = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)  # En bytes
    mime_type = Column(String)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    application = relationship("CreditApplication", back_populates="documents")

class ApplicationActivity(Base):
    __tablename__ = "application_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("credit_applications.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    activity_type = Column(Enum(ActivityType))
    details = Column(JSON, nullable=True)  # Detalles adicionales de la actividad
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    application = relationship("CreditApplication", back_populates="activities")
    user = relationship("User")

class CreditPolicy(Base):
    __tablename__ = "credit_policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    policy_content = Column(Text)  # Contenido procesado de la política
    original_document = Column(String)  # Ruta al documento original
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AgentPerformance(Base):
    __tablename__ = "agent_performance"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"))
    date = Column(DateTime(timezone=True), server_default=func.now())
    interactions_count = Column(Integer, default=0)
    successful_applications = Column(Integer, default=0)
    conversion_rate = Column(Float, default=0.0)
    average_response_time = Column(Float)  # En segundos
    metrics_data = Column(JSON)  # Métricas adicionales

    # Relaciones
    agent = relationship("Agent", back_populates="performance_metrics")