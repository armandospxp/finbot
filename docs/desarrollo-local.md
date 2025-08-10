# Guía de Desarrollo Local

Esta guía proporciona instrucciones para configurar y ejecutar el sistema de Agentes Vendedores de Créditos en un entorno de desarrollo local sin Docker.

## Requisitos Previos

- Python 3.11 o superior
- Node.js 18 o superior
- PostgreSQL 15 o superior
- Git

## Configuración del Backend

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/agentes_vendedores_prestamos.git
cd agentes_vendedores_prestamos
```

### 2. Configurar el entorno virtual de Python

```bash
python -m venv venv

# En Windows
venv\Scripts\activate

# En macOS/Linux
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
cd backend
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env
# Editar el archivo .env con tus configuraciones locales
```

### 5. Iniciar el servidor de desarrollo

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Configuración del Frontend

### 1. Instalar dependencias

```bash
cd frontend
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
# Editar el archivo .env.local con tus configuraciones
```

### 3. Iniciar el servidor de desarrollo

```bash
npm start
```

## Configuración de la Base de Datos

### 1. Crear la base de datos en PostgreSQL

```bash
psql -U postgres
CREATE DATABASE credit_agents_db;
\q
```

### 2. Ejecutar migraciones (si se usa Alembic)

```bash
cd backend
alembic upgrade head
```

## Configuración de los Agentes IA

### 1. Configurar el modelo gpt-oss-20b

Para utilizar el modelo gpt-oss-20b en desarrollo local, sigue estos pasos:

1. Instala las dependencias necesarias:

```bash
pip install torch transformers accelerate bitsandbytes sentencepiece protobuf
pip install gpt-oss-20b
```

2. Configura las variables de entorno para el modelo en tu archivo `.env`:

```
# Configuración de GPT-OSS-20B
GPT_OSS_MODEL_URL=http://localhost:8080
USE_OPENAI_FALLBACK=true
DEFAULT_LLM_MODEL=gpt-oss-20b
```

3. Ejecutar el servicio gpt-oss-20b localmente:

```bash
cd gpt-oss-20b
pip install -r requirements.txt
python server.py
```

4. Verificar que el servicio esté funcionando correctamente:

```bash
curl http://localhost:8080/health
```

Deberías recibir una respuesta como:
```json
{"status": "ok", "model": "gpt-oss-20b"}
```

5. Alternativa: Usar Docker solo para el servicio gpt-oss-20b:

```bash
docker-compose up -d gpt-oss-20b
```

Esto es útil si tienes una GPU y quieres aprovecharla sin tener que configurar todo el entorno de desarrollo en Docker.

## Pruebas Automatizadas

### Ejecutar pruebas del backend

```bash
cd backend
python run_tests.py
```

Esto ejecutará todas las pruebas de los endpoints de la API y generará un informe de cobertura. Alternativamente, puedes ejecutar pruebas específicas con pytest:

```bash
# Ejecutar todas las pruebas con pytest directamente
python -m pytest

# Ejecutar pruebas específicas
python -m pytest tests/test_users.py
python -m pytest tests/test_agents.py
python -m pytest tests/test_campaigns.py
python -m pytest tests/test_applications.py
python -m pytest tests/test_credit_policies.py
python -m pytest tests/test_dashboard.py
python -m pytest tests/test_gpt_config.py

# Ejecutar pruebas con marcadores específicos
python -m pytest -m "not slow"
```

### Ejecutar pruebas del servicio gpt-oss-20b

```bash
cd gpt-oss-20b
python run_tests.py
```

Esto ejecutará todas las pruebas del servicio gpt-oss-20b, incluyendo:

```bash
# Ejecutar pruebas específicas
python -m pytest tests/test_server.py
python -m pytest tests/test_gpt_oss_client.py
```

### Ejecutar pruebas del frontend

```bash
cd frontend
npm test

# Ejecutar pruebas con cobertura
npm test -- --coverage

# Ejecutar pruebas específicas
npm test -- -t "nombre del test"
```

### Visualizar informes de cobertura

Después de ejecutar las pruebas con cobertura, puedes ver los informes HTML:

```bash
# Para el backend
open backend/htmlcov/index.html

# Para gpt-oss-20b
open gpt-oss-20b/htmlcov/index.html

# Para el frontend
open frontend/coverage/lcov-report/index.html
```

## Solución de Problemas Comunes

### Problemas de conexión a la base de datos

Verifica que PostgreSQL esté en ejecución y que las credenciales en el archivo `.env` sean correctas.

```bash
psql -U postgres -h localhost -p 5432 -d credit_agents_db
```

### Problemas con las dependencias de Python

Si encuentras errores relacionados con las dependencias, intenta actualizar pip e instalar las dependencias nuevamente:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Problemas con Node.js

Si encuentras errores relacionados con Node.js, verifica la versión y limpia la caché de npm:

```bash
node -v
npm -v
npm cache clean --force
npm install
```

### Problemas con gpt-oss-20b

#### Error al cargar el modelo

Si encuentras errores al cargar el modelo gpt-oss-20b, verifica lo siguiente:

1. Asegúrate de tener suficiente memoria RAM y VRAM (si usas GPU):

```bash
# Verificar memoria disponible en Linux
free -h

# Verificar GPU en Linux con NVIDIA
nvidia-smi

# Verificar GPU en Windows con NVIDIA
nvidia-smi
```

2. Verifica que las dependencias de PyTorch estén correctamente instaladas:

```bash
python -c "import torch; print(torch.__version__); print('CUDA disponible:', torch.cuda.is_available())"
```

3. Si el modelo es demasiado grande para tu hardware, puedes configurar el sistema para usar el fallback a OpenAI:

```bash
# En tu archivo .env
USE_OPENAI_FALLBACK=true
```

#### Problemas de conexión con el servicio gpt-oss-20b

Si el backend no puede conectarse al servicio gpt-oss-20b, verifica lo siguiente:

1. Asegúrate de que el servicio esté en ejecución:

```bash
curl http://localhost:8080/health
```

2. Verifica los logs del servicio:

```bash
# Si estás usando Docker
docker-compose logs -f gpt-oss-20b

# Si estás ejecutando localmente
# Revisa la salida de la consola donde ejecutaste python server.py
```

3. Verifica que la URL configurada en el backend sea correcta:

```bash
# En tu archivo .env del backend
GPT_OSS_MODEL_URL=http://localhost:8080
```