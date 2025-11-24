# OMR Direct API

Servicio de procesamiento OMR (Optical Mark Recognition) con acceso directo desde cliente, bypass de Vercel para reducir bandwidth y latencia.

## Características

- ✅ Autenticación JWT Supabase
- ✅ Compresión WebP (quality=80, max=800px)
- ✅ Retorna 2 imágenes: original + procesada
- ✅ Cliente → OMR directo (sin intermediarios)
- ✅ ~75% bandwidth savings vs legacy

## Quick Start

### Con Docker (Recomendado)

```bash
# 1. Configurar variables de entorno
cp .env.example .env
# Editar .env con valores reales

# 2. Build y run
docker compose up --build

# 3. Verificar
curl http://localhost:8082/health
```

### Sin Docker (Desarrollo)

```bash
# 1. Crear entorno virtual
python3.11 -m venv venv
source venv/bin/activate

# 2. Instalar dependencias del sistema
sudo apt-get update
sudo apt-get install -y libgl1-mesa-glx libglib2.0-0 libzbar0

# 3. Instalar dependencias Python
pip install -r requirements.txt

# 4. Configurar variables
cp .env.example .env
# Editar .env

# 5. Ejecutar
uvicorn omr_api_direct:app --reload --port 8082
```

## API Endpoints

### GET /health

Health check del servicio.

**Response**:
```json
{
  "status": "healthy",
  "service": "omr-direct",
  "version": "1.0.0",
  "uptime_seconds": 12345.67
}
```

### POST /process

Procesa imagen de examen con OMR.

**Headers**:
```
Authorization: Bearer <supabase_jwt>
```

**Request**:
```bash
curl -X POST https://omr-direct.profevision.com/process \
  -H "Authorization: Bearer <jwt>" \
  -F "file=@exam_scan.jpg"
```

**Response (Success)**:
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
    }
  ],
  "original_image": "data:image/webp;base64,...",
  "processed_image": "data:image/webp;base64,..."
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "Failed to detect QR code",
  "error_code": "QR_NOT_FOUND"
}
```

## Configuración

Ver `.env.example` para todas las variables disponibles.

**Principales**:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `8082` | Puerto del servicio |
| `SUPABASE_JWT_SECRET` | - | Secret para validar JWT Supabase |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Orígenes CORS permitidos |
| `IMAGE_QUALITY` | `80` | Calidad de compresión WebP |
| `MAX_IMAGE_DIMENSION` | `800` | Dimensión máxima en píxeles |

## Deployment

### 1. Setup Environment

```bash
# Copy and configure environment variables
cp .env.example .env
vim .env

# Required variables:
# - SUPABASE_JWT_SECRET (from Supabase project settings)
# - ALLOWED_ORIGINS (comma-separated: https://profevision.com,https://testing.profevision.com)
```

### 2. Build and Run Docker Container

```bash
# Build and start
docker-compose up -d

# Check logs
docker-compose logs -f

# Verify health
curl http://localhost:8082/health
```

**Important**: Docker container binds to `127.0.0.1:8082` (localhost only).
External access is handled by nginx reverse proxy.

### 3. Configure Nginx Reverse Proxy

```bash
# Copy nginx configuration
sudo cp nginx-site.conf /etc/nginx/sites-available/omr-direct

# Enable site
sudo ln -s /etc/nginx/sites-available/omr-direct /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 4. Setup SSL with Certbot

```bash
# Install certbot if not already installed
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d omr-direct.profevision.com

# Certbot will automatically update nginx config with SSL settings
```

### 5. Verify Deployment

```bash
# Test health endpoint
curl https://omr-direct.profevision.com/health

# Should return:
# {"status":"healthy","service":"omr-direct","version":"1.0.0","uptime_seconds":123.45}
```

### 6. Monitor Logs

```bash
# Application logs
docker-compose logs -f

# Nginx access logs
sudo tail -f /var/log/nginx/omr-direct-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/omr-direct-error.log
```

### Restart Service

```bash
# Restart container
docker-compose restart

# Restart nginx
sudo systemctl restart nginx
```

### Stop Service

```bash
# Stop container
docker-compose down

# Remove container and volumes
docker-compose down -v
```

Ver documentación completa en `/mddocs/omr-direct-api/PLAN.md` y `/mddocs/omr-direct-api/VERCEL_DEPLOYMENT.md`

## Testing

```bash
# Health check
curl http://localhost:8082/health

# Procesar imagen (requiere JWT válido)
curl -X POST http://localhost:8082/process \
  -H "Authorization: Bearer <jwt>" \
  -F "file=@test_exam.jpg"
```

## Architecture

```
Cliente (Browser/Mobile)
  ↓ JWT Supabase
  ↓ POST /process
OMR Direct API (FastAPI)
  ↓ QR + OMR Detection
  ↓ WebP Compression
  ↓ Return JSON
Cliente
  ↓ Calculate Score
  ↓ Preview
  ↓ Confirm
Next.js Backend
  ↓ Save to Supabase
```

## Comparación vs Legacy

| Aspecto | Legacy | Direct |
|---------|--------|--------|
| **Ruta** | Cliente → Vercel → OMR → Vercel → Cliente | Cliente → OMR → Cliente |
| **Bandwidth** | ~12MB | ~3.12MB |
| **Latency** | ~3-5s | ~1.5-2.5s |
| **Auth** | API key estática | JWT Supabase |
| **Compresión** | No | WebP quality=80 |

## Docs

- Plan completo: `/mddocs/omr-direct-api/PLAN.md`
- Tasks: `/mddocs/omr-direct-api/TASKS.md`
- Legacy API: `/omr-service/`

## License

MIT
