# ProfeVision OMR Processing Service

Microservicio independiente para procesamiento de exámenes mediante OMR (Optical Mark Recognition).

## Descripción

Este servicio proporciona una API HTTP basada en FastAPI para procesar imágenes de exámenes escaneados. Utiliza técnicas de visión por computadora (OpenCV) para:

- Detectar códigos QR en exámenes
- Identificar y analizar burbujas de respuestas múltiples
- Calcular respuestas basadas en el llenado de burbujas
- Generar imágenes de depuración con detecciones visualizadas

## Arquitectura

```
┌─────────────────────────────────────┐
│  Next.js App (Vercel/Hetzner)       │
│  - UI/UX                             │
│  - Business Logic                    │
└──────────────┬──────────────────────┘
               │ HTTP POST /process
               ↓
┌─────────────────────────────────────┐
│  OMR Service (Docker)                │
│  - FastAPI                           │
│  - Python + OpenCV                   │
│  - QR + Bubble Detection             │
└─────────────────────────────────────┘
```

## Características

- ✅ API RESTful con FastAPI
- ✅ Documentación automática (Swagger UI)
- ✅ Procesamiento de imágenes con OpenCV
- ✅ Detección de códigos QR con pyzbar
- ✅ Health checks
- ✅ Autenticación con API key (opcional)
- ✅ Rate limiting
- ✅ CORS configurable
- ✅ Logging estructurado
- ✅ Docker + Docker Compose
- ✅ Multi-stage build para optimización

## Requisitos

- Docker 20.10+
- Docker Compose 2.0+

**O para desarrollo local:**
- Python 3.11+
- Sistema operativo: Linux/macOS (Windows con WSL2)

## Inicio Rápido

### Con Docker Compose (Recomendado)

```bash
# 1. Clonar repositorio (si aún no lo has hecho)
cd ProfeVision/omr-service

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Construir y ejecutar
docker compose up --build

# 4. Verificar que está funcionando
curl http://localhost:8000/health
```

### Con Docker (Manual)

```bash
# Construir imagen
docker build -t profevision-omr:latest .

# Ejecutar container
docker run -p 8000:8000 \
  -e API_KEY=your_api_key \
  -e ALLOWED_ORIGINS=http://localhost:3000 \
  profevision-omr:latest

# Verificar
curl http://localhost:8000/health
```

### Sin Docker (Desarrollo Local)

```bash
# 1. Crear entorno virtual
python3.11 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# 2. Instalar dependencias del sistema (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y \
  libgl1-mesa-glx \
  libglib2.0-0 \
  libzbar0

# 3. Instalar dependencias Python
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env

# 5. Ejecutar servicio
python omr_api.py

# O con uvicorn:
uvicorn omr_api:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### `GET /health`

Health check del servicio.

**Response:**
```json
{
  "status": "healthy",
  "service": "omr-processor",
  "version": "1.0.0",
  "uptime_seconds": 12345.67
}
```

### `POST /process`

Procesa una imagen de examen con OMR.

**Headers:**
```
X-API-Key: your_api_key (si está configurado)
```

**Request:**
```bash
curl -X POST http://localhost:8000/process \
  -H "X-API-Key: your_api_key" \
  -F "file=@exam_scan.jpg" \
  -F "debug=true"
```

**Response (Success):**
```json
{
  "success": true,
  "qr_data": "exam_id:student_id:group_id:version",
  "total_questions": 40,
  "answered_questions": 38,
  "answers": [
    {
      "number": 1,
      "value": "A",
      "confidence": 0.95,
      "num_options": 4
    },
    {
      "number": 2,
      "value": null,
      "confidence": 0.0,
      "num_options": 4
    }
  ],
  "processed_image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Failed to detect QR code",
  "error_code": "QR_NOT_FOUND",
  "details": {
    "attempted_strategies": ["direct", "scaled", "sharpened"]
  }
}
```

### `GET /docs`

Documentación interactiva de la API (Swagger UI).

Abre en tu navegador: http://localhost:8000/docs

### `GET /`

Información básica del servicio.

## Configuración

### Variables de Entorno

Ver `.env.example` para todas las opciones disponibles.

**Principales:**

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servicio | `8000` |
| `LOG_LEVEL` | Nivel de logging (debug, info, warning, error) | `info` |
| `API_KEY` | API key para autenticación (vacío = deshabilitado) | `` |
| `MAX_IMAGE_SIZE_MB` | Tamaño máximo de imagen en MB | `10` |
| `ENABLE_DEBUG_IMAGES` | Generar imágenes de depuración | `false` |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (separados por coma) | `http://localhost:3000` |

### Seguridad

#### Generar API Key

```bash
# Linux/macOS
openssl rand -hex 32

# Python
python -c "import secrets; print(secrets.token_hex(32))"
```

#### Configurar CORS

Para producción, especifica solo tus dominios:

```env
ALLOWED_ORIGINS=https://profevision.com,https://www.profevision.com
```

## Testing

### Test Manual con cURL

```bash
# Health check
curl http://localhost:8000/health

# Procesar imagen
curl -X POST http://localhost:8000/process \
  -H "X-API-Key: your_api_key" \
  -F "file=@test_exam.jpg" \
  -o result.json

# Ver resultado
cat result.json | jq .
```

### Test con Python

```python
import requests

# Health check
response = requests.get("http://localhost:8000/health")
print(response.json())

# Procesar imagen
with open("test_exam.jpg", "rb") as f:
    files = {"file": f}
    headers = {"X-API-Key": "your_api_key"}
    response = requests.post(
        "http://localhost:8000/process",
        files=files,
        headers=headers,
    )
    result = response.json()
    print(result)
```

## Deployment

### Servidor Físico (Hetzner)

Ver guía completa en: `/mddocs/OMR_SERVICE_MIGRATION.md`

**Resumen:**

```bash
# 1. SSH al servidor
ssh user@your-server.com

# 2. Clonar/actualizar repo
cd ~/profevision
git pull origin main

# 3. Configurar variables
cd omr-service
nano .env

# 4. Ejecutar con Docker Compose
docker compose up -d

# 5. Verificar logs
docker compose logs -f

# 6. Configurar Nginx reverse proxy
sudo nano /etc/nginx/sites-available/profevision
sudo systemctl reload nginx
```

### Railway (Cloud)

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Inicializar proyecto (desde root de ProfeVision)
cd ProfeVision
railway init

# 4. Configurar root directory en Railway dashboard
# Settings → Root Directory: omr-service/

# 5. Deploy
railway up
```

## Monitoreo

### Ver Logs

```bash
# Docker Compose
docker compose logs -f

# Docker (container específico)
docker logs -f profevision-omr

# Últimas 100 líneas
docker compose logs --tail 100
```

### Verificar Estado

```bash
# Health check
curl http://localhost:8000/health

# Docker container status
docker compose ps

# Uso de recursos
docker stats profevision-omr
```

### Métricas

El servicio expone logs estructurados en formato JSON:

```json
{
  "time": "2025-10-15T10:30:45",
  "level": "INFO",
  "message": {
    "method": "POST",
    "path": "/process",
    "status_code": 200,
    "duration_ms": 845.23
  }
}
```

## Troubleshooting

### Container no inicia

```bash
# Ver logs completos
docker compose logs

# Verificar variables de entorno
docker compose config

# Reconstruir desde cero
docker compose down
docker compose build --no-cache
docker compose up
```

### Errores de procesamiento

```bash
# Verificar dependencias del sistema
docker compose exec omr-service python -c "import cv2; import pyzbar"

# Ver logs detallados
docker compose logs -f | grep ERROR

# Ejecutar en modo debug
# Editar .env: LOG_LEVEL=debug
docker compose restart
```

### Alto uso de memoria

```bash
# Ver uso actual
docker stats profevision-omr

# Ajustar límites en docker-compose.yml
# deploy.resources.limits.memory: 1G → 2G
```

## Desarrollo

### Estructura del Código

```
omr-service/
├── omr_api.py              # FastAPI application
├── omr_standalone.py       # OMR processor (OpenCV logic)
├── requirements.txt        # Python dependencies
├── Dockerfile              # Container definition
├── docker-compose.yml      # Docker Compose config
├── .env.example            # Example environment variables
├── .dockerignore           # Docker build exclusions
└── README.md               # This file
```

### Agregar Features

1. Editar `omr_api.py` para nuevos endpoints
2. Editar `omr_standalone.py` para lógica de procesamiento
3. Actualizar `requirements.txt` si se agregan dependencias
4. Reconstruir imagen: `docker compose build`
5. Probar localmente
6. Commit y deploy

## Performance

**Tiempos típicos de procesamiento:**

- Imagen típica (1920x1080, JPEG): 0.8-1.5s
- Imagen grande (4K, PNG): 2-3s
- Primera petición (cold start): +0.5s

**Optimizaciones:**

- Usa `opencv-python-headless` (sin GUI)
- Multi-stage Docker build reduce tamaño de imagen
- FastAPI es async para mejor concurrencia
- Health checks evitan cold starts

## Soporte

**Issues:** https://github.com/andresparra1980/profevision/issues

**Documentación completa:** `/mddocs/OMR_SERVICE_MIGRATION.md`

## Licencia

MIT
