# Script para iniciar la aplicación con Docker o Podman

param (
    [string]$Engine = "docker",
    [switch]$Build,
    [switch]$Down,
    [switch]$Logs
)

# Verificar que el motor seleccionado esté instalado
function Test-CommandExists {
    param ($command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'stop'
    try { if (Get-Command $command) { return $true } }
    catch { return $false }
    finally { $ErrorActionPreference = $oldPreference }
}

# Validar el motor seleccionado
if ($Engine -eq "docker") {
    if (-not (Test-CommandExists "docker")) {
        Write-Host "Docker no está instalado o no está disponible en el PATH. Por favor, instálalo o selecciona Podman con -Engine podman" -ForegroundColor Red
        exit 1
    }
    $ComposeCmd = "docker-compose"
} elseif ($Engine -eq "podman") {
    if (-not (Test-CommandExists "podman")) {
        Write-Host "Podman no está instalado o no está disponible en el PATH. Por favor, instálalo o selecciona Docker con -Engine docker" -ForegroundColor Red
        exit 1
    }
    $ComposeCmd = "podman-compose"
} else {
    Write-Host "Motor no válido. Use 'docker' o 'podman'" -ForegroundColor Red
    exit 1
}

# Verificar si existe el archivo .env, si no, copiarlo desde .env.example
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "Archivo .env no encontrado. Copiando desde .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "Por favor, edita el archivo .env con tus configuraciones antes de continuar." -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "No se encontró ni .env ni .env.example. Por favor, crea un archivo .env antes de continuar." -ForegroundColor Red
        exit 1
    }
}

# Ejecutar los comandos según los parámetros
if ($Down) {
    Write-Host "Deteniendo los servicios..." -ForegroundColor Cyan
    Invoke-Expression "$ComposeCmd down"
} elseif ($Logs) {
    Write-Host "Mostrando logs..." -ForegroundColor Cyan
    Invoke-Expression "$ComposeCmd logs -f"
} else {
    if ($Build) {
        Write-Host "Construyendo las imágenes..." -ForegroundColor Cyan
        Invoke-Expression "$ComposeCmd build"
    }
    
    Write-Host "Iniciando los servicios..." -ForegroundColor Cyan
    Invoke-Expression "$ComposeCmd up -d"
    
    Write-Host "Servicios iniciados correctamente." -ForegroundColor Green
    Write-Host "Frontend: http://localhost" -ForegroundColor Green
    Write-Host "Backend API: http://localhost:8000" -ForegroundColor Green
    Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Green
}