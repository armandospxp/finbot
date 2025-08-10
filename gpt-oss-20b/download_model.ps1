# Script para descargar el modelo gpt-oss-20b en Windows

# Parámetros
param (
    [string]$ModelName = "mistralai/Mistral-7B-Instruct-v0.2",
    [string]$OutputDir = "$PSScriptRoot\models\gpt-oss-20b",
    [switch]$No4Bit = $false
)

# Función para mostrar mensajes con colores
function Write-ColorOutput {
    param (
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor $Color
}

# Verificar si Python está instalado
try {
    $pythonVersion = python --version
    Write-ColorOutput "Python detectado: $pythonVersion" "Green"
}
catch {
    Write-ColorOutput "Error: Python no está instalado o no está en el PATH" "Red"
    exit 1
}

# Verificar si las dependencias están instaladas
Write-ColorOutput "Verificando dependencias..." "Cyan"
$dependencies = @("torch", "transformers", "accelerate", "bitsandbytes", "sentencepiece", "protobuf")
$missingDeps = @()

foreach ($dep in $dependencies) {
    $result = python -c "try: import $dep; print('OK'); except ImportError: print('MISSING')" 2>$null
    if ($result -ne "OK") {
        $missingDeps += $dep
    }
}

# Instalar dependencias faltantes
if ($missingDeps.Count -gt 0) {
    Write-ColorOutput "Instalando dependencias faltantes: $($missingDeps -join ', ')" "Yellow"
    python -m pip install $missingDeps
}
else {
    Write-ColorOutput "Todas las dependencias están instaladas" "Green"
}

# Crear directorio de salida si no existe
if (-not (Test-Path $OutputDir)) {
    Write-ColorOutput "Creando directorio $OutputDir" "Cyan"
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Construir comando para descargar el modelo
$cmd = "python download_model.py --model `"$ModelName`" --output `"$OutputDir`""
if ($No4Bit) {
    $cmd += " --no-4bit"
}

# Descargar el modelo
Write-ColorOutput "Iniciando descarga del modelo $ModelName en $OutputDir" "Cyan"
Write-ColorOutput "Este proceso puede tardar varios minutos dependiendo de tu conexión a internet y el tamaño del modelo" "Yellow"
Write-ColorOutput "Ejecutando: $cmd" "Gray"

Invoke-Expression $cmd

# Verificar si la descarga fue exitosa
if ($LASTEXITCODE -eq 0) {
    Write-ColorOutput "Modelo descargado exitosamente en $OutputDir" "Green"
}
else {
    Write-ColorOutput "Error al descargar el modelo. Verifica los mensajes anteriores para más detalles" "Red"
}