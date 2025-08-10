# Script de entrada para Docker en Windows

# Función para esperar a que PostgreSQL esté disponible
function Wait-ForPostgres {
    Write-Host "Esperando a que PostgreSQL esté disponible..."
    $connected = $false
    
    while (-not $connected) {
        try {
            $env:PGPASSWORD = $env:POSTGRES_PASSWORD
            $result = & psql -h $env:POSTGRES_HOST -U $env:POSTGRES_USER -d $env:POSTGRES_DB -c "\q" 2>&1
            if ($LASTEXITCODE -eq 0) {
                $connected = $true
            } else {
                Write-Host "PostgreSQL no está disponible aún - esperando..."
                Start-Sleep -Seconds 2
            }
        } catch {
            Write-Host "PostgreSQL no está disponible aún - esperando..."
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Host "PostgreSQL está disponible!"
}

# Esperar a que PostgreSQL esté disponible
Wait-ForPostgres

# Ejecutar migraciones de Alembic
Write-Host "Ejecutando migraciones de Alembic..."
alembic upgrade head

# Inicializar la base de datos con datos iniciales
Write-Host "Inicializando la base de datos..."
python init_db.py

# Ejecutar el comando proporcionado (por defecto: uvicorn)
Write-Host "Iniciando la aplicación..."
& $args