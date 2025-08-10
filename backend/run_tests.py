#!/usr/bin/env python
"""
Script para ejecutar todas las pruebas del backend.

Este script configura el entorno de prueba y ejecuta todas las pruebas
del backend utilizando pytest.
"""

import os
import sys
import pytest

def main():
    """Función principal para ejecutar las pruebas."""
    # Configurar variables de entorno para las pruebas
    os.environ["TESTING"] = "True"
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"
    os.environ["SECRET_KEY"] = "test-secret-key"
    os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
    os.environ["USE_OPENAI_FALLBACK"] = "true"
    os.environ["OPENAI_API_KEY"] = "test-api-key"
    
    # Directorio de pruebas
    test_dir = os.path.join(os.path.dirname(__file__), "tests")
    
    # Argumentos para pytest
    pytest_args = [
        "-v",  # Modo verboso
        "--cov=.",  # Cobertura de código
        "--cov-report=term",  # Reporte de cobertura en terminal
        "--cov-report=html",  # Reporte de cobertura en HTML
        test_dir  # Directorio de pruebas
    ]
    
    # Ejecutar pytest con los argumentos
    return pytest.main(pytest_args)

if __name__ == "__main__":
    sys.exit(main())