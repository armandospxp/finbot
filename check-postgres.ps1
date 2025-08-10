# Script para verificar la conexión a PostgreSQL dockerizado

Write-Host "Verificando conexión a PostgreSQL dockerizado..."

# Verificar si el contenedor de PostgreSQL está en ejecución
$postgresRunning = docker ps | Select-String -Pattern "credit_app_postgres"

if (-not $postgresRunning) {
    Write-Host "Error: El contenedor de PostgreSQL no está en ejecución." -ForegroundColor Red
    Write-Host "Inicie el contenedor con: docker-compose up -d postgres" -ForegroundColor Yellow
    exit 1
}

Write-Host "Contenedor de PostgreSQL en ejecución." -ForegroundColor Green

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

# Intentar conectarse a PostgreSQL usando el cliente psql dentro del contenedor
Write-Host "Intentando conectar a la base de datos $POSTGRES_DB como usuario $POSTGRES_USER..."

$result = docker exec credit_app_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT version();" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Conexión exitosa a PostgreSQL!" -ForegroundColor Green
    Write-Host "Información de la base de datos:" -ForegroundColor Cyan
    Write-Host $result
    
    # Verificar tablas en la base de datos
    Write-Host "\nVerificando tablas en la base de datos..." -ForegroundColor Cyan
    $tables = docker exec credit_app_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "\dt;" 2>&1
    Write-Host $tables
    
    Write-Host "\nLa base de datos PostgreSQL está configurada correctamente y lista para usar." -ForegroundColor Green
} else {
    Write-Host "Error al conectar a PostgreSQL:" -ForegroundColor Red
    Write-Host $result
    Write-Host "\nVerifique que las credenciales en el archivo .env sean correctas y que el contenedor esté funcionando." -ForegroundColor Yellow
    exit 1
}