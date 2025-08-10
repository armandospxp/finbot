# Servicio GPT-OSS-20B

Este servicio proporciona una API compatible con OpenAI para el modelo GPT-OSS-20B, permitiendo su uso como un reemplazo directo de la API de OpenAI en aplicaciones existentes.

## Características

- API compatible con OpenAI (endpoint `/v1/chat/completions`)
- Soporte para streaming de respuestas
- Configuración de parámetros como temperatura, top_p, top_k
- Carga automática del modelo desde HuggingFace
- Optimización para rendimiento con cuantización de 4-bit

## Requisitos

- Python 3.10+
- CUDA 11.7+ (para aceleración GPU)
- 16GB+ de RAM (recomendado 32GB+)
- GPU con 16GB+ VRAM (para modelos grandes)

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `MODEL_PATH` | Ruta al modelo | `/app/models/gpt-oss-20b` |
| `MAX_INPUT_TOKENS` | Máximo de tokens de entrada | `4096` |
| `MAX_OUTPUT_TOKENS` | Máximo de tokens de salida | `1024` |
| `DEFAULT_TEMPERATURE` | Temperatura por defecto | `0.7` |
| `DEFAULT_TOP_P` | Top-p por defecto | `0.9` |
| `DEFAULT_TOP_K` | Top-k por defecto | `50` |

## Uso con Docker

```bash
# Construir la imagen
docker build -t gpt-oss-20b .

# Ejecutar el contenedor
docker run -p 8080:8080 -v /ruta/local/modelos:/app/models gpt-oss-20b
```

## Uso con Docker Compose

Este servicio está diseñado para ser utilizado con Docker Compose como parte del sistema de aplicación de créditos. Consulte el archivo `docker-compose.yml` en la raíz del proyecto para más detalles.

## Endpoints API

### `/v1/chat/completions`

**Método**: POST

**Cuerpo de la solicitud**:
```json
{
  "messages": [
    {"role": "system", "content": "Eres un asistente útil."},
    {"role": "user", "content": "Hola, ¿cómo estás?"}
  ],
  "temperature": 0.7,
  "max_tokens": 1024,
  "top_p": 0.9,
  "top_k": 50,
  "stream": false
}
```

**Respuesta**:
```json
{
  "id": "chatcmpl-123456789",
  "object": "chat.completion",
  "created": 1677858242,
  "model": "gpt-oss-20b",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hola, estoy bien. ¿En qué puedo ayudarte hoy?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 13,
    "total_tokens": 38
  }
}
```

### `/health`

**Método**: GET

**Respuesta**:
```json
{
  "status": "ok",
  "model": "gpt-oss-20b"
}
```