# Script para inicializar la base de datos con datos de ejemplo

Write-Host "Inicializando la base de datos PostgreSQL con datos de ejemplo..."

# Verificar si el contenedor de PostgreSQL está en ejecución
$postgresRunning = docker ps | Select-String -Pattern "credit_app_postgres"

if (-not $postgresRunning) {
    Write-Host "Error: El contenedor de PostgreSQL no está en ejecución." -ForegroundColor Red
    Write-Host "Inicie el contenedor con: docker-compose up -d postgres" -ForegroundColor Yellow
    exit 1
}

# Cargar variables de entorno desde .env
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue
if (-not $envContent) {
    Write-Host "Advertencia: No se encontró el archivo .env, usando valores predeterminados." -ForegroundColor Yellow
    $POSTGRES_USER = "postgres"
    $POSTGRES_PASSWORD = "postgres"
    $POSTGRES_DB = "credit_app"
} else {
    $envVars = @{}
    foreach ($line in $envContent) {
        if ($line -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $envVars[$key] = $value
        }
    }
    
    $POSTGRES_USER = $envVars["POSTGRES_USER"] -or "postgres"
    $POSTGRES_PASSWORD = $envVars["POSTGRES_PASSWORD"] -or "postgres"
    $POSTGRES_DB = $envVars["POSTGRES_DB"] -or "credit_app"
}

# Ejecutar migraciones con Alembic
Write-Host "Ejecutando migraciones con Alembic..." -ForegroundColor Cyan
docker exec -it credit_app_backend alembic upgrade head

# Verificar si el script init_db.py existe en el backend
Write-Host "Inicializando datos de ejemplo..." -ForegroundColor Cyan
docker exec -it credit_app_backend python init_db.py

# Verificar que se hayan creado los datos
Write-Host "Verificando datos creados..." -ForegroundColor Cyan

# Verificar usuarios
Write-Host "\nUsuarios creados:" -ForegroundColor Green
docker exec credit_app_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT id, email, full_name, role FROM users;"

# Verificar agentes
Write-Host "\nAgentes creados:" -ForegroundColor Green
docker exec credit_app_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT id, name, description FROM agents;"

# Verificar campañas
Write-Host "\nCampañas creadas:" -ForegroundColor Green
docker exec credit_app_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT id, name, status FROM campaigns;"

# Verificar políticas de crédito
Write-Host "\nPolíticas de crédito creadas:" -ForegroundColor Green
docker exec credit_app_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT id, name, is_active FROM credit_policies;"

Write-Host "\nLa base de datos ha sido inicializada con datos de ejemplo correctamente." -ForegroundColor Green
Write-Host "Puede acceder al sistema con las siguientes credenciales:" -ForegroundColor Cyan
Write-Host "Email: admin@example.com" -ForegroundColor Yellow
Write-Host "Contraseña: admin123" -ForegroundColor Yellow