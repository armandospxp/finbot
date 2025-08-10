#!/bin/bash
# Script para iniciar todos los servicios en Docker, incluyendo PostgreSQL

echo "Iniciando servicios de Agentes Vendedores de Préstamos con PostgreSQL dockerizado..."

# Verificar si existe el archivo .env, si no, copiarlo desde .env.example
if [ ! -f ".env" ]; then
    echo "Archivo .env no encontrado. Copiando desde .env.example..."
    cp .env.example .env
    echo "Por favor, edite el archivo .env con sus configuraciones antes de continuar."
    exit 1
fi

# Iniciar los servicios con Docker Compose
echo "Iniciando servicios con Docker Compose..."
docker-compose up -d

# Verificar el estado de los servicios
echo -e "\nVerificando el estado de los servicios..."
docker-compose ps

echo -e "\nServicios iniciados correctamente. Acceda a:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- Documentación API: http://localhost:8000/docs"
echo "- Servicio GPT-OSS-20B: http://localhost:8080"
echo "- PostgreSQL: localhost:5432 (accesible mediante herramientas como pgAdmin)"

echo -e "\nPara detener los servicios, ejecute: docker-compose down"