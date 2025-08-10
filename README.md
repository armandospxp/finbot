# Sistema de Agentes Vendedores de Créditos

Este proyecto implementa un sistema de agentes virtuales para la venta de créditos, con capacidad para realizar campañas masivas por WhatsApp, email y mensajes de texto, integración con APIs externas para verificación de créditos, y un panel de administración tipo CRM.

## Características Principales

- **Agentes Virtuales**: Implementación de agentes IA para venta de créditos
- **Campañas Masivas**: Capacidad de envío por WhatsApp, email y SMS
- **Integración con APIs**: Conexión con sistemas externos para verificación de créditos
- **Procesamiento de Políticas**: Extracción de conocimiento desde documentos PDF
- **Panel de Administración**: Dashboard para monitoreo y control de agentes
- **Base de Datos Vectorial**: Almacenamiento eficiente de conocimiento con ChromaDB
- **Pruebas Automatizadas**: Cobertura completa de pruebas para todos los componentes

## Estructura del Proyecto

- `/frontend`: Interfaz de usuario tipo CRM
- `/backend`: API y lógica de negocio
- `/agents`: Implementación de los agentes virtuales
- `/knowledge`: Procesamiento y almacenamiento de políticas
- `/integrations`: Conectores para servicios externos (WhatsApp, Email, SMS)
- `/gpt-oss-20b`: Servicio de modelo de lenguaje local

## Requisitos Técnicos

- Diseñado para entornos on-premise con recursos limitados
- Optimizado para rendimiento y escalabilidad
- Arquitectura modular para facilitar mantenimiento
- Soporte para Docker y Podman
- Base de datos PostgreSQL
- Integración con gpt-oss-20b para procesamiento de lenguaje natural
  - Modelo de lenguaje local para mayor privacidad y control
  - Fallback automático a OpenAI cuando sea necesario
  - Optimizado para hardware con GPU

## Instalación y Ejecución con Docker

### Requisitos Previos

- Docker y Docker Compose (o Podman y Podman Compose)
- Git

### Pasos para Ejecutar

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/agentes_vendedores_prestamos.git
   cd agentes_vendedores_prestamos
   ```

2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Editar el archivo .env con tus configuraciones
   ```

3. Iniciar los servicios con Docker:
   ```bash
   docker-compose up -d
   ```
   
   O con Podman:
   ```bash
   podman-compose up -d
   ```

4. Acceder a la aplicación:
   - Frontend: http://localhost
   - API Backend: http://localhost:8000
   - Documentación API: http://localhost:8000/docs

### Comandos Útiles

- Ver logs de los servicios:
  ```bash
  docker-compose logs -f
  ```

- Ver logs específicos del servicio gpt-oss-20b:
  ```bash
  docker-compose logs -f gpt-oss-20b
  ```

- Detener los servicios:
  ```bash
  docker-compose down
  ```

- Reconstruir los servicios después de cambios:
  ```bash
  docker-compose build
  docker-compose up -d
  ```

- Iniciar solo el servicio de backend y gpt-oss-20b (útil para desarrollo):
  ```bash
  docker-compose up -d postgres gpt-oss-20b backend
  ```

## Desarrollo Local

Para desarrollo local sin Docker, consulta la documentación en `/docs/desarrollo-local.md`

## Pruebas Automatizadas

El proyecto cuenta con pruebas automatizadas para todos sus componentes, garantizando la calidad y estabilidad del código.

### Pruebas del Backend

Para ejecutar las pruebas del backend:

```bash
cd backend
python run_tests.py
```

Esto ejecutará todas las pruebas de los endpoints de la API, incluyendo:
- Usuarios y autenticación
- Agentes virtuales
- Campañas
- Solicitudes de crédito
- Políticas de crédito
- Dashboard

### Pruebas del Servicio gpt-oss-20b

Para ejecutar las pruebas del servicio de modelo de lenguaje:

```bash
cd gpt-oss-20b
python run_tests.py
```

Estas pruebas verifican:
- Servidor API compatible con OpenAI
- Cliente Python para integración con el backend
- Manejo de errores y fallbacks

### Cobertura de Código

Los scripts de prueba generan informes de cobertura en formato HTML que pueden consultarse en:
- Backend: `backend/htmlcov/index.html`
- gpt-oss-20b: `gpt-oss-20b/htmlcov/index.html`