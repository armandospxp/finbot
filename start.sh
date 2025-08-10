#!/bin/bash
# Script para iniciar la aplicación con Docker o Podman

# Valores por defecto
ENGINE="docker"
BUILD=false
DOWN=false
LOGS=false

# Función de ayuda
show_help() {
    echo "Uso: ./start.sh [opciones]"
    echo "Opciones:"
    echo "  -e, --engine ENGINE   Motor a utilizar (docker o podman). Por defecto: docker"
    echo "  -b, --build           Construir las imágenes antes de iniciar"
    echo "  -d, --down            Detener los servicios"
    echo "  -l, --logs            Mostrar los logs de los servicios"
    echo "  -h, --help            Mostrar esta ayuda"
    exit 0
}

# Procesar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--engine)
            ENGINE="$2"
            shift 2
            ;;
        -b|--build)
            BUILD=true
            shift
            ;;
        -d|--down)
            DOWN=true
            shift
            ;;
        -l|--logs)
            LOGS=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo "Opción desconocida: $1"
            show_help
            ;;
    esac
done

# Validar el motor seleccionado
if [ "$ENGINE" = "docker" ]; then
    if ! command -v docker &> /dev/null; then
        echo "Docker no está instalado o no está disponible en el PATH. Por favor, instálalo o selecciona Podman con -e podman"
        exit 1
    fi
    COMPOSE_CMD="docker-compose"
elif [ "$ENGINE" = "podman" ]; then
    if ! command -v podman &> /dev/null; then
        echo "Podman no está instalado o no está disponible en el PATH. Por favor, instálalo o selecciona Docker con -e docker"
        exit 1
    fi
    COMPOSE_CMD="podman-compose"
else
    echo "Motor no válido. Use 'docker' o 'podman'"
    exit 1
fi

# Verificar si existe el archivo .env, si no, copiarlo desde .env.example
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Archivo .env no encontrado. Copiando desde .env.example..."
        cp .env.example .env
        echo "Por favor, edita el archivo .env con tus configuraciones antes de continuar."
        exit 0
    else
        echo "No se encontró ni .env ni .env.example. Por favor, crea un archivo .env antes de continuar."
        exit 1
    fi
fi

# Ejecutar los comandos según los parámetros
if [ "$DOWN" = true ]; then
    echo "Deteniendo los servicios..."
    $COMPOSE_CMD down
elif [ "$LOGS" = true ]; then
    echo "Mostrando logs..."
    $COMPOSE_CMD logs -f
else
    if [ "$BUILD" = true ]; then
        echo "Construyendo las imágenes..."
        $COMPOSE_CMD build
    fi
    
    echo "Iniciando los servicios..."
    $COMPOSE_CMD up -d
    
    echo "Servicios iniciados correctamente."
    echo "Frontend: http://localhost"
    echo "Backend API: http://localhost:8000"
    echo "API Docs: http://localhost:8000/docs"
fi