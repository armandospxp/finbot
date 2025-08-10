"""Cliente para la integración con gpt-oss-20b."""

import os
import logging
from typing import Dict, Any, List, Optional, Union
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()

# Importar configuración
from config import (
    GPT_OSS_MODEL_PATH,
    GPT_OSS_MAX_TOKENS,
    GPT_OSS_TEMPERATURE,
    GPT_OSS_TOP_P,
    GPT_OSS_TOP_K,
    USE_OPENAI_FALLBACK,
    OPENAI_API_KEY,
    DEFAULT_LLM_MODEL
)


class GPTOSSClient:
    """Cliente para interactuar con el modelo gpt-oss-20b."""
    
    def __init__(
        self,
        model_path: str = GPT_OSS_MODEL_PATH,
        max_tokens: int = GPT_OSS_MAX_TOKENS,
        temperature: float = GPT_OSS_TEMPERATURE,
        top_p: float = GPT_OSS_TOP_P,
        top_k: int = GPT_OSS_TOP_K
    ):
        self.model_path = model_path
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.top_p = top_p
        self.top_k = top_k
        self.model = None
        
        # Inicializar el modelo
        self._initialize_model()
    
    def _initialize_model(self):
        """Inicializa el modelo gpt-oss-20b."""
        try:
            # Importar gpt-oss-20b
            import gpt_oss_20b
            
            # Verificar si el modelo existe en la ruta especificada
            if os.path.exists(self.model_path):
                logger.info(f"Cargando modelo gpt-oss-20b desde {self.model_path}")
                self.model = gpt_oss_20b.GPTOSSModel(model_path=self.model_path)
                logger.info("Modelo gpt-oss-20b cargado correctamente")
            else:
                logger.warning(f"Modelo gpt-oss-20b no encontrado en {self.model_path}")
                self.model = None
        except ImportError:
            logger.warning("No se pudo importar gpt-oss-20b")
            self.model = None
    
    def generate(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """Genera texto usando el modelo gpt-oss-20b.
        
        Args:
            prompt: El prompt para generar texto
            **kwargs: Parámetros adicionales para la generación
            
        Returns:
            Dict con el texto generado y metadatos
        """
        if self.model is None:
            raise ValueError("El modelo gpt-oss-20b no está disponible")
        
        # Obtener parámetros de generación
        max_tokens = kwargs.get("max_tokens", self.max_tokens)
        temperature = kwargs.get("temperature", self.temperature)
        top_p = kwargs.get("top_p", self.top_p)
        top_k = kwargs.get("top_k", self.top_k)
        
        # Generar texto
        logger.info(f"Generando texto con gpt-oss-20b: {prompt[:50]}...")
        response = self.model.generate(
            prompt=prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            top_k=top_k
        )
        
        # Formatear respuesta
        return {
            "text": response.text,
            "model": "gpt-oss-20b",
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        }


class LLMClient:
    """Cliente unificado para interactuar con modelos de lenguaje."""
    
    def __init__(self, model_name: str = DEFAULT_LLM_MODEL):
        self.model_name = model_name
        self.client = None
        
        # Inicializar el cliente
        self._initialize_client()
    
    def _initialize_client(self):
        """Inicializa el cliente apropiado según el modelo seleccionado."""
        if self.model_name == "gpt-oss-20b":
            try:
                self.client = GPTOSSClient()
                logger.info("Cliente gpt-oss-20b inicializado correctamente")
            except Exception as e:
                logger.error(f"Error al inicializar cliente gpt-oss-20b: {str(e)}")
                if USE_OPENAI_FALLBACK and OPENAI_API_KEY:
                    logger.info("Fallback a OpenAI")
                    self._initialize_openai_client()
                else:
                    raise ValueError("No se pudo inicializar el cliente gpt-oss-20b y el fallback a OpenAI está desactivado")
        else:
            self._initialize_openai_client()
    
    def _initialize_openai_client(self):
        """Inicializa el cliente de OpenAI."""
        if not OPENAI_API_KEY:
            raise ValueError("No se ha configurado OPENAI_API_KEY")
        
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=OPENAI_API_KEY)
            self.model_name = "gpt-3.5-turbo"  # Modelo por defecto de OpenAI
            logger.info("Cliente OpenAI inicializado correctamente")
        except Exception as e:
            logger.error(f"Error al inicializar cliente OpenAI: {str(e)}")
            raise
    
    def generate(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """Genera texto usando el modelo de lenguaje configurado.
        
        Args:
            prompt: El prompt para generar texto
            **kwargs: Parámetros adicionales para la generación
            
        Returns:
            Dict con el texto generado y metadatos
        """
        if self.client is None:
            raise ValueError("No se ha inicializado ningún cliente LLM")
        
        # Determinar si estamos usando gpt-oss-20b u OpenAI
        if isinstance(self.client, GPTOSSClient):
            return self.client.generate(prompt, **kwargs)
        else:
            # Usar la API de OpenAI
            max_tokens = kwargs.get("max_tokens", GPT_OSS_MAX_TOKENS)
            temperature = kwargs.get("temperature", GPT_OSS_TEMPERATURE)
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "Eres un asistente útil y preciso."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            
            return {
                "text": response.choices[0].message.content,
                "model": self.model_name,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }


def get_llm_client(model_name: str = DEFAULT_LLM_MODEL) -> LLMClient:
    """Obtiene un cliente LLM configurado.
    
    Args:
        model_name: El nombre del modelo a utilizar
        
    Returns:
        Un cliente LLM configurado
    """
    return LLMClient(model_name=model_name)