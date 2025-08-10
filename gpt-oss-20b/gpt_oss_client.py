"""Cliente para interactuar con el servicio gpt-oss-20b."""

import os
import json
import logging
import requests
from typing import Dict, List, Optional, Union, Any
from dataclasses import dataclass

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class GPTOSSResponse:
    """Respuesta del modelo gpt-oss-20b."""
    text: str
    usage: Dict[str, int]
    model: str
    id: str

class GPTOSSClient:
    """Cliente para interactuar con el servicio gpt-oss-20b."""
    
    def __init__(self, 
                 model_path: str = "/models/gpt-oss-20b", 
                 max_tokens: int = 1024, 
                 temperature: float = 0.7, 
                 top_p: float = 0.9, 
                 top_k: int = 40,
                 api_url: Optional[str] = None):
        """Inicializa el cliente de gpt-oss-20b.
        
        Args:
            model_path: Ruta al modelo gpt-oss-20b.
            max_tokens: Número máximo de tokens a generar.
            temperature: Temperatura para la generación de texto.
            top_p: Valor de top-p para la generación de texto.
            top_k: Valor de top-k para la generación de texto.
            api_url: URL de la API de gpt-oss-20b. Si no se proporciona, se usa la variable de entorno GPT_OSS_MODEL_URL.
        """
        self.model_path = model_path
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.top_p = top_p
        self.top_k = top_k
        
        # Obtener la URL de la API desde las variables de entorno o usar el valor predeterminado
        self.api_url = api_url or os.getenv("GPT_OSS_MODEL_URL", "http://localhost:8080")
        
        logger.info(f"Cliente gpt-oss-20b inicializado con URL: {self.api_url}")
    
    def _format_messages(self, prompt: str) -> List[Dict[str, str]]:
        """Formatea el prompt como una lista de mensajes para la API de chat.
        
        Args:
            prompt: El prompt de texto.
            
        Returns:
            Lista de mensajes formateados para la API de chat.
        """
        return [
            {"role": "system", "content": "Eres un asistente útil y preciso."},
            {"role": "user", "content": prompt}
        ]
    
    def generate(self, 
                prompt: str, 
                max_tokens: Optional[int] = None, 
                temperature: Optional[float] = None,
                top_p: Optional[float] = None,
                top_k: Optional[int] = None,
                stream: bool = False) -> GPTOSSResponse:
        """Genera texto usando el modelo gpt-oss-20b.
        
        Args:
            prompt: El prompt de texto.
            max_tokens: Número máximo de tokens a generar. Si es None, se usa el valor predeterminado.
            temperature: Temperatura para la generación de texto. Si es None, se usa el valor predeterminado.
            top_p: Valor de top-p para la generación de texto. Si es None, se usa el valor predeterminado.
            top_k: Valor de top-k para la generación de texto. Si es None, se usa el valor predeterminado.
            stream: Si es True, la respuesta se transmite en tiempo real.
            
        Returns:
            Objeto GPTOSSResponse con el texto generado y metadatos.
            
        Raises:
            Exception: Si hay un error al comunicarse con la API.
        """
        try:
            # Preparar los datos de la solicitud
            request_data = {
                "model": "gpt-oss-20b",
                "messages": self._format_messages(prompt),
                "max_tokens": max_tokens or self.max_tokens,
                "temperature": temperature or self.temperature,
                "top_p": top_p or self.top_p,
                "top_k": top_k or self.top_k,
                "stream": stream
            }
            
            # Realizar la solicitud a la API
            response = requests.post(
                f"{self.api_url}/v1/chat/completions",
                json=request_data,
                timeout=60  # Timeout de 60 segundos
            )
            
            # Verificar si la solicitud fue exitosa
            response.raise_for_status()
            
            # Parsear la respuesta
            data = response.json()
            
            # Crear y retornar el objeto de respuesta
            return GPTOSSResponse(
                text=data["choices"][0]["message"]["content"],
                usage=data["usage"],
                model=data["model"],
                id=data["id"]
            )
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error al comunicarse con la API de gpt-oss-20b: {e}")
            raise Exception(f"Error al comunicarse con la API de gpt-oss-20b: {e}")
        except (KeyError, json.JSONDecodeError) as e:
            logger.error(f"Error al parsear la respuesta de la API: {e}")
            raise Exception(f"Error al parsear la respuesta de la API: {e}")
        except Exception as e:
            logger.error(f"Error inesperado: {e}")
            raise
    
    def health_check(self) -> bool:
        """Verifica si el servicio gpt-oss-20b está disponible.
        
        Returns:
            True si el servicio está disponible, False en caso contrario.
        """
        try:
            response = requests.get(f"{self.api_url}/health", timeout=5)
            return response.status_code == 200 and response.json().get("status") == "ok"
        except Exception as e:
            logger.error(f"Error al verificar la salud del servicio: {e}")
            return False