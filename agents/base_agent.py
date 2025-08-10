from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain
from langchain.prompts import ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from typing import List, Dict, Any, Optional
import json
import logging
import os

# Importar cliente LLM unificado
from gpt_oss_client import get_llm_client
from config import DEFAULT_LLM_MODEL, USE_OPENAI_FALLBACK

# Configuración de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BaseAgent:
    def __init__(
        self,
        agent_id: str,
        name: str,
        description: str,
        system_prompt: str,
        tools: List[Dict[str, Any]] = None,
        model_name: str = "gpt-3.5-turbo",
        temperature: float = 0.7,
        streaming: bool = False,
        api_key: Optional[str] = None,
        memory_key: str = "chat_history"
    ):
        self.agent_id = agent_id
        self.name = name
        self.description = description
        self.system_prompt = system_prompt
        self.tools = tools or []
        self.model_name = model_name
        self.temperature = temperature
        self.streaming = streaming
        self.api_key = api_key
        self.memory_key = memory_key
        
        # Inicializar componentes
        self._initialize_components()
    
    def _initialize_components(self):
        """Inicializa los componentes del agente"""
        # Configurar callbacks para streaming si está habilitado
        callback_manager = None
        if self.streaming:
            callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])
        
        # Determinar qué modelo usar
        use_model = self.model_name
        if self.model_name == "gpt-oss-20b" or self.model_name == DEFAULT_LLM_MODEL:
            # Intentar usar gpt-oss-20b
            try:
                # Verificar si podemos importar el módulo gpt-oss-20b
                import gpt_oss_20b
                logger.info(f"Usando modelo gpt-oss-20b para el agente {self.agent_id}")
            except ImportError:
                if USE_OPENAI_FALLBACK:
                    logger.warning(f"No se pudo cargar gpt-oss-20b, usando fallback a OpenAI para el agente {self.agent_id}")
                    use_model = "gpt-3.5-turbo"
                else:
                    logger.error(f"No se pudo cargar gpt-oss-20b y el fallback está desactivado para el agente {self.agent_id}")
                    raise ImportError("No se pudo cargar gpt-oss-20b y el fallback está desactivado")
        
        # Inicializar el modelo de lenguaje
        self.llm = ChatOpenAI(
            model_name=use_model,
            temperature=self.temperature,
            streaming=self.streaming,
            callback_manager=callback_manager,
            openai_api_key=self.api_key,
            verbose=True
        )
        
        # Inicializar la memoria de conversación
        self.memory = ConversationBufferMemory(memory_key=self.memory_key, return_messages=True)
        
        # Crear el prompt del sistema
        system_message_prompt = SystemMessagePromptTemplate.from_template(self.system_prompt)
        human_message_prompt = HumanMessagePromptTemplate.from_template("{input}")
        chat_prompt = ChatPromptTemplate.from_messages([system_message_prompt, human_message_prompt])
        
        # Crear la cadena de LLM
        self.chain = LLMChain(
            llm=self.llm,
            prompt=chat_prompt,
            memory=self.memory,
            verbose=True
        )
    
    def process_message(self, message: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Procesa un mensaje del usuario y genera una respuesta
        
        Args:
            message: El mensaje del usuario
            context: Contexto adicional para el procesamiento
            
        Returns:
            Dict con la respuesta del agente y metadatos
        """
        try:
            # Preparar el contexto
            context = context or {}
            input_data = {"input": message, **context}
            
            # Registrar la entrada
            logger.info(f"Agent {self.agent_id} received message: {message}")
            
            # Procesar con la cadena de LLM
            response = self.chain.run(**input_data)
            
            # Registrar la respuesta
            logger.info(f"Agent {self.agent_id} response: {response}")
            
            return {
                "agent_id": self.agent_id,
                "response": response,
                "success": True
            }
        except Exception as e:
            logger.error(f"Error processing message with agent {self.agent_id}: {str(e)}")
            return {
                "agent_id": self.agent_id,
                "response": "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo más tarde.",
                "success": False,
                "error": str(e)
            }
    
    def get_memory(self) -> List[Dict[str, Any]]:
        """Obtiene el historial de conversación"""
        return self.memory.chat_memory.messages
    
    def clear_memory(self) -> None:
        """Limpia el historial de conversación"""
        self.memory.clear()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convierte el agente a un diccionario para serialización"""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "description": self.description,
            "system_prompt": self.system_prompt,
            "tools": self.tools,
            "model_name": self.model_name,
            "temperature": self.temperature
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any], api_key: Optional[str] = None):
        """Crea un agente a partir de un diccionario"""
        return cls(
            agent_id=data.get("agent_id"),
            name=data.get("name"),
            description=data.get("description"),
            system_prompt=data.get("system_prompt"),
            tools=data.get("tools"),
            model_name=data.get("model_name"),
            temperature=data.get("temperature"),
            api_key=api_key
        )