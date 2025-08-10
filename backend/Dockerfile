FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    python3-dev \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiar archivos de requisitos primero para aprovechar la caché de Docker
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Instalar gpt-oss-20b si está disponible
RUN pip install --no-cache-dir gpt-oss-20b || echo "gpt-oss-20b no disponible, se usará fallback a OpenAI"

# Copiar el código de la aplicación
COPY . .

# Hacer que el script de entrada sea ejecutable
RUN chmod +x /app/docker-entrypoint.sh

# Exponer el puerto que utiliza la aplicación
EXPOSE 8000

# Configurar el comando de entrada
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Comando por defecto (puede ser anulado en docker-compose.yml)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]