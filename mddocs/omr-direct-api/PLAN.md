# OMR Direct API - Plan de Arquitectura

## Resumen Ejecutivo

Implementación de nueva API OMR que permite conexión directa desde cliente (navegador/celular) al servicio de procesamiento, evitando infraestructura de Vercel para reducir consumo de bandwidth y mejorar latencia.

**Status**: Planificación
**Branch**: `feature/omr-direct-api`
**Puerto**: 8082 (8081 usado por LaTeX service)
**Domain**: `omr-direct.profevision.com`

---

## Motivación

### Problemas Actuales

**Flujo Legacy**:
```
Cliente → Vercel → OMR API (Hetzner) → Vercel → Cliente
        ↑ Bandwidth $$$ ↑
```

**Issues**:
- Imágenes viajan 2 veces por Vercel (upload + download)
- Bandwidth cost en plan Vercel
- Latencia adicional (2 hops extras)
- Processing en Vercel innecesario

### Solución Propuesta

**Flujo Direct**:
```
Cliente → OMR Direct API (Hetzner) → Cliente
         ↑ 1 hop, sin Vercel ↑
```

**Benefits**:
- ✅ Bypass Vercel bandwidth
- ✅ Latencia reducida (~50% faster)
- ✅ Escalabilidad independiente
- ✅ Compresión en API (40-80KB por imagen)
- ✅ JWT Supabase auth (no intermediarios)

---

## Arquitectura

### Servicios Paralelos

```
┌─────────────────────────────────────────────────┐
│  OMR Services                                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  omr-service.profevision.com:8080 (LEGACY)      │
│  ├─ API key estática                            │
│  ├─ Retorna 1 imagen procesada sin comprimir    │
│  ├─ Cliente → Vercel → OMR → Vercel → Cliente  │
│  └─ Estado: Mantener para backward compat       │
│                                                  │
│  omr-direct.profevision.com:8082 (NEW)          │
│  ├─ JWT Supabase validation                     │
│  ├─ Compresión WebP (quality=80, max=800px)     │
│  ├─ Retorna 2 imágenes: original + procesada    │
│  ├─ Cliente → OMR Direct → Cliente (directo)    │
│  └─ Estado: Desarrollo                          │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Flujo Completo

```
┌──────────────┐
│   Cliente    │ 1. Captura foto desde celular
│  (Browser)   │
└──────┬───────┘
       │
       │ 2. Extrae JWT de session Supabase
       │    const { session } = await supabase.auth.getSession()
       │    const token = session.access_token
       │
       │ 3. POST directo a OMR Direct API
       │    URL: https://omr-direct.profevision.com/process
       │    Headers: Authorization: Bearer <jwt>
       │    Body: FormData(image)
       ↓
┌────────────────┐
│  OMR Direct    │ 4. Valida JWT con Supabase secret
│  FastAPI       │ 5. Procesa imagen (QR + OMR bubbles)
│  (Hetzner)     │ 6. Comprime 2 imágenes a WebP:
└──────┬─────────┘    - Original (con auto-rotate EXIF)
       │               - Procesada (con anotaciones)
       │            7. Retorna JSON:
       │               {
       │                 qr_data: "exam:student:group:v",
       │                 answers: [...],
       │                 original_image: "data:image/webp;base64,...",
       │                 processed_image: "data:image/webp;base64,..."
       │               }
       ↓
┌──────────────┐
│   Cliente    │ 8. Parsea qr_data → exam_id
└──────┬───────┘ 9. Fetch respuestas correctas (Supabase RLS)
       │        10. Calcula calificación client-side
       │        11. Muestra preview con:
       │            - Processed image (anotaciones)
       │            - Score calculado
       │            - Answers detectadas vs correctas
       │
       │ 12. Usuario confirma o corrige
       │
       │ 13. POST /api/exams/save-results (Vercel)
       │     Body: {
       │       answers,
       │       original_image (base64, ~60KB),
       │       processed_image (base64, ~60KB),
       │       qr_data,
       │       exam_score
       │     }
       ↓
┌────────────────┐
│ Next.js API    │ 14. Recibe imágenes comprimidas
│ (Vercel)       │ 15. Sube a Supabase Storage (S3)
└────────────────┘ 16. Guarda answers + results a DB
                   17. Success
```

---

## Componentes Técnicos

### 1. OMR Direct API (FastAPI)

**Ubicación**: `omr-service-direct/`

**Stack**:
- FastAPI 0.100+
- Python 3.11+
- OpenCV (via omr_standalone.py)
- Pillow (compresión WebP)
- PyJWT (validación Supabase)
- pyzbar (QR detection)

**Endpoints**:

```python
GET  /health
  → Health check + uptime

POST /process
  Headers: Authorization: Bearer <jwt>
  Body: FormData(file: image)
  → OMRResult {
      success: bool,
      qr_data: str,
      answers: List[Answer],
      original_image: str (base64 WebP),
      processed_image: str (base64 WebP)
    }

GET  /
  → Service info + docs link
```

**Seguridad**:
- JWT Supabase validation (HS256)
- Audience check: "authenticated"
- Rate limiting (opcional, via nginx)
- CORS configurado para profevision.com
- Max file size: 10MB

### 2. Compresión de Imágenes

**Librería**: Pillow (PIL)

**Parámetros** (matching Next.js):
```python
quality = 80          # WebP quality
max_dimension = 800   # px, fit inside
format = "WEBP"
method = 6            # WebP compression method (best)
```

**Proceso**:
1. Abrir imagen con Pillow
2. Auto-rotate según EXIF (ImageOps.exif_transpose)
3. Resize si > 800px (mantiene aspect ratio)
4. Convertir a WebP con quality=80
5. Return base64 data URL

**Tamaño esperado**: 40-80KB por imagen (vs ~2-5MB original)

### 3. Validación JWT Supabase

**Secret**: `SUPABASE_JWT_SECRET` (env var)

**Claims esperados**:
```json
{
  "sub": "user_uuid",
  "email": "user@example.com",
  "aud": "authenticated",
  "role": "authenticated",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Validación**:
```python
import jwt

payload = jwt.decode(
    token,
    SUPABASE_JWT_SECRET,
    algorithms=["HS256"],
    audience="authenticated"
)
```

**Errores**:
- 401: Token missing/invalid/expired
- 403: Valid token but insufficient permissions (future)

### 4. Cliente (Scan Wizard)

**Ubicación**: `components/exam/scan-wizard.tsx`

**Cambios**:
- Extraer JWT de Supabase session
- POST directo a OMR Direct API (bypass Vercel)
- Fetch respuestas correctas de DB (client-side)
- Calcular score (client-side)
- Preview con imágenes comprimidas
- Confirmar → enviar a `/api/exams/save-results`

**Feature Flag**:
```env
NEXT_PUBLIC_USE_DIRECT_OMR=true
NEXT_PUBLIC_OMR_DIRECT_URL=https://omr-direct.profevision.com
```

### 5. Backend Next.js

**Endpoint**: `/api/exams/save-results`

**Cambios mínimos**:
- Ya recibe imágenes comprimidas (base64)
- Ya sube a Supabase Storage
- No cambios necesarios (compatible)

---

## Especificaciones de Datos

### OMRResult Response

```typescript
interface OMRResult {
  success: boolean;
  qr_data: string | null;           // "exam_id:student_id:group_id:version"
  total_questions: number;
  answered_questions: number;
  answers: Answer[];
  original_image: string | null;    // "data:image/webp;base64,..."
  processed_image: string | null;   // "data:image/webp;base64,..."
  error?: string;
  error_code?: string;
}

interface Answer {
  number: number;        // Question number (1-based)
  value: string | null;  // "A", "B", "C", "D", or null
  confidence: number;    // 0.0 - 1.0
  num_options: number;   // Usually 4
}
```

### Save Results Request

```typescript
interface SaveResultsRequest {
  qrData: {
    examId: string;
    studentId: string;
    groupId: string;
    version?: string;
  };
  answers: Array<{
    pregunta_id: string;
    opcion_id: string;
    es_correcta: boolean;
  }>;
  originalImage: string;    // base64 WebP (~60KB)
  processedImage: string;   // base64 WebP (~60KB)
  examScore: number;
  isDuplicate?: boolean;
  duplicateInfo?: {
    resultadoId: string;
  };
}
```

---

## Variables de Entorno

### OMR Direct API

```env
# omr-service-direct/.env
PORT=8082
HOST=0.0.0.0

# Supabase JWT validation
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_JWT_SECRET=your_jwt_secret_here

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://profevision.com,https://testing.profevision.com

# Image processing
MAX_IMAGE_SIZE_MB=10
IMAGE_QUALITY=80
MAX_IMAGE_DIMENSION=800

# Logging
LOG_LEVEL=info
```

### Next.js (Cliente)

```env
# .env.local
NEXT_PUBLIC_USE_DIRECT_OMR=true
NEXT_PUBLIC_OMR_DIRECT_URL=https://omr-direct.profevision.com

# Development
# NEXT_PUBLIC_OMR_DIRECT_URL=http://localhost:8082
```

---

## Deployment

### Docker

**Estructura**:
```
omr-service-direct/
├── omr_api_direct.py       # FastAPI app
├── omr_standalone.py       # Symlink a ../omr-service/omr_standalone.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

**Docker Compose**:
```yaml
version: '3.8'

services:
  omr-direct:
    build: .
    container_name: profevision-omr-direct
    ports:
      - "127.0.0.1:8082:8082"  # Only localhost, nginx reverse proxy
    environment:
      - PORT=8082
      - SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
      - IMAGE_QUALITY=80
      - MAX_IMAGE_DIMENSION=800
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
```

### Nginx

```nginx
# /etc/nginx/sites-available/omr-direct
server {
    listen 80;
    server_name omr-direct.profevision.com;

    location / {
        proxy_pass http://localhost:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Allow larger request bodies for images
        client_max_body_size 10M;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# SSL config (certbot)
server {
    listen 443 ssl;
    server_name omr-direct.profevision.com;

    ssl_certificate /etc/letsencrypt/live/omr-direct.profevision.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/omr-direct.profevision.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8082;
        # ... (same as above)
    }
}
```

---

## Testing

### Test Checklist

**OMR Direct API**:
- [ ] Health check responde
- [ ] JWT válido acepta request
- [ ] JWT inválido rechaza (401)
- [ ] JWT expirado rechaza (401)
- [ ] Imagen procesa correctamente
- [ ] QR detecta correctamente
- [ ] Respuestas detectan correctamente
- [ ] Compresión WebP funciona
- [ ] Tamaño imágenes < 100KB
- [ ] EXIF rotation funciona
- [ ] CORS headers correctos
- [ ] Max file size enforcement

**Cliente**:
- [ ] Extrae JWT de session
- [ ] POST directo funciona
- [ ] Fetch respuestas correctas
- [ ] Cálculo score correcto
- [ ] Preview muestra imágenes
- [ ] Confirmar guarda a DB
- [ ] Error handling
- [ ] Loading states

**Integration**:
- [ ] End-to-end: captura → proceso → guardado
- [ ] Duplicados manejan correctamente
- [ ] Tier limits respetan
- [ ] Performance < 3s total

---

## Métricas y Monitoreo

### Logs

**Formato**: JSON structured logging

```json
{
  "time": "2025-01-23T10:30:45Z",
  "level": "INFO",
  "message": "OMR processing complete",
  "user_id": "uuid",
  "exam_id": "uuid",
  "duration_ms": 1250,
  "image_size_kb": 3200,
  "compressed_size_kb": 65
}
```

### Métricas Clave

- Request latency (p50, p95, p99)
- Success rate
- Error rate by type
- Image compression ratio
- JWT validation failures
- Bandwidth saved (vs legacy)

### Alertas

- Error rate > 5% (5min window)
- Latency p95 > 5s
- Service down
- Disk usage > 80%

---

## Seguridad

### Threat Model

**Amenazas**:
1. Token replay attack
2. JWT forjado
3. Path traversal en imágenes
4. DoS via large images
5. CORS misconfiguration

**Mitigaciones**:
1. JWT expiration (1h), rate limiting
2. Supabase secret validation
3. Path sanitization, temp files
4. Max file size (10MB)
5. Explicit CORS origins

### Best Practices

- ✅ JWT secret en env var (no hardcoded)
- ✅ HTTPS only en producción
- ✅ Rate limiting via nginx
- ✅ Input validation estricta
- ✅ Temp files cleanup
- ✅ Error messages sin leaks
- ✅ Logs sanitizados (no PII)

---

## Performance

### Expected Metrics

**Latency Breakdown**:
```
JWT validation:      10-20ms
Image upload:        200-500ms (depende de red)
OMR processing:      800-1500ms
Image compression:   200-400ms
Response:            50-100ms
─────────────────────────────
Total:               1.3-2.5s
```

**Compression Ratio**:
```
Original JPEG:       2-5MB
Compressed WebP:     40-80KB
Ratio:               ~50x reduction
```

**Bandwidth Savings** (vs legacy):
```
Legacy flow:
  Upload to Vercel:   3MB
  Vercel → OMR:       3MB
  OMR → Vercel:       3MB
  Vercel → Client:    3MB
  Total:              12MB

Direct flow:
  Client → OMR:       3MB
  OMR → Client:       120KB (2 images)
  Total:              3.12MB

Savings:             ~75% bandwidth reduction
```

---

## Migration Strategy

### Fase 1: Development (Semana 1-2)
- Crear `omr-service-direct/`
- Implementar API con JWT + compresión
- Unit tests
- Local testing

### Fase 2: Staging (Semana 3)
- Deploy a staging.profevision.com
- Integration testing
- Performance benchmarks
- Security audit

### Fase 3: Beta (Semana 4)
- Feature flag en producción
- 10% traffic a direct API
- Monitor metrics
- Bug fixes

### Fase 4: Rollout (Semana 5-6)
- Gradual increase: 25% → 50% → 100%
- Monitor error rates
- Comparar performance vs legacy

### Fase 5: Deprecation (Mes 2-3)
- Deprecation notice en legacy API
- Redirect legacy → direct
- Shutdown legacy después de 1 mes sin tráfico

---

## Rollback Plan

**Triggers**:
- Error rate > 10%
- Latency p95 > 10s
- Critical bug reported

**Actions**:
1. Feature flag → false (instant)
2. Revert nginx config
3. Investigate root cause
4. Fix and re-deploy

**Recovery Time**: < 5 minutos (feature flag flip)

---

## Referencias

- OMR Legacy: `omr-service/`
- Next.js compression: `app/api/exams/save-results/route.ts:21-103`
- Scan Wizard: `components/exam/scan-wizard.tsx`
- Supabase JWT: https://supabase.com/docs/guides/auth/jwts
- WebP compression: https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html#webp

---

**Última actualización**: 2025-01-23
**Autor**: Claude Code
**Status**: Planificación completa ✅
