# OMR Direct API - Tasks por Fases

**Branch**: `feature/omr-direct-api`
**Status**: Planificación
**Inicio**: 2025-01-23

---

## Índice de Fases

- [Fase 1: Setup y Estructura](#fase-1-setup-y-estructura)
- [Fase 2: API Core (FastAPI)](#fase-2-api-core-fastapi)
- [Fase 3: JWT Validation](#fase-3-jwt-validation)
- [Fase 4: Compresión WebP](#fase-4-compresión-webp)
- [Fase 5: Cliente (Scan Wizard)](#fase-5-cliente-scan-wizard)
- [Fase 6: Testing Local](#fase-6-testing-local)
- [Fase 7: Deployment](#fase-7-deployment)
- [Fase 8: Integration Testing](#fase-8-integration-testing)
- [Fase 9: Rollout](#fase-9-rollout)
- [Fase 10: Deprecation Legacy](#fase-10-deprecation-legacy)

---

## Fase 1: Setup y Estructura

**Duración**: 1-2 horas
**Objetivo**: Crear estructura base del proyecto

### Tasks

- [x] Crear branch `feature/omr-direct-api`
- [x] Crear carpeta `mddocs/omr-direct-api/`
- [x] Crear `PLAN.md`
- [x] Crear `TASKS.md`
- [ ] Crear carpeta `omr-service-direct/` en root
- [ ] Crear estructura de archivos:
  ```
  omr-service-direct/
  ├── omr_api_direct.py
  ├── requirements.txt
  ├── Dockerfile
  ├── docker-compose.yml
  ├── .env.example
  ├── .gitignore
  └── README.md
  ```
- [ ] Crear symlink a `omr_standalone.py`:
  ```bash
  cd omr-service-direct
  ln -s ../omr-service/omr_standalone.py .
  ```

### Archivos a Crear

**`omr-service-direct/.gitignore`**:
```
__pycache__/
*.pyc
.env
logs/
temp/
*.log
venv/
.pytest_cache/
```

**`omr-service-direct/.env.example`**:
```env
PORT=8082
HOST=0.0.0.0

# Supabase JWT
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_JWT_SECRET=your_jwt_secret_here

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://profevision.com

# Image processing
MAX_IMAGE_SIZE_MB=10
IMAGE_QUALITY=80
MAX_IMAGE_DIMENSION=800

# Logging
LOG_LEVEL=info
```

### Validación
- [ ] Estructura de carpetas creada
- [ ] Archivos base existen
- [ ] Symlink funciona
- [ ] Git tracking correcto

---

## Fase 2: API Core (FastAPI)

**Duración**: 3-4 horas
**Objetivo**: Implementar esqueleto de FastAPI con endpoints básicos

### Tasks

#### 2.1 Requirements
- [ ] Crear `requirements.txt`:
  ```txt
  fastapi==0.100.0
  uvicorn[standard]==0.23.0
  python-multipart==0.0.6
  pydantic==2.0.0
  pyjwt==2.8.0
  pillow==10.0.0
  opencv-python-headless==4.8.0
  pyzbar==0.1.9
  numpy==1.24.0
  ```

#### 2.2 API Skeleton
- [ ] Crear `omr_api_direct.py` con estructura base:
  - [ ] Imports
  - [ ] FastAPI app initialization
  - [ ] CORS middleware
  - [ ] Logging setup
  - [ ] Config loading from env

#### 2.3 Endpoints Base
- [ ] `GET /` - Service info
- [ ] `GET /health` - Health check
  - Response: `{ status, service, version, uptime_seconds }`
- [ ] `POST /process` - Skeleton (sin implementar)
  - Accept file upload
  - Return 501 Not Implemented

#### 2.4 Pydantic Models
- [ ] `Answer` model
  ```python
  class Answer(BaseModel):
      number: int
      value: Optional[str]
      confidence: float
      num_options: int = 4
  ```
- [ ] `OMRResult` model
  ```python
  class OMRResult(BaseModel):
      success: bool
      qr_data: Optional[str]
      total_questions: int
      answered_questions: int
      answers: List[Answer]
      original_image: Optional[str]
      processed_image: Optional[str]
      error: Optional[str]
      error_code: Optional[str]
  ```
- [ ] `HealthResponse` model

#### 2.5 Request Logging Middleware
- [ ] Middleware para log de requests
- [ ] Log timing
- [ ] Log status codes

### Validación
- [ ] `uvicorn omr_api_direct:app --reload --port 8082` inicia
- [ ] `GET /health` retorna 200
- [ ] `GET /` retorna info
- [ ] `POST /process` retorna 501
- [ ] Logs muestran requests

---

## Fase 3: JWT Validation

**Duración**: 2-3 horas
**Objetivo**: Implementar validación de JWT Supabase

### Tasks

#### 3.1 JWT Validation Function
- [ ] Crear función `verify_supabase_jwt()`:
  - [ ] Extract token de header `Authorization`
  - [ ] Validate formato `Bearer <token>`
  - [ ] Decode con PyJWT
  - [ ] Validate signature con `SUPABASE_JWT_SECRET`
  - [ ] Check algorithm HS256
  - [ ] Check audience "authenticated"
  - [ ] Return payload con user info

#### 3.2 Error Handling
- [ ] HTTPException 401 para:
  - [ ] Token missing
  - [ ] Token invalid format
  - [ ] Token expired
  - [ ] Token invalid signature
  - [ ] Wrong audience

#### 3.3 Dependency
- [ ] Usar como dependency en `/process`:
  ```python
  async def process_omr(
      file: UploadFile,
      user: dict = Depends(verify_supabase_jwt)
  ):
  ```

#### 3.4 Logging
- [ ] Log user_id en cada request
- [ ] Log failed auth attempts
- [ ] Sanitize logs (no token completo)

### Testing
- [ ] Test con JWT válido
- [ ] Test con JWT inválido
- [ ] Test con JWT expirado
- [ ] Test sin header
- [ ] Test con formato incorrecto

### Validación
- [ ] Auth funciona con JWT real de Supabase
- [ ] Rechaza JWTs inválidos correctamente
- [ ] Logs muestran user_id

---

## Fase 4: Compresión WebP

**Duración**: 2-3 horas
**Objetivo**: Implementar compresión de imágenes a WebP

### Tasks

#### 4.1 Compression Function
- [ ] Crear función `compress_to_webp()`:
  - [ ] Params: `image_path, quality=80, max_dimension=800`
  - [ ] Abrir con Pillow
  - [ ] Auto-rotate con `ImageOps.exif_transpose()`
  - [ ] Resize si > max_dimension (fit inside)
  - [ ] Convert a WebP con quality
  - [ ] Return base64 data URL

#### 4.2 Testing Compression
- [ ] Test con imagen JPEG grande (5MB)
- [ ] Test con imagen PNG
- [ ] Test con EXIF rotation
- [ ] Verificar tamaño output < 100KB
- [ ] Verificar quality acceptable

#### 4.3 Integration con OMR
- [ ] Comprimir `temp_file_path` (original)
- [ ] Comprimir `debug_image_path` (procesada)
- [ ] Retornar ambas en OMRResult

#### 4.4 Error Handling
- [ ] Manejo de imágenes corruptas
- [ ] Fallback si Pillow falla
- [ ] Cleanup temp files

### Validación
- [ ] Compresión funciona correctamente
- [ ] Tamaño reducido ~50x
- [ ] Quality visual acceptable
- [ ] EXIF rotation funciona
- [ ] No memory leaks

---

## Fase 5: Cliente (Scan Wizard)

**Duración**: 4-6 horas
**Objetivo**: Modificar scan wizard para usar API directa

### Tasks

#### 5.1 Feature Flag
- [ ] Agregar env vars en `.env.local`:
  ```env
  NEXT_PUBLIC_USE_DIRECT_OMR=true
  NEXT_PUBLIC_OMR_DIRECT_URL=http://localhost:8082
  ```
- [ ] Crear hook `useOMREndpoint()`:
  - [ ] Return legacy o direct URL según flag
  - [ ] Fallback a legacy si direct falla

#### 5.2 JWT Extraction
- [ ] Crear función `getSupabaseJWT()`:
  ```typescript
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
  ```
- [ ] Error handling si no hay session

#### 5.3 Direct POST Request
- [ ] Modificar función de escaneo:
  - [ ] Extract JWT
  - [ ] FormData con image file
  - [ ] POST a OMR Direct URL
  - [ ] Headers: `Authorization: Bearer <jwt>`
  - [ ] Parse response

#### 5.4 Fetch Respuestas Correctas
- [ ] Parsear `qr_data` → `exam_id`
- [ ] Query Supabase:
  ```typescript
  const { data: exam } = await supabase
    .from('examenes')
    .select('preguntas(numero, respuesta_correcta)')
    .eq('id', examId)
    .single();
  ```
- [ ] Cache respuestas en state

#### 5.5 Calcular Score Client-Side
- [ ] Función `calculateScore()`:
  - [ ] Match detected answers vs correct answers
  - [ ] Count correct responses
  - [ ] Calculate percentage
  - [ ] Calculate grade (0-5)

#### 5.6 Preview Component
- [ ] Mostrar processed_image
- [ ] Mostrar score calculado
- [ ] Lista de respuestas (detected vs correct)
- [ ] Botón confirmar
- [ ] Botón corregir manualmente

#### 5.7 Guardar Resultados
- [ ] Al confirmar, POST a `/api/exams/save-results`:
  - [ ] Pasar imágenes comprimidas (base64)
  - [ ] Pasar answers con `es_correcta`
  - [ ] Pasar `exam_score`
  - [ ] Pasar `qr_data`

#### 5.8 Error Handling
- [ ] Network errors
- [ ] JWT expired (redirect to login)
- [ ] OMR processing errors
- [ ] Show user-friendly messages

#### 5.9 Loading States
- [ ] Uploading image
- [ ] Processing OMR
- [ ] Fetching correct answers
- [ ] Saving results

### Validación
- [ ] Flow completo funciona
- [ ] JWT se extrae correctamente
- [ ] POST directo funciona
- [ ] Preview muestra resultados
- [ ] Guardar persiste a DB
- [ ] Error handling funciona

---

## Fase 6: Testing Local

**Duración**: 2-3 horas
**Objetivo**: Testing exhaustivo local

### Tasks

#### 6.1 Unit Tests (Python)
- [ ] Test `compress_to_webp()`:
  - [ ] Various image formats
  - [ ] Large images
  - [ ] EXIF rotation
  - [ ] Corrupted images
- [ ] Test `verify_supabase_jwt()`:
  - [ ] Valid token
  - [ ] Invalid token
  - [ ] Expired token
  - [ ] Missing token

#### 6.2 Integration Tests (Python)
- [ ] Test `/process` endpoint:
  - [ ] Happy path
  - [ ] Missing auth
  - [ ] Invalid auth
  - [ ] Large file
  - [ ] Invalid file type
  - [ ] QR detection failure
  - [ ] OMR processing failure

#### 6.3 E2E Tests (Cliente)
- [ ] Captura foto
- [ ] Escaneo completo
- [ ] Preview resultados
- [ ] Guardar a DB
- [ ] Error scenarios

#### 6.4 Performance Tests
- [ ] Latency bajo carga
- [ ] Memory usage
- [ ] Compression ratio
- [ ] Concurrent requests

### Test Data
- [ ] Crear imágenes de prueba:
  - [ ] Examen bien escaneado
  - [ ] Examen rotado
  - [ ] Examen mal iluminado
  - [ ] Sin QR
  - [ ] QR dañado

### Validación
- [ ] Todos los tests pasan
- [ ] Performance acceptable
- [ ] No memory leaks
- [ ] Error handling robusto

---

## Fase 7: Deployment

**Duración**: 3-4 horas
**Objetivo**: Deploy a servidor Hetzner

### Tasks

#### 7.1 Docker
- [ ] Crear `Dockerfile`:
  ```dockerfile
  FROM python:3.11-slim

  WORKDIR /app

  # System dependencies
  RUN apt-get update && apt-get install -y \
      libgl1-mesa-glx \
      libglib2.0-0 \
      libzbar0 \
      && rm -rf /var/lib/apt/lists/*

  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt

  COPY . .

  EXPOSE 8082
  CMD ["uvicorn", "omr_api_direct:app", "--host", "0.0.0.0", "--port", "8082"]
  ```

- [ ] Crear `docker-compose.yml`:
  ```yaml
  version: '3.8'
  services:
    omr-direct:
      build: .
      container_name: profevision-omr-direct
      ports:
        - "8082:8082"
      env_file:
        - .env
      volumes:
        - ./logs:/app/logs
      restart: unless-stopped
      deploy:
        resources:
          limits:
            memory: 1G
            cpus: '1.0'
  ```

#### 7.2 Server Setup
- [ ] SSH a servidor Hetzner
- [ ] Clonar repo (o pull changes)
- [ ] Crear `.env` con valores reales
- [ ] Docker compose build
- [ ] Docker compose up -d

#### 7.3 Nginx Config
- [ ] Crear `/etc/nginx/sites-available/omr-direct`:
  ```nginx
  server {
      listen 80;
      server_name omr-direct.profevision.com;

      location / {
          proxy_pass http://localhost:8082;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          client_max_body_size 10M;
      }
  }
  ```
- [ ] Symlink a sites-enabled
- [ ] Nginx test config
- [ ] Nginx reload

#### 7.4 SSL (Certbot)
- [ ] `certbot --nginx -d omr-direct.profevision.com`
- [ ] Verificar auto-renewal

#### 7.5 DNS
- [ ] Agregar A record:
  - Name: `omr-direct`
  - Type: A
  - Value: IP servidor Hetzner

#### 7.6 Monitoring
- [ ] Verificar logs: `docker compose logs -f`
- [ ] Test health: `curl https://omr-direct.profevision.com/health`
- [ ] Setup log rotation

### Validación
- [ ] API responde desde domain
- [ ] HTTPS funciona
- [ ] Health check OK
- [ ] Logs escriben correctamente
- [ ] Container auto-restart funciona

---

## Fase 8: Integration Testing

**Duración**: 2-3 horas
**Objetivo**: Testing en staging/producción

### Tasks

#### 8.1 Staging Testing
- [ ] Actualizar `.env.local`:
  ```env
  NEXT_PUBLIC_OMR_DIRECT_URL=https://omr-direct.profevision.com
  ```
- [ ] Deploy frontend a staging
- [ ] E2E tests desde staging

#### 8.2 Test Cases
- [ ] Escaneo de examen real
- [ ] Múltiples usuarios simultáneos
- [ ] Diferentes dispositivos
- [ ] Diferentes navegadores
- [ ] Network throttling
- [ ] JWT expiration scenarios

#### 8.3 Performance Monitoring
- [ ] Setup monitoring dashboard
- [ ] Track latency
- [ ] Track error rate
- [ ] Track compression ratio
- [ ] Track bandwidth usage

#### 8.4 Security Audit
- [ ] CORS headers correctos
- [ ] JWT validation robusta
- [ ] No information disclosure
- [ ] Rate limiting test
- [ ] Max file size enforcement

### Validación
- [ ] Todos los test cases pasan
- [ ] Performance dentro de specs
- [ ] No security issues
- [ ] Logs correctos

---

## Fase 9: Rollout

**Duración**: 2-3 semanas (gradual)
**Objetivo**: Rollout gradual a producción

### Tasks

#### 9.1 Week 1: 10% Traffic
- [ ] Feature flag: 10% usuarios
- [ ] Monitor closely:
  - [ ] Error rate
  - [ ] Latency
  - [ ] User feedback
  - [ ] Bandwidth savings
- [ ] Fix critical bugs si aparecen

#### 9.2 Week 2: 25% Traffic
- [ ] Feature flag: 25%
- [ ] Continue monitoring
- [ ] Performance optimization si necesario

#### 9.3 Week 2-3: 50% Traffic
- [ ] Feature flag: 50%
- [ ] Compare metrics vs legacy
- [ ] Document improvements

#### 9.4 Week 3: 100% Traffic
- [ ] Feature flag: 100%
- [ ] All users en direct API
- [ ] Legacy API solo como fallback

### Rollback Plan
- [ ] Documentar rollback procedure
- [ ] Feature flag flip script
- [ ] Monitoring alerts setup
- [ ] On-call rotation

### Validación
- [ ] Rollout sin incidentes mayores
- [ ] Metrics mejoran vs legacy
- [ ] User feedback positivo
- [ ] Bandwidth savings confirmados

---

## Fase 10: Deprecation Legacy

**Duración**: 1-2 meses post-rollout
**Objetivo**: Deprecar API legacy

### Tasks

#### 10.1 Month 1: Deprecation Notice
- [ ] Agregar header a legacy API:
  ```
  X-Deprecation-Warning: This API is deprecated. Use omr-direct.profevision.com
  ```
- [ ] Log usage de legacy API
- [ ] Identify stragglers

#### 10.2 Month 2: Redirect
- [ ] Si legacy usage < 1%:
  - [ ] Redirect legacy → direct
  - [ ] Monitor errors
  - [ ] Fix breaking changes si hay

#### 10.3 Month 3: Shutdown
- [ ] Si 0 usage por 2 semanas:
  - [ ] Stop legacy container
  - [ ] Archive code
  - [ ] Update docs
  - [ ] Remove nginx config
  - [ ] Remove DNS entry

### Documentation
- [ ] Update README
- [ ] Update CLAUDE.md
- [ ] Update deployment docs
- [ ] Migration guide para devs externos

### Validación
- [ ] Legacy API completamente deprecado
- [ ] Código archivado
- [ ] Docs actualizados
- [ ] Team awareness

---

## Resumen de Estados

### Status Legend
- `[ ]` - Pendiente
- `[x]` - Completado
- `[~]` - En progreso
- `[!]` - Bloqueado

### Progress Tracking

| Fase | Tasks | Completadas | Progreso |
|------|-------|-------------|----------|
| 1. Setup | 8 | 4 | 50% |
| 2. API Core | 14 | 0 | 0% |
| 3. JWT | 13 | 0 | 0% |
| 4. Compresión | 9 | 0 | 0% |
| 5. Cliente | 22 | 0 | 0% |
| 6. Testing | 14 | 0 | 0% |
| 7. Deployment | 18 | 0 | 0% |
| 8. Integration | 13 | 0 | 0% |
| 9. Rollout | 11 | 0 | 0% |
| 10. Deprecation | 8 | 0 | 0% |
| **TOTAL** | **130** | **4** | **3%** |

---

## Notas

### Dependencies Críticas
- Fase 3 depende de Fase 2
- Fase 4 depende de Fase 2
- Fase 5 depende de Fases 3 y 4
- Fase 7 depende de Fases 2-4
- Fase 8 depende de Fases 5 y 7

### Paralelización
- Fases 3 y 4 pueden hacerse en paralelo
- Fase 5 puede empezar mientras se completan 3 y 4 (usar mocks)

### Riesgos
- JWT secret exposure
- Performance degradation
- Breaking changes en cliente
- Rollback complexity

### Mitigaciones
- Env vars correctamente configuradas
- Extensive testing antes de rollout
- Feature flags para control granular
- Rollback plan documentado

---

**Última actualización**: 2025-01-23
**Progress**: 3% (4/130 tasks)
**Next**: Fase 1 - Setup y Estructura
