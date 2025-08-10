#!/bin/bash
# Script para verificar la conexión a PostgreSQL dockerizado

echo "Verificando conexión a PostgreSQL dockerizado..."

# Verificar si el contenedor de PostgreSQL está en ejecución
POSTGRES_RUNNING=$(docker ps | grep credit_app_postgres)

if [ -z "$POSTGRES_RUNNING" ]; then
    echo -e "\033[0;31mError: El contenedor de PostgreSQL no está en ejecución.\033[0m"
    echo -e "\033[0;33mInicie el contenedor con: docker-compose up -d postgres\033[0m"
    exit 1
fi

echo -e "\033[0;32mContenedor de PostgreSQL en ejecución.\033[0m"

# Cargar variables de entorno desde .env
if [ -f ".env" ]; then
    source <(grep -v '^#' .env | sed -E 's/(.*)=(.*)/export \1="\2"/')
else
    echo -e "\033[0;33mAdvertencia: No se encontró el archivo .env, usando valores predeterminados.\033[0m"
    export POSTGRES_USER="postgres"
    export POSTGRES_PASSWORD="postgres"
    export POSTGRES_DB="credit_app"
fi

# Intentar conectarse a PostgreSQL usando el cliente psql dentro del contenedor
echo "Intentando conectar a la base de datos $POSTGRES_DB como usuario $POSTGRES_USER..."

if docker exec credit_app_postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "\033[0;32mConexión exitosa a PostgreSQL!\033[0m"
    echo -e "\033[0;36mInformación de la base de datos:\033[0m"
    docker exec credit_app_postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT version();"
    
    # Verificar tablas en la base de datos
    echo -e "\n\033[0;36mVerificando tablas en la base de datos...\033[0m"
    docker exec credit_app_postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt;"
    
    echo -e "\n\033[0;32mLa base de datos PostgreSQL está configurada correctamente y lista para usar.\033[0m"
else
    echo -e "\033[0;31mError al conectar a PostgreSQL:\033[0m"
    docker exec credit_app_postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT version();" 2>&1
    echo -e "\n\033[0;33mVerifique que las credenciales en el archivo .env sean correctas y que el contenedor esté funcionando.\033[0m"
    exit 1
fi