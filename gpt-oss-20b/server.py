import os
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel, Field
import uvicorn
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer
from threading import Thread

# Configuración de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuración del modelo
MODEL_PATH = os.environ.get("MODEL_PATH", "/app/models/gpt-oss-20b")
MAX_INPUT_TOKENS = int(os.environ.get("MAX_INPUT_TOKENS", "4096"))
MAX_OUTPUT_TOKENS = int(os.environ.get("MAX_OUTPUT_TOKENS", "1024"))
DEFAULT_TEMPERATURE = float(os.environ.get("DEFAULT_TEMPERATURE", "0.7"))
DEFAULT_TOP_P = float(os.environ.get("DEFAULT_TOP_P", "0.9"))
DEFAULT_TOP_K = int(os.environ.get("DEFAULT_TOP_K", "50"))

app = FastAPI(title="GPT-OSS-20B API", description="API para el modelo GPT-OSS-20B")

# Modelos de datos
class Message(BaseModel):
    role: str
    content: str

class GenerationRequest(BaseModel):
    messages: List[Message]
    temperature: Optional[float] = DEFAULT_TEMPERATURE
    max_tokens: Optional[int] = MAX_OUTPUT_TOKENS
    top_p: Optional[float] = DEFAULT_TOP_P
    top_k: Optional[int] = DEFAULT_TOP_K
    stream: Optional[bool] = False

class GenerationResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[Dict[str, Any]]
    usage: Dict[str, int]

# Variables globales para el modelo y tokenizer
model = None
tokenizer = None

@app.on_event("startup")
async def startup_event():
    global model, tokenizer
    try:
        logger.info(f"Cargando modelo desde {MODEL_PATH}")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_PATH,
            device_map="auto",
            load_in_4bit=True
        )
        logger.info("Modelo cargado correctamente")
    except Exception as e:
        logger.error(f"Error al cargar el modelo: {str(e)}")
        raise e

def format_chat_prompt(messages: List[Message]) -> str:
    """Formatea los mensajes para el modelo."""
    formatted_prompt = ""
    for message in messages:
        if message.role == "system":
            formatted_prompt += f"<|system|>\n{message.content}\n"
        elif message.role == "user":
            formatted_prompt += f"<|user|>\n{message.content}\n"
        elif message.role == "assistant":
            formatted_prompt += f"<|assistant|>\n{message.content}\n"
    
    # Añadir el token de inicio para la respuesta del asistente
    formatted_prompt += "<|assistant|>\n"
    return formatted_prompt

@app.post("/v1/chat/completions", response_model=GenerationResponse)
async def generate_text(request: GenerationRequest, background_tasks: BackgroundTasks):
    global model, tokenizer
    
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Modelo no disponible")
    
    try:
        # Formatear el prompt
        prompt = format_chat_prompt(request.messages)
        
        # Tokenizar el prompt
        input_ids = tokenizer.encode(prompt, return_tensors="pt").to(model.device)
        
        # Verificar longitud del input
        if input_ids.shape[1] > MAX_INPUT_TOKENS:
            raise HTTPException(status_code=400, detail=f"El prompt excede el máximo de tokens permitidos ({MAX_INPUT_TOKENS})")
        
        # Configurar parámetros de generación
        gen_kwargs = {
            "input_ids": input_ids,
            "max_new_tokens": request.max_tokens,
            "temperature": request.temperature,
            "top_p": request.top_p,
            "top_k": request.top_k,
            "do_sample": request.temperature > 0,
            "pad_token_id": tokenizer.eos_token_id
        }
        
        # Generar texto
        with torch.no_grad():
            output = model.generate(**gen_kwargs)
        
        # Decodificar la salida (excluyendo el prompt)
        generated_text = tokenizer.decode(output[0][input_ids.shape[1]:], skip_special_tokens=True)
        
        # Calcular tokens
        input_tokens = input_ids.shape[1]
        output_tokens = output.shape[1] - input_ids.shape[1]
        
        # Preparar respuesta
        response = {
            "id": f"chatcmpl-{os.urandom(4).hex()}",
            "object": "chat.completion",
            "created": int(import_time()),
            "model": "gpt-oss-20b",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": generated_text
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": input_tokens,
                "completion_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens
            }
        }
        
        return response
    
    except Exception as e:
        logger.error(f"Error en la generación: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Modelo no disponible")
    return {"status": "ok", "model": "gpt-oss-20b"}

def import_time():
    import time
    return time.time()

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8080, log_level="info")