FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instalar gpt-oss-20b y sus dependencias
RUN pip install --no-cache-dir torch transformers accelerate bitsandbytes sentencepiece protobuf

# Crear directorio para el modelo
RUN mkdir -p /app/models

# Copiar el código del servicio
COPY . .

# Hacer que el script de entrada sea ejecutable
RUN chmod +x /app/entrypoint.sh

# Exponer el puerto que utiliza el servicio
EXPOSE 8080

# Configurar el comando de entrada
ENTRYPOINT ["/app/entrypoint.sh"]

# Comando por defecto
CMD ["python", "server.py"]