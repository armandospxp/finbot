#!/usr/bin/env python
"""
Script para ejecutar todas las pruebas del servicio gpt-oss-20b.

Este script configura el entorno de prueba y ejecuta todas las pruebas
del servicio gpt-oss-20b utilizando pytest.
"""

import os
import sys
import pytest

def main():
    """Función principal para ejecutar las pruebas."""
    # Configurar variables de entorno para las pruebas
    os.environ["TESTING"] = "True"
    os.environ["MODEL_PATH"] = "/tmp/test-model"
    os.environ["MAX_TOKENS"] = "100"
    os.environ["TEMPERATURE"] = "0.7"
    os.environ["TOP_P"] = "0.9"
    os.environ["TOP_K"] = "40"
    
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