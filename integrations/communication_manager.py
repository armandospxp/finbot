import os
import logging
from typing import List, Dict, Any, Optional, Union
import json
import requests
from datetime import datetime
from dotenv import load_dotenv

# Importaciones para WhatsApp (Twilio)
from twilio.rest import Client as TwilioClient
from twilio.base.exceptions import TwilioRestException

# Importaciones para Email (SendGrid)
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content

# Cargar variables de entorno
load_dotenv()

# Configuración de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CommunicationManager:
    """Gestor de comunicaciones para enviar mensajes a través de diferentes canales"""
    
    def __init__(self):
        """Inicializa el gestor de comunicaciones"""
        # Configuración de Twilio (WhatsApp y SMS)
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_whatsapp_number = os.getenv("TWILIO_WHATSAPP_NUMBER")
        self.twilio_sms_number = os.getenv("TWILIO_SMS_NUMBER")
        
        # Configuración de SendGrid (Email)
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        self.sendgrid_from_email = os.getenv("SENDGRID_FROM_EMAIL")
        
        # Inicializar clientes
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Inicializa los clientes de comunicación"""
        # Inicializar cliente de Twilio
        if self.twilio_account_sid and self.twilio_auth_token:
            try:
                self.twilio_client = TwilioClient(self.twilio_account_sid, self.twilio_auth_token)
                logger.info("Cliente de Twilio inicializado correctamente")
            except Exception as e:
                logger.error(f"Error al inicializar cliente de Twilio: {str(e)}")
                self.twilio_client = None
        else:
            logger.warning("Credenciales de Twilio no configuradas")
            self.twilio_client = None
        
        # Inicializar cliente de SendGrid
        if self.sendgrid_api_key:
            try:
                self.sendgrid_client = sendgrid.SendGridAPIClient(api_key=self.sendgrid_api_key)
                logger.info("Cliente de SendGrid inicializado correctamente")
            except Exception as e:
                logger.error(f"Error al inicializar cliente de SendGrid: {str(e)}")
                self.sendgrid_client = None
        else:
            logger.warning("Credenciales de SendGrid no configuradas")
            self.sendgrid_client = None
    
    def send_whatsapp(self, to: str, message: str) -> Dict[str, Any]:
        """Envía un mensaje de WhatsApp
        
        Args:
            to: Número de teléfono del destinatario (formato: +123456789)
            message: Contenido del mensaje
            
        Returns:
            Diccionario con información del envío
        """
        if not self.twilio_client or not self.twilio_whatsapp_number:
            logger.error("Cliente de Twilio no inicializado o número de WhatsApp no configurado")
            return {"success": False, "error": "Twilio no configurado"}
        
        try:
            # Formatear números para WhatsApp
            from_whatsapp = f"whatsapp:{self.twilio_whatsapp_number}"
            to_whatsapp = f"whatsapp:{to}"
            
            # Enviar mensaje
            twilio_message = self.twilio_client.messages.create(
                body=message,
                from_=from_whatsapp,
                to=to_whatsapp
            )
            
            logger.info(f"Mensaje de WhatsApp enviado: {twilio_message.sid}")
            return {
                "success": True,
                "message_id": twilio_message.sid,
                "status": twilio_message.status,
                "timestamp": datetime.now().isoformat()
            }
        except TwilioRestException as e:
            logger.error(f"Error al enviar mensaje de WhatsApp: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "error_code": e.code,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error inesperado al enviar mensaje de WhatsApp: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def send_sms(self, to: str, message: str) -> Dict[str, Any]:
        """Envía un mensaje SMS
        
        Args:
            to: Número de teléfono del destinatario (formato: +123456789)
            message: Contenido del mensaje
            
        Returns:
            Diccionario con información del envío
        """
        if not self.twilio_client or not self.twilio_sms_number:
            logger.error("Cliente de Twilio no inicializado o número de SMS no configurado")
            return {"success": False, "error": "Twilio no configurado"}
        
        try:
            # Enviar mensaje
            twilio_message = self.twilio_client.messages.create(
                body=message,
                from_=self.twilio_sms_number,
                to=to
            )
            
            logger.info(f"Mensaje SMS enviado: {twilio_message.sid}")
            return {
                "success": True,
                "message_id": twilio_message.sid,
                "status": twilio_message.status,
                "timestamp": datetime.now().isoformat()
            }
        except TwilioRestException as e:
            logger.error(f"Error al enviar mensaje SMS: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "error_code": e.code,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error inesperado al enviar mensaje SMS: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def send_email(self, to: str, subject: str, content: str, content_type: str = "text/plain") -> Dict[str, Any]:
        """Envía un correo electrónico
        
        Args:
            to: Dirección de correo electrónico del destinatario
            subject: Asunto del correo
            content: Contenido del correo
            content_type: Tipo de contenido (text/plain o text/html)
            
        Returns:
            Diccionario con información del envío
        """
        if not self.sendgrid_client or not self.sendgrid_from_email:
            logger.error("Cliente de SendGrid no inicializado o correo de origen no configurado")
            return {"success": False, "error": "SendGrid no configurado"}
        
        try:
            # Crear mensaje
            from_email = Email(self.sendgrid_from_email)
            to_email = To(to)
            content = Content(content_type, content)
            mail = Mail(from_email, to_email, subject, content)
            
            # Enviar mensaje
            response = self.sendgrid_client.client.mail.send.post(request_body=mail.get())
            
            logger.info(f"Correo electrónico enviado: {response.status_code}")
            return {
                "success": response.status_code in [200, 201, 202],
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error al enviar correo electrónico: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def send_batch(self, channel: str, recipients: List[Dict[str, Any]], template: str, template_vars: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Envía mensajes en lote a múltiples destinatarios
        
        Args:
            channel: Canal de comunicación (whatsapp, sms, email)
            recipients: Lista de destinatarios con sus datos
            template: Plantilla del mensaje
            template_vars: Variables globales para la plantilla
            
        Returns:
            Diccionario con información del envío en lote
        """
        results = {
            "success": True,
            "total": len(recipients),
            "sent": 0,
            "failed": 0,
            "details": []
        }
        
        template_vars = template_vars or {}
        
        for recipient in recipients:
            try:
                # Combinar variables globales con variables del destinatario
                vars_combined = {**template_vars, **recipient.get("vars", {})}
                
                # Formatear mensaje con variables
                message = template
                for key, value in vars_combined.items():
                    placeholder = f"{{{{{key}}}}}"
                    message = message.replace(placeholder, str(value))
                
                # Enviar mensaje según el canal
                if channel.lower() == "whatsapp":
                    if "phone" not in recipient:
                        raise ValueError("Falta el número de teléfono del destinatario")
                    result = self.send_whatsapp(recipient["phone"], message)
                elif channel.lower() == "sms":
                    if "phone" not in recipient:
                        raise ValueError("Falta el número de teléfono del destinatario")
                    result = self.send_sms(recipient["phone"], message)
                elif channel.lower() == "email":
                    if "email" not in recipient:
                        raise ValueError("Falta el correo electrónico del destinatario")
                    if "subject" not in recipient:
                        raise ValueError("Falta el asunto del correo")
                    result = self.send_email(recipient["email"], recipient["subject"], message)
                else:
                    raise ValueError(f"Canal no soportado: {channel}")
                
                # Actualizar resultados
                if result["success"]:
                    results["sent"] += 1
                else:
                    results["failed"] += 1
                    results["success"] = False
                
                # Agregar detalles
                results["details"].append({
                    "recipient": recipient,
                    "result": result
                })
            except Exception as e:
                logger.error(f"Error al enviar mensaje a {recipient}: {str(e)}")
                results["failed"] += 1
                results["success"] = False
                results["details"].append({
                    "recipient": recipient,
                    "result": {
                        "success": False,
                        "error": str(e),
                        "timestamp": datetime.now().isoformat()
                    }
                })
        
        return results

# Ejemplo de uso
if __name__ == "__main__":
    # Inicializar gestor de comunicaciones
    comm_manager = CommunicationManager()
    
    # Ejemplo de envío de WhatsApp
    # result = comm_manager.send_whatsapp("+123456789", "Hola desde el gestor de comunicaciones")
    # print(json.dumps(result, indent=2))
    
    # Ejemplo de envío de SMS
    # result = comm_manager.send_sms("+123456789", "Hola desde el gestor de comunicaciones")
    # print(json.dumps(result, indent=2))
    
    # Ejemplo de envío de correo electrónico
    # result = comm_manager.send_email("destinatario@ejemplo.com", "Prueba", "Hola desde el gestor de comunicaciones")
    # print(json.dumps(result, indent=2))
    
    # Ejemplo de envío en lote
    # recipients = [
    #     {"phone": "+123456789", "vars": {"nombre": "Juan", "monto": 5000}},
    #     {"phone": "+987654321", "vars": {"nombre": "María", "monto": 7500}}
    # ]
    # template = "Hola {{nombre}}, tienes un préstamo pre-aprobado por ${{monto}}. ¿Te interesa?"    
    # result = comm_manager.send_batch("whatsapp", recipients, template)
    # print(json.dumps(result, indent=2))