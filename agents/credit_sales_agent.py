from typing import Dict, Any, List, Optional
import requests
import json
import logging
import os
from langchain.tools import Tool
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from langchain.chat_models import ChatOpenAI

from base_agent import BaseAgent
from config import CREDIT_API_URL, CREDIT_API_KEY, DEFAULT_LLM_MODEL, USE_OPENAI_FALLBACK
from gpt_oss_client import get_llm_client

# Configuración de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CreditSalesAgent(BaseAgent):
    def __init__(
        self,
        agent_id: str,
        name: str,
        description: str,
        system_prompt: str,
        tools: List[Dict[str, Any]] = None,
        model_name: str = "gpt-3.5-turbo",
        temperature: float = 0.7,
        api_key: Optional[str] = None,
        credit_api_url: str = CREDIT_API_URL,
        credit_api_key: str = CREDIT_API_KEY
    ):
        super().__init__(
            agent_id=agent_id,
            name=name,
            description=description,
            system_prompt=system_prompt,
            tools=tools,
            model_name=model_name,
            temperature=temperature,
            api_key=api_key
        )
        self.credit_api_url = credit_api_url
        self.credit_api_key = credit_api_key
        
        # Inicializar herramientas específicas para ventas de créditos
        self._initialize_credit_tools()
    
    def _initialize_credit_tools(self):
        """Inicializa las herramientas específicas para ventas de créditos"""
        # Definir las herramientas
        tools = [
            Tool(
                name="credit_policy_lookup",
                func=self._credit_policy_lookup,
                description="Consulta las políticas de crédito para verificar requisitos y condiciones"
            ),
            Tool(
                name="credit_application",
                func=self._submit_credit_application,
                description="Envía una solicitud de crédito a la API externa"
            ),
            Tool(
                name="calculate_loan",
                func=self._calculate_loan,
                description="Calcula las cuotas y el costo total de un préstamo"
            )
        ]
        
        # Crear el prompt para el agente
        prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
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
        
        # Crear el modelo de lenguaje
        llm = ChatOpenAI(model_name=use_model, temperature=self.temperature, openai_api_key=self.api_key)
        
        # Crear la memoria
        memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        
        # Crear el agente
        agent = create_openai_functions_agent(llm, tools, prompt)
        
        # Crear el ejecutor del agente
        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            memory=memory,
            verbose=True,
            handle_parsing_errors=True
        )
    
    def _credit_policy_lookup(self, query: str) -> str:
        """Consulta las políticas de crédito"""
        try:
            # Aquí se implementaría la consulta a la base de conocimiento de políticas
            # Por ahora, devolvemos información estática
            policies = {
                "requisitos": "Para solicitar un crédito, el cliente debe tener: 1) Edad entre 18 y 70 años, 2) Ingresos mínimos de $5,000 mensuales, 3) Antigüedad laboral mínima de 6 meses, 4) Buen historial crediticio.",
                "montos": "Los montos de crédito van desde $5,000 hasta $500,000, dependiendo del perfil del cliente.",
                "plazos": "Los plazos disponibles son de 6, 12, 18, 24, 36, 48 y 60 meses.",
                "tasas": "Las tasas de interés van desde el 12% hasta el 35% anual, dependiendo del perfil del cliente y el plazo del crédito.",
                "documentos": "Documentos requeridos: 1) Identificación oficial, 2) Comprobante de domicilio, 3) Comprobante de ingresos, 4) Estados de cuenta bancarios de los últimos 3 meses."
            }
            
            # Buscar en las políticas según la consulta
            response = ""
            for key, value in policies.items():
                if key.lower() in query.lower() or any(word in query.lower() for word in key.lower().split()):
                    response += value + "\n\n"
            
            if not response:
                response = "No se encontró información específica sobre esa consulta en las políticas de crédito. Por favor, reformula tu pregunta o consulta sobre requisitos, montos, plazos, tasas o documentos."
            
            return response
        except Exception as e:
            logger.error(f"Error en credit_policy_lookup: {str(e)}")
            return "Error al consultar las políticas de crédito. Por favor, inténtalo de nuevo más tarde."
    
    def _submit_credit_application(self, application_data: str) -> str:
        """Envía una solicitud de crédito a la API externa"""
        try:
            # Convertir los datos de la aplicación de string a diccionario
            try:
                data = json.loads(application_data)
            except json.JSONDecodeError:
                return "Error: Los datos de la solicitud no tienen un formato válido. Debe ser un JSON válido."
            
            # Validar campos requeridos
            required_fields = ["full_name", "email", "phone", "amount", "term", "purpose"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return f"Error: Faltan los siguientes campos requeridos: {', '.join(missing_fields)}"
            
            # En un entorno real, aquí se enviaría la solicitud a la API externa
            # Por ahora, simulamos una respuesta
            
            # Simular envío a API externa
            logger.info(f"Enviando solicitud de crédito: {data}")
            
            # Simular respuesta
            response = {
                "application_id": "APP123456",
                "status": "pending",
                "message": "Solicitud recibida correctamente. En breve recibirás una respuesta."
            }
            
            return json.dumps(response)
        except Exception as e:
            logger.error(f"Error en submit_credit_application: {str(e)}")
            return "Error al enviar la solicitud de crédito. Por favor, inténtalo de nuevo más tarde."
    
    def _calculate_loan(self, params: str) -> str:
        """Calcula las cuotas y el costo total de un préstamo"""
        try:
            # Convertir los parámetros de string a diccionario
            try:
                data = json.loads(params)
            except json.JSONDecodeError:
                return "Error: Los parámetros no tienen un formato válido. Debe ser un JSON válido."
            
            # Validar campos requeridos
            required_fields = ["amount", "term", "rate"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return f"Error: Faltan los siguientes campos requeridos: {', '.join(missing_fields)}"
            
            # Extraer valores
            amount = float(data["amount"])
            term = int(data["term"])  # en meses
            annual_rate = float(data["rate"])  # tasa anual en porcentaje
            
            # Validar valores
            if amount <= 0 or term <= 0 or annual_rate <= 0:
                return "Error: Los valores de monto, plazo y tasa deben ser mayores que cero."
            
            # Calcular tasa mensual
            monthly_rate = annual_rate / 12 / 100
            
            # Calcular cuota mensual (fórmula de amortización)
            if monthly_rate == 0:
                monthly_payment = amount / term
            else:
                monthly_payment = amount * monthly_rate * (1 + monthly_rate) ** term / ((1 + monthly_rate) ** term - 1)
            
            # Calcular costo total
            total_payment = monthly_payment * term
            total_interest = total_payment - amount
            
            # Preparar respuesta
            result = {
                "loan_amount": amount,
                "term_months": term,
                "annual_interest_rate": annual_rate,
                "monthly_payment": round(monthly_payment, 2),
                "total_payment": round(total_payment, 2),
                "total_interest": round(total_interest, 2)
            }
            
            return json.dumps(result)
        except Exception as e:
            logger.error(f"Error en calculate_loan: {str(e)}")
            return "Error al calcular el préstamo. Por favor, verifica los datos e inténtalo de nuevo."
    
    def process_message(self, message: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Procesa un mensaje del usuario utilizando el agente de ventas de créditos"""
        try:
            # Preparar el contexto
            context = context or {}
            
            # Registrar la entrada
            logger.info(f"CreditSalesAgent {self.agent_id} received message: {message}")
            
            # Procesar con el ejecutor del agente
            response = self.agent_executor.run(input=message, **context)
            
            # Registrar la respuesta
            logger.info(f"CreditSalesAgent {self.agent_id} response: {response}")
            
            return {
                "agent_id": self.agent_id,
                "response": response,
                "success": True
            }
        except Exception as e:
            logger.error(f"Error processing message with CreditSalesAgent {self.agent_id}: {str(e)}")
            return {
                "agent_id": self.agent_id,
                "response": "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo más tarde.",
                "success": False,
                "error": str(e)
            }