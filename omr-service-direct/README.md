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

Ver documentación completa en `/mddocs/omr-direct-api/PLAN.md`

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
