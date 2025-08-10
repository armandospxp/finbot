#!/bin/bash
# Script para inicializar la base de datos con datos de ejemplo

echo "Inicializando la base de datos PostgreSQL con datos de ejemplo..."

# Verificar si el contenedor de PostgreSQL está en ejecución
POSTGRES_RUNNING=$(docker ps | grep credit_app_postgres)

if [ -z "$POSTGRES_RUNNING" ]; then
    echo -e "\033[0;31mError: El contenedor de PostgreSQL no está en ejecución.\033[0m"
    echo -e "\033[0;33mInicie el contenedor con: docker-compose up -d postgres\033[0m"
    exit 1
fi

# Cargar variables de entorno desde .env
if [ -f ".env" ]; then
    source <(grep -v '^#' .env | sed -E 's/(.*)=(.*)/export \1="\2"/')
else
    echo -e "\033[0;33mAdvertencia: No se encontró el archivo .env, usando valores predeterminados.\033[0m"
    export POSTGRES_USER="postgres"
    export POSTGRES_PASSWORD="postgres"
    export POSTGRES_DB="credit_app"
fi

# Ejecutar migraciones con Alembic
echo -e "\033[0;36mEjecutando migraciones con Alembic...\033[0m"
docker exec -it credit_app_backend alembic upgrade head

# Verificar si el script init_db.py existe en el backend
echo -e "\033[0;36mInicializando datos de ejemplo...\033[0m"
docker exec -it credit_app_backend python init_db.py

# Verificar que se hayan creado los datos
echo -e "\033[0;36mVerificando datos creados...\033[0m"

# Verificar usuarios
echo -e "\n\033[0;32mUsuarios creados:\033[0m"
docker exec credit_app_postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT id, email, full_name, role FROM users;"

# Verificar agentes
echo -e "\n\033[0;32mAgentes creados:\033[0m"
docker exec credit_app_postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT id, name, description FROM agents;"

# Verificar campañas
echo -e "\n\033[0;32mCampañas creadas:\033[0m"
docker exec credit_app_postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT id, name, status FROM campaigns;"

# Verificar políticas de crédito
echo -e "\n\033[0;32mPolíticas de crédito creadas:\033[0m"
docker exec credit_app_postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT id, name, is_active FROM credit_policies;"

echo -e "\n\033[0;32mLa base de datos ha sido inicializada con datos de ejemplo correctamente.\033[0m"
echo -e "\033[0;36mPuede acceder al sistema con las siguientes credenciales:\033[0m"
echo -e "\033[0;33mEmail: admin@example.com\033[0m"
echo -e "\033[0;33mContraseña: admin123\033[0m"