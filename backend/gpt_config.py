"""Configuración para la integración con gpt-oss-20b."""

import os
from dotenv import load_dotenv
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()

# Configuración del modelo gpt-oss-20b
GPT_OSS_MODEL_PATH = os.getenv("GPT_OSS_MODEL_PATH", "/models/gpt-oss-20b")
GPT_OSS_MAX_TOKENS = int(os.getenv("GPT_OSS_MAX_TOKENS", "1024"))
GPT_OSS_TEMPERATURE = float(os.getenv("GPT_OSS_TEMPERATURE", "0.7"))
GPT_OSS_TOP_P = float(os.getenv("GPT_OSS_TOP_P", "0.9"))
GPT_OSS_TOP_K = int(os.getenv("GPT_OSS_TOP_K", "40"))

# Fallback a OpenAI si gpt-oss-20b no está disponible
USE_OPENAI_FALLBACK = os.getenv("USE_OPENAI_FALLBACK", "false").lower() == "true"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")


def get_gpt_oss_config():
    """Retorna la configuración para gpt-oss-20b."""
    return {
        "model_path": GPT_OSS_MODEL_PATH,
        "max_tokens": GPT_OSS_MAX_TOKENS,
        "temperature": GPT_OSS_TEMPERATURE,
        "top_p": GPT_OSS_TOP_P,
        "top_k": GPT_OSS_TOP_K,
    }


def is_gpt_oss_available():
    """Verifica si el modelo gpt-oss-20b está disponible."""
    try:
        # Importar gpt-oss-20b
        import gpt_oss_20b
        
        # Verificar si el modelo existe en la ruta especificada
        if os.path.exists(GPT_OSS_MODEL_PATH):
            logger.info(f"Modelo gpt-oss-20b encontrado en {GPT_OSS_MODEL_PATH}")
            return True
        else:
            logger.warning(f"Modelo gpt-oss-20b no encontrado en {GPT_OSS_MODEL_PATH}")
            return False
    except ImportError:
        logger.warning("No se pudo importar gpt-oss-20b")
        return False


def get_llm_client():
    """Retorna el cliente LLM apropiado (gpt-oss-20b o OpenAI)."""
    if is_gpt_oss_available():
        try:
            import gpt_oss_20b
            logger.info("Usando gpt-oss-20b como modelo LLM")
            return gpt_oss_20b.GPTOSSClient(**get_gpt_oss_config())
        except Exception as e:
            logger.error(f"Error al inicializar gpt-oss-20b: {e}")
            if USE_OPENAI_FALLBACK and OPENAI_API_KEY:
                logger.info("Fallback a OpenAI")
                from openai import OpenAI
                return OpenAI(api_key=OPENAI_API_KEY)
            else:
                raise
    else:
        if USE_OPENAI_FALLBACK and OPENAI_API_KEY:
            logger.info("Usando OpenAI como modelo LLM (fallback)")
            from openai import OpenAI
            return OpenAI(api_key=OPENAI_API_KEY)
        else:
            raise ValueError("No se encontró un modelo LLM disponible")


def generate_text(prompt, max_tokens=None, temperature=None):
    """Genera texto usando el modelo LLM disponible."""
    client = get_llm_client()
    
    # Determinar si estamos usando gpt-oss-20b u OpenAI
    if hasattr(client, "generate"):  # gpt-oss-20b
        # Usar la API de gpt-oss-20b
        response = client.generate(
            prompt=prompt,
            max_tokens=max_tokens or GPT_OSS_MAX_TOKENS,
            temperature=temperature or GPT_OSS_TEMPERATURE,
            top_p=GPT_OSS_TOP_P,
            top_k=GPT_OSS_TOP_K
        )
        return response.text
    else:  # OpenAI
        # Usar la API de OpenAI
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Eres un asistente útil y preciso."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens or GPT_OSS_MAX_TOKENS,
            temperature=temperature or GPT_OSS_TEMPERATURE,
        )
        return response.choices[0].message.content