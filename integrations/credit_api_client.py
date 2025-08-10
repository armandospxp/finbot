import os
import logging
from typing import Dict, Any, Optional, List, Union
import json
import requests
from datetime import datetime
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CreditAPIClient:
    """Cliente para interactuar con la API externa de créditos"""
    
    def __init__(self):
        """Inicializa el cliente de la API de créditos"""
        self.api_base_url = os.getenv("CREDIT_API_BASE_URL")
        self.api_key = os.getenv("CREDIT_API_KEY")
        self.api_secret = os.getenv("CREDIT_API_SECRET")
        
        # Verificar configuración
        if not self.api_base_url:
            logger.warning("URL base de la API de créditos no configurada")
        if not self.api_key or not self.api_secret:
            logger.warning("Credenciales de la API de créditos no configuradas")
    
    def _get_headers(self) -> Dict[str, str]:
        """Obtiene los headers para las peticiones a la API
        
        Returns:
            Diccionario con los headers
        """
        return {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
            "X-API-Secret": self.api_secret
        }
    
    def _handle_response(self, response: requests.Response) -> Dict[str, Any]:
        """Maneja la respuesta de la API
        
        Args:
            response: Respuesta de la API
            
        Returns:
            Diccionario con la respuesta procesada
        """
        try:
            data = response.json()
            if response.status_code >= 200 and response.status_code < 300:
                return {
                    "success": True,
                    "status_code": response.status_code,
                    "data": data
                }
            else:
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "error": data.get("error", "Error desconocido"),
                    "message": data.get("message", "")
                }
        except Exception as e:
            logger.error(f"Error al procesar respuesta: {str(e)}")
            return {
                "success": False,
                "status_code": response.status_code,
                "error": "Error al procesar respuesta",
                "message": str(e)
            }
    
    def get_pre_approved_loan(self, client_id: str) -> Dict[str, Any]:
        """Obtiene información de préstamo pre-aprobado para un cliente
        
        Args:
            client_id: ID del cliente
            
        Returns:
            Diccionario con la información del préstamo pre-aprobado
        """
        if not self.api_base_url:
            return {"success": False, "error": "API no configurada"}
        
        try:
            url = f"{self.api_base_url}/clients/{client_id}/pre-approved-loans"
            response = requests.get(url, headers=self._get_headers())
            return self._handle_response(response)
        except Exception as e:
            logger.error(f"Error al obtener préstamo pre-aprobado: {str(e)}")
            return {
                "success": False,
                "error": "Error de conexión",
                "message": str(e)
            }
    
    def submit_credit_application(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """Envía una solicitud de crédito
        
        Args:
            application_data: Datos de la solicitud
            
        Returns:
            Diccionario con la respuesta de la API
        """
        if not self.api_base_url:
            return {"success": False, "error": "API no configurada"}
        
        try:
            url = f"{self.api_base_url}/credit-applications"
            response = requests.post(
                url,
                headers=self._get_headers(),
                json=application_data
            )
            return self._handle_response(response)
        except Exception as e:
            logger.error(f"Error al enviar solicitud de crédito: {str(e)}")
            return {
                "success": False,
                "error": "Error de conexión",
                "message": str(e)
            }
    
    def get_application_status(self, application_id: str) -> Dict[str, Any]:
        """Obtiene el estado de una solicitud de crédito
        
        Args:
            application_id: ID de la solicitud
            
        Returns:
            Diccionario con el estado de la solicitud
        """
        if not self.api_base_url:
            return {"success": False, "error": "API no configurada"}
        
        try:
            url = f"{self.api_base_url}/credit-applications/{application_id}"
            response = requests.get(url, headers=self._get_headers())
            return self._handle_response(response)
        except Exception as e:
            logger.error(f"Error al obtener estado de solicitud: {str(e)}")
            return {
                "success": False,
                "error": "Error de conexión",
                "message": str(e)
            }
    
    def get_client_info(self, client_id: str) -> Dict[str, Any]:
        """Obtiene información de un cliente
        
        Args:
            client_id: ID del cliente
            
        Returns:
            Diccionario con la información del cliente
        """
        if not self.api_base_url:
            return {"success": False, "error": "API no configurada"}
        
        try:
            url = f"{self.api_base_url}/clients/{client_id}"
            response = requests.get(url, headers=self._get_headers())
            return self._handle_response(response)
        except Exception as e:
            logger.error(f"Error al obtener información del cliente: {str(e)}")
            return {
                "success": False,
                "error": "Error de conexión",
                "message": str(e)
            }
    
    def calculate_loan_options(self, amount: float, term_months: int, client_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Calcula opciones de préstamo
        
        Args:
            amount: Monto del préstamo
            term_months: Plazo en meses
            client_data: Datos adicionales del cliente (opcional)
            
        Returns:
            Diccionario con las opciones de préstamo
        """
        if not self.api_base_url:
            return {"success": False, "error": "API no configurada"}
        
        try:
            url = f"{self.api_base_url}/loan-calculator"
            payload = {
                "amount": amount,
                "term_months": term_months
            }
            
            if client_data:
                payload["client_data"] = client_data
            
            response = requests.post(
                url,
                headers=self._get_headers(),
                json=payload
            )
            return self._handle_response(response)
        except Exception as e:
            logger.error(f"Error al calcular opciones de préstamo: {str(e)}")
            return {
                "success": False,
                "error": "Error de conexión",
                "message": str(e)
            }
    
    def simulate_loan_payment(self, amount: float, term_months: int, interest_rate: float) -> Dict[str, Any]:
        """Simula el pago de un préstamo (cálculo local)
        
        Args:
            amount: Monto del préstamo
            term_months: Plazo en meses
            interest_rate: Tasa de interés anual (porcentaje)
            
        Returns:
            Diccionario con la simulación del préstamo
        """
        try:
            # Convertir tasa anual a mensual
            monthly_rate = interest_rate / 100 / 12
            
            # Calcular cuota mensual
            if monthly_rate == 0:
                monthly_payment = amount / term_months
            else:
                monthly_payment = amount * (monthly_rate * (1 + monthly_rate) ** term_months) / ((1 + monthly_rate) ** term_months - 1)
            
            # Calcular total a pagar
            total_payment = monthly_payment * term_months
            total_interest = total_payment - amount
            
            # Generar tabla de amortización
            amortization_table = []
            remaining_balance = amount
            
            for month in range(1, term_months + 1):
                interest_payment = remaining_balance * monthly_rate
                principal_payment = monthly_payment - interest_payment
                remaining_balance -= principal_payment
                
                if month <= 12:  # Limitar la tabla a 12 meses para no hacerla muy grande
                    amortization_table.append({
                        "month": month,
                        "payment": round(monthly_payment, 2),
                        "principal": round(principal_payment, 2),
                        "interest": round(interest_payment, 2),
                        "remaining_balance": round(max(0, remaining_balance), 2)
                    })
            
            return {
                "success": True,
                "loan_details": {
                    "amount": amount,
                    "term_months": term_months,
                    "interest_rate": interest_rate,
                    "monthly_payment": round(monthly_payment, 2),
                    "total_payment": round(total_payment, 2),
                    "total_interest": round(total_interest, 2)
                },
                "amortization_table": amortization_table
            }
        except Exception as e:
            logger.error(f"Error al simular pago de préstamo: {str(e)}")
            return {
                "success": False,
                "error": "Error de cálculo",
                "message": str(e)
            }

# Ejemplo de uso
if __name__ == "__main__":
    # Inicializar cliente
    credit_api = CreditAPIClient()
    
    # Ejemplo de simulación de préstamo
    result = credit_api.simulate_loan_payment(10000, 24, 12.5)
    print(json.dumps(result, indent=2))