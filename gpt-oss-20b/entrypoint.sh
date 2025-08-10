#!/bin/bash
set -e

# Verificar si el modelo ya está descargado
MODEL_PATH=${MODEL_PATH:-"/app/models/gpt-oss-20b"}

if [ ! -d "$MODEL_PATH" ] || [ -z "$(ls -A $MODEL_PATH)" ]; then
    echo "El modelo no está presente en $MODEL_PATH. Descargando..."
    
    # Descargar el modelo desde HuggingFace
    # Nota: Este es un placeholder. El modelo real debería especificarse según disponibilidad
    python -c "from transformers import AutoModelForCausalLM, AutoTokenizer; \
              model = AutoModelForCausalLM.from_pretrained('mistralai/Mistral-7B-Instruct-v0.2', \
                                                          device_map='auto', \
                                                          load_in_4bit=True); \
              tokenizer = AutoTokenizer.from_pretrained('mistralai/Mistral-7B-Instruct-v0.2'); \
              model.save_pretrained('$MODEL_PATH'); \
              tokenizer.save_pretrained('$MODEL_PATH')"
    
    echo "Modelo descargado y guardado en $MODEL_PATH"
else
    echo "Modelo encontrado en $MODEL_PATH"
fi

# Ejecutar el comando proporcionado
exec "$@"