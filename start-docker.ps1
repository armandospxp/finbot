# Script para iniciar todos los servicios en Docker, incluyendo PostgreSQL

Write-Host "Iniciando servicios de Agentes Vendedores de Préstamos con PostgreSQL dockerizado..."

# Verificar si existe el archivo .env, si no, copiarlo desde .env.example
if (-not (Test-Path ".env")) {
    Write-Host "Archivo .env no encontrado. Copiando desde .env.example..."
    Copy-Item ".env.example" ".env"
    Write-Host "Por favor, edite el archivo .env con sus configuraciones antes de continuar."
    exit
}

# Iniciar los servicios con Docker Compose
Write-Host "Iniciando servicios con Docker Compose..."
docker-compose up -d

# Verificar el estado de los servicios
Write-Host "\nVerificando el estado de los servicios..."
docker-compose ps

Write-Host "\nServicios iniciados correctamente. Acceda a:"
Write-Host "- Frontend: http://localhost:3000"
Write-Host "- Backend API: http://localhost:8000"
Write-Host "- Documentación API: http://localhost:8000/docs"
Write-Host "- Servicio GPT-OSS-20B: http://localhost:8080"
Write-Host "- PostgreSQL: localhost:5432 (accesible mediante herramientas como pgAdmin)"

Write-Host "\nPara detener los servicios, ejecute: docker-compose down"