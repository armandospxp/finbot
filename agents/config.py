import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de modelos de lenguaje
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Configuración de gpt-oss-20b
GPT_OSS_MODEL_PATH = os.getenv("GPT_OSS_MODEL_PATH", "/models/gpt-oss-20b")
GPT_OSS_MAX_TOKENS = int(os.getenv("GPT_OSS_MAX_TOKENS", "1024"))
GPT_OSS_TEMPERATURE = float(os.getenv("GPT_OSS_TEMPERATURE", "0.7"))
GPT_OSS_TOP_P = float(os.getenv("GPT_OSS_TOP_P", "0.9"))
GPT_OSS_TOP_K = int(os.getenv("GPT_OSS_TOP_K", "40"))

# Fallback a OpenAI si gpt-oss-20b no está disponible
USE_OPENAI_FALLBACK = os.getenv("USE_OPENAI_FALLBACK", "true").lower() == "true"
DEFAULT_LLM_MODEL = os.getenv("DEFAULT_LLM_MODEL", "gpt-oss-20b")

# Configuración de Twilio para WhatsApp y SMS
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER")

# Configuración de SendGrid para Email
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL")

# Configuración de la API externa de créditos
CREDIT_API_URL = os.getenv("CREDIT_API_URL")
CREDIT_API_KEY = os.getenv("CREDIT_API_KEY")

# Configuración de ChromaDB
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "../knowledge/chroma_db")

# Configuración de los agentes
AGENT_TEMPLATES = {
    "credit_sales": {
        "name": "Agente de Ventas de Créditos",
        "description": "Agente especializado en la venta de créditos personales",
        "system_prompt": """
        Eres un agente de ventas de créditos personales profesional y amigable. 
        Tu objetivo es ayudar a los clientes a obtener un crédito que se ajuste a sus necesidades y posibilidades.
        
        Debes seguir estos pasos:
        1. Saludar al cliente de manera cordial y presentarte como agente de créditos.
        2. Preguntar sobre sus necesidades de financiamiento (monto, plazo, propósito).
        3. Solicitar información relevante para evaluar su elegibilidad (ingresos, antigüedad laboral, etc.).
        4. Explicar las opciones de crédito disponibles según su perfil.
        5. Responder a sus preguntas y aclarar dudas sobre términos y condiciones.
        6. Guiar al cliente en el proceso de solicitud.
        7. Mantener un tono profesional, empático y sin presionar al cliente.
        
        Recuerda que debes cumplir con todas las políticas de crédito de la empresa y requisitos regulatorios.
        No debes prometer la aprobación del crédito, ya que esto depende de la evaluación final.
        """,
        "tools": ["credit_policy_lookup", "credit_application", "customer_info_request"]
    },
    "customer_support": {
        "name": "Agente de Atención al Cliente",
        "description": "Agente especializado en atención al cliente y seguimiento de solicitudes",
        "system_prompt": """
        Eres un agente de atención al cliente especializado en créditos personales. 
        Tu objetivo es brindar soporte a los clientes sobre sus solicitudes de crédito existentes.
        
        Debes seguir estos pasos:
        
        1. Saludar al cliente de manera cordial y presentarte como agente de atención al cliente.
        2. Verificar la identidad del cliente solicitando información básica.
        3. Consultar el estado de su solicitud de crédito.
        4. Responder a sus preguntas sobre el proceso, plazos y requisitos.
        5. Ayudar a resolver problemas o dudas relacionadas con su solicitud.
        6. Proporcionar información sobre próximos pasos o documentación adicional requerida.
        7. Mantener un tono profesional, empático y orientado a soluciones.
        
        Recuerda que debes proteger la información confidencial del cliente y seguir los protocolos de seguridad.
        """,
        "tools": ["application_status_lookup", "document_request", "escalation"]
    }
}

# Configuración de las herramientas de los agentes
AGENT_TOOLS = {
    "credit_policy_lookup": {
        "name": "Consulta de Políticas de Crédito",
        "description": "Consulta las políticas de crédito para verificar requisitos y condiciones",
        "api_endpoint": "/api/policies/query"
    },
    "credit_application": {
        "name": "Solicitud de Crédito",
        "description": "Envía una solicitud de crédito a la API externa",
        "api_endpoint": "/api/credit/apply"
    },
    "customer_info_request": {
        "name": "Solicitud de Información del Cliente",
        "description": "Solicita información adicional al cliente para completar la solicitud",
        "required_fields": ["full_name", "email", "phone", "employment_status", "employment_tenure", "monthly_income"]
    },
    "application_status_lookup": {
        "name": "Consulta de Estado de Solicitud",
        "description": "Consulta el estado de una solicitud de crédito existente",
        "api_endpoint": "/api/credit/status"
    },
    "document_request": {
        "name": "Solicitud de Documentación",
        "description": "Solicita documentación adicional al cliente",
        "document_types": ["identification", "proof_of_income", "proof_of_address", "bank_statement"]
    },
    "escalation": {
        "name": "Escalación",
        "description": "Escala el caso a un supervisor humano",
        "api_endpoint": "/api/support/escalate"
    }
}