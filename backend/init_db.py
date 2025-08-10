#!/usr/bin/env python
"""
Script para inicializar la base de datos PostgreSQL.
Este script crea un usuario administrador inicial si no existe.
"""

import asyncio
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import os

from models import User
from routes.users import get_password_hash

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()

# Obtener URL de la base de datos
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost/credit_agents_db")

# Crear motor de base de datos asíncrono
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """
    Inicializa la base de datos con datos iniciales.
    """
    try:
        async with AsyncSessionLocal() as session:
            # Verificar si ya existe un usuario administrador
            result = await session.execute(select(User).filter(User.is_admin == True))
            admin_user = result.scalars().first()
            
            if not admin_user:
                # Crear usuario administrador inicial
                admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
                admin_password = os.getenv("ADMIN_PASSWORD", "adminpassword")
                
                logger.info(f"Creando usuario administrador inicial: {admin_email}")
                
                hashed_password = get_password_hash(admin_password)
                admin_user = User(
                    email=admin_email,
                    full_name="Administrador",
                    hashed_password=hashed_password,
                    is_active=True,
                    is_admin=True
                )
                
                session.add(admin_user)
                await session.commit()
                
                logger.info("Usuario administrador creado exitosamente")
            else:
                logger.info("El usuario administrador ya existe, no se creará uno nuevo")
                
    except SQLAlchemyError as e:
        logger.error(f"Error al inicializar la base de datos: {e}")
        raise


async def main():
    """
    Función principal para ejecutar la inicialización de la base de datos.
    """
    logger.info("Iniciando la inicialización de la base de datos...")
    await init_db()
    logger.info("Inicialización de la base de datos completada")


if __name__ == "__main__":
    asyncio.run(main())