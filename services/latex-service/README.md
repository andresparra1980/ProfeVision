# ProfeVision LaTeX Compilation Service

Microservicio independiente para compilación de documentos LaTeX a PDF usando Tectonic.

## Descripción

Este servicio proporciona una API HTTP basada en FastAPI para compilar documentos LaTeX a PDF. Utiliza Tectonic, un compilador LaTeX moderno y autónomo que descarga automáticamente los paquetes necesarios.

## Arquitectura

```
┌─────────────────────────────────────┐
│  Next.js App (Vercel/Hetzner)       │
│  - UI/UX                             │
│  - Business Logic                    │
└──────────────┬──────────────────────┘
               │ HTTPS POST /compile
               ↓
┌─────────────────────────────────────┐
│  LaTeX Service (Docker)              │
│  - FastAPI                           │
│  - Python + Tectonic                 │
│  - LaTeX → PDF Compilation           │
└─────────────────────────────────────┘
```

## Características

- ✅ API RESTful con FastAPI
- ✅ Documentación automática (Swagger UI)
- ✅ Compilación LaTeX con Tectonic
- ✅ Health checks
- ✅ Autenticación con API key (opcional)
- ✅ Rate limiting estricto (5 req/s)
- ✅ CORS configurable
- ✅ Logging estructurado
- ✅ Docker + Docker Compose
- ✅ Multi-stage build para optimización
- ✅ Validación de seguridad (detecta directivas peligrosas)

## Requisitos

- Docker 20.10+
- Docker Compose 2.0+

**O para desarrollo local:**
- Python 3.11+
- Tectonic (instalado en el sistema)
- Sistema operativo: Linux/macOS (Windows con WSL2)

## Inicio Rápido

### Con Docker Compose (Recomendado)

```bash
# 1. Clonar repositorio (si aún no lo has hecho)
cd ProfeVision/latex-service

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Construir y ejecutar
docker compose up --build

# 4. Verificar que está funcionando
curl http://localhost:8001/health
```

### Con Docker (Manual)

```bash
# Construir imagen
docker build -t profevision-latex:latest .

# Ejecutar container
docker run -p 8001:8001 \
  -e API_KEY=your_api_key \
  -e ALLOWED_ORIGINS=http://localhost:3000 \
  profevision-latex:latest

# Verificar
curl http://localhost:8001/health
```

### Sin Docker (Desarrollo Local)

```bash
# 1. Crear entorno virtual
python3.11 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# 2. Instalar Tectonic (Ubuntu/Debian)
# Opción 1: Desde binario precompilado (recomendado)
curl -L https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz \
  -o tectonic.tar.gz
tar -xzf tectonic.tar.gz
sudo mv tectonic /usr/local/bin/
sudo chmod +x /usr/local/bin/tectonic

# Opción 2: Con conda
conda install -c conda-forge tectonic

# 3. Instalar dependencias Python
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env

# 5. Ejecutar servicio
python latex_api.py

# O con uvicorn:
uvicorn latex_api:app --reload --host 0.0.0.0 --port 8001
```

## API Endpoints

### `GET /health`

Health check del servicio.

**Response:**
```json
{
  "status": "healthy",
  "service": "latex-compiler",
  "version": "1.0.0",
  "uptime_seconds": 12345.67,
  "tectonic_version": "Tectonic 0.15.0"
}
```

### `POST /compile`

Compila código LaTeX a PDF.

**Headers:**
```
X-API-Key: your_api_key (si está configurado)
Content-Type: application/json
```

**Request:**
```json
{
  "tex": "\\documentclass{article}\n\\begin{document}\nHello World\n\\end{document}",
  "job_name": "exam"
}
```

**Request con curl:**
```bash
curl -X POST http://localhost:8001/compile \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "tex": "\\documentclass{article}\\begin{document}Hello World\\end{document}",
    "job_name": "my_document"
  }' \
  --output my_document.pdf
```

**Response (Success):**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="exam.pdf"`
- Headers:
  - `X-Compile-Time-Ms`: Tiempo de compilación en milisegundos
  - `X-PDF-Size-Bytes`: Tamaño del PDF generado
- Body: PDF binario

**Response (Error):**
```json
{
  "error": "LaTeX compilation failed",
  "error_code": "COMPILATION_FAILED",
  "details": {
    "exit_code": 1,
    "stdout": "...",
    "stderr": "..."
  },
  "log": "... (últimos 8KB del log de Tectonic) ..."
}
```

### `GET /docs`

Documentación interactiva de la API (Swagger UI).

Abre en tu navegador: http://localhost:8001/docs

### `GET /`

Información básica del servicio.

## Configuración

### Variables de Entorno

Ver `.env.example` para todas las opciones disponibles.

**Principales:**

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servicio | `8001` |
| `LOG_LEVEL` | Nivel de logging (debug, info, warning, error) | `info` |
| `API_KEY` | API key para autenticación (vacío = deshabilitado) | `` |
| `MAX_TEX_SIZE_MB` | Tamaño máximo de código LaTeX en MB | `1` |
| `COMPILE_TIMEOUT_SEC` | Timeout de compilación en segundos | `60` |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (separados por coma) | `http://localhost:3000` |

### Seguridad

#### Generar API Key

```bash
# Linux/macOS
openssl rand -hex 32

# Python
python -c "import secrets; print(secrets.token_hex(32))"
```

#### Directivas Peligrosas

El servicio bloquea automáticamente código LaTeX con directivas peligrosas:
- `\write18` (ejecución de comandos)
- `shell-escape` (escape al shell)
- `\input{|}` (input con pipe)
- `\openin` / `\openout` (acceso a archivos)

#### Configurar CORS

Para producción, especifica solo tus dominios:

```env
ALLOWED_ORIGINS=https://profevision.com,https://www.profevision.com
```

## Testing

### Test Manual con cURL

```bash
# Health check
curl http://localhost:8001/health

# Compilar LaTeX simple
curl -X POST http://localhost:8001/compile \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"tex":"\\documentclass{article}\\begin{document}Test\\end{document}","job_name":"test"}' \
  -o test.pdf

# Abrir PDF generado
xdg-open test.pdf  # Linux
open test.pdf      # macOS
```

### Test con Python

```python
import requests

# Health check
response = requests.get("http://localhost:8001/health")
print(response.json())

# Compilar LaTeX
latex_code = r"""
\documentclass{article}
\begin{document}
Hello from Python!
\end{document}
"""

response = requests.post(
    "http://localhost:8001/compile",
    headers={"X-API-Key": "your_api_key"},
    json={"tex": latex_code, "job_name": "python_test"}
)

if response.ok:
    with open("python_test.pdf", "wb") as f:
        f.write(response.content)
    print("✅ PDF generado exitosamente")
else:
    print(f"❌ Error: {response.json()}")
```

## Deployment

### Servidor Físico (Hetzner)

**Resumen:**

```bash
# 1. SSH al servidor
ssh user@your-server.com

# 2. Clonar/actualizar repo
cd ~/profevision
git pull origin main

# 3. Configurar variables
cd latex-service
nano .env

# 4. Ejecutar con Docker Compose
docker compose up -d

# 5. Verificar logs
docker compose logs -f

# 6. Configurar Nginx reverse proxy
sudo nano /etc/nginx/sites-available/latex-service.profevision.com
sudo systemctl reload nginx

# 7. Configurar SSL con Let's Encrypt
sudo certbot --nginx -d latex-service.profevision.com
```

Ver guía completa de configuración Nginx + SSL similar a OMR service.

### Configuración con systemd (Auto-start)

```bash
# Ejecutar script de instalación
cd ~/profevision/latex-service
sudo ./install-systemd.sh

# El script automáticamente:
# - Crea servicio systemd
# - Habilita auto-start en boot
# - Inicia el servicio
# - Muestra estado
```

## Monitoreo

### Ver Logs

```bash
# Docker Compose
docker compose logs -f

# Docker (container específico)
docker logs -f profevision-latex

# Últimas 100 líneas
docker compose logs --tail 100

# Systemd
sudo journalctl -u profevision-latex -f
```

### Verificar Estado

```bash
# Health check
curl http://localhost:8001/health

# Docker container status
docker compose ps

# Uso de recursos
docker stats profevision-latex

# Systemd status
sudo systemctl status profevision-latex
```

### Métricas

El servicio expone logs estructurados en formato JSON:

```json
{
  "time": "2025-11-14T22:30:45",
  "level": "INFO",
  "message": "LaTeX compilation successful: job_name=exam, size=45678 bytes, time=1234.56ms"
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

### Errores de compilación LaTeX

```bash
# Verificar que Tectonic está disponible
docker compose exec latex-service tectonic --version

# Ver logs detallados
docker compose logs -f | grep ERROR

# Ejecutar en modo debug
# Editar .env: LOG_LEVEL=debug
docker compose restart
```

### "Tectonic binary not found"

```bash
# Reconstruir imagen Docker
docker compose build --no-cache

# Verificar que Tectonic se instaló correctamente
docker compose exec latex-service which tectonic
docker compose exec latex-service tectonic --version
```

### Alto uso de memoria

```bash
# Ver uso actual
docker stats profevision-latex

# Ajustar límites en docker-compose.yml
# deploy.resources.limits.memory: 2G → 3G
```

## Desarrollo

### Estructura del Código

```
latex-service/
├── latex_api.py              # FastAPI application
├── requirements.txt          # Python dependencies
├── Dockerfile                # Container definition
├── docker-compose.yml        # Docker Compose config
├── .env.example              # Example environment variables
├── .dockerignore             # Docker build exclusions
├── nginx-latex-service-precertbot.conf  # Nginx config (pre-SSL)
├── nginx-latex-service.conf  # Nginx config (with SSL reference)
├── install-systemd.sh        # Systemd installation script
├── profevision-latex.service # Systemd service template
└── README.md                 # This file
```

### Agregar Features

1. Editar `latex_api.py` para nuevos endpoints
2. Actualizar `requirements.txt` si se agregan dependencias
3. Reconstruir imagen: `docker compose build`
4. Probar localmente
5. Commit y deploy

## Performance

**Tiempos típicos de compilación:**

- Documento simple (Hello World): 0.5-1s
- Documento con paquetes (artículo científico): 2-5s
- Documento complejo (tesis, libro): 5-15s
- Primera compilación (descarga de paquetes): +2-5s

**Optimizaciones:**

- Tectonic descarga paquetes solo la primera vez
- Multi-stage Docker build reduce tamaño de imagen
- FastAPI es async para mejor concurrencia
- Health checks evitan cold starts
- Compilaciones en paralelo (hasta límite de recursos)

## Limitaciones

- **Tamaño máximo:** 1MB de código LaTeX (configurable)
- **Timeout:** 60 segundos (configurable)
- **Rate limit:** 5 req/s por IP (configurable en Nginx)
- **Memoria:** ~2GB por compilación compleja
- **Paquetes:** Solo los disponibles en CTAN (repositorio de Tectonic)

## Integración con Next.js

En tu aplicación Next.js desplegada en Vercel, configura:

```env
# .env.production (Vercel)
LATEX_USE_NEW_SERVICE=true
LATEX_SERVICE_URL=https://latex-service.profevision.com
LATEX_SERVICE_API_KEY=your_api_key
LATEX_TIMEOUT_MS=120000
```

El código en `/api/latex/compile/route.ts` detectará automáticamente:
- **Vercel**: Usa servicio HTTP (no hay Tectonic local)
- **VPS con flag**: Usa servicio HTTP con fallback a Tectonic local
- **VPS sin flag**: Usa Tectonic local directamente

## Soporte

**Issues:** https://github.com/andresparra1980/profevision/issues

**Documentación de Tectonic:** https://tectonic-typesetting.github.io/

## Licencia

MIT
