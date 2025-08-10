# Alembic Migrations

Este directorio contiene los archivos de migración de la base de datos generados por Alembic.

## Generar una nueva migración

Para generar una nueva migración automáticamente basada en los cambios en los modelos:

```bash
cd backend
alembic revision --autogenerate -m "descripción de los cambios"
```

## Aplicar migraciones

Para aplicar todas las migraciones pendientes:

```bash
cd backend
alembic upgrade head
```

Para aplicar una migración específica:

```bash
cd backend
alembic upgrade <revision_id>
```

## Revertir migraciones

Para revertir a una revisión anterior:

```bash
cd backend
alembic downgrade <revision_id>
```

Para revertir la última migración:

```bash
cd backend
alembic downgrade -1
```

## Historial de migraciones

Para ver el historial de migraciones:

```bash
cd backend
alembic history
```