#!/bin/bash
set -e

# Función para esperar a que PostgreSQL esté disponible
wait_for_postgres() {
  echo "Esperando a que PostgreSQL esté disponible..."
  until PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c '\q' 2>/dev/null; do
    echo "PostgreSQL no está disponible aún - esperando..."
    sleep 2
  done
  echo "PostgreSQL está disponible!"
}

# Esperar a que PostgreSQL esté disponible
wait_for_postgres

# Ejecutar migraciones de Alembic
echo "Ejecutando migraciones de Alembic..."
alembic upgrade head

# Inicializar la base de datos con datos iniciales
echo "Inicializando la base de datos..."
python init_db.py

# Ejecutar el comando proporcionado (por defecto: uvicorn)
exec "$@"