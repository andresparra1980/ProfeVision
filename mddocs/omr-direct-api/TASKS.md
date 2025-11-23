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
- [x] Crear carpeta `omr-service-direct/` en root
- [x] Crear estructura de archivos:
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
- [x] Copiar `omr_standalone.py` (copiado directamente, no symlink)

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
- [x] Estructura de carpetas creada
- [x] Archivos base existen
- [x] omr_standalone.py copiado
- [x] Git tracking correcto

---

## Fase 2: API Core (FastAPI)

**Duración**: 3-4 horas
**Objetivo**: Implementar esqueleto de FastAPI con endpoints básicos

### Tasks

#### 2.1 Requirements
- [x] Crear `requirements.txt`:
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
- [x] Crear `omr_api_direct.py` con estructura base:
  - [x] Imports
  - [x] FastAPI app initialization
  - [x] CORS middleware
  - [x] Logging setup
  - [x] Config loading from env

#### 2.3 Endpoints Base
- [x] `GET /` - Service info
- [x] `GET /health` - Health check
  - Response: `{ status, service, version, uptime_seconds }`
- [x] `POST /process` - Completamente implementado con OMR processing

#### 2.4 Pydantic Models
- [x] `Answer` model
  ```python
  class Answer(BaseModel):
      number: int
      value: Optional[str]
      confidence: float
      num_options: int = 4
  ```
- [x] `OMRResult` model
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
- [x] `HealthResponse` model

#### 2.5 Request Logging Middleware
- [x] Middleware para log de requests
- [x] Log timing
- [x] Log status codes

### Validación
- [x] `uvicorn omr_api_direct:app --reload --port 8082` inicia
- [x] `GET /health` retorna 200
- [x] `GET /` retorna info
- [x] `POST /process` retorna 200 OK con resultados OMR
- [x] Logs muestran requests limpios (sin debug spam)

---

## Fase 3: JWT Validation

**Duración**: 2-3 horas
**Objetivo**: Implementar validación de JWT Supabase

### Tasks

#### 3.1 JWT Validation Function
- [x] Crear función `verify_supabase_jwt()`:
  - [x] Extract token de header `Authorization`
  - [x] Validate formato `Bearer <token>`
  - [x] Decode con PyJWT
  - [x] Validate signature con `SUPABASE_JWT_SECRET`
  - [x] Check algorithm HS256
  - [x] Check audience "authenticated"
  - [x] Return payload con user info

#### 3.2 Error Handling
- [x] HTTPException 401 para:
  - [x] Token missing
  - [x] Token invalid format
  - [x] Token expired
  - [x] Token invalid signature
  - [x] Wrong audience

#### 3.3 Dependency
- [x] Usar como dependency en `/process`:
  ```python
  async def process_omr(
      file: UploadFile,
      user: dict = Depends(verify_supabase_jwt)
  ):
  ```

#### 3.4 Logging
- [x] Log user_id en cada request
- [x] Log failed auth attempts
- [x] Sanitize logs (no token completo)

### Testing
- [x] Test con JWT válido
- [x] Test con JWT inválido
- [x] Test con JWT expirado
- [x] Test sin header
- [x] Test con formato incorrecto

### Validación
- [x] Auth funciona con JWT real de Supabase
- [x] Rechaza JWTs inválidos correctamente
- [x] Logs muestran user_id

---

## Fase 4: Compresión WebP

**Duración**: 2-3 horas
**Objetivo**: Implementar compresión de imágenes a WebP

### Tasks

#### 4.1 Compression Function
- [x] Crear función `compress_to_webp()`:
  - [x] Params: `image_path, quality=80, max_dimension=800`
  - [x] Abrir con Pillow
  - [x] Auto-rotate con `ImageOps.exif_transpose()`
  - [x] Resize si > max_dimension (fit inside)
  - [x] Convert a WebP con quality
  - [x] Return base64 data URL

#### 4.2 Testing Compression
- [x] Test con imagen JPEG grande (3.4MB)
- [x] Test con EXIF rotation
- [x] Verificar tamaño output < 100KB
- [x] Verificar quality acceptable

#### 4.3 Integration con OMR
- [x] Comprimir `temp_file_path` (original)
- [x] Comprimir `debug_image_path` (procesada)
- [x] Retornar ambas en OMRResult

#### 4.4 Error Handling
- [x] Manejo de imágenes corruptas
- [x] Fallback si Pillow falla
- [x] Cleanup temp files

### Validación
- [x] Compresión funciona correctamente
- [x] Tamaño reducido ~58x (3410KB → 58KB)
- [x] Quality visual acceptable
- [x] EXIF rotation funciona
- [x] No memory leaks

---

## Fase 5: Cliente (Scan Wizard)

**Duración**: 4-6 horas
**Objetivo**: Modificar scan wizard para usar API directa
**Status**: ✅ Completado

### Tasks

#### 5.1 Feature Flag
- [x] Agregar env vars en `.env.local`:
  ```env
  NEXT_PUBLIC_USE_DIRECT_OMR=true
  NEXT_PUBLIC_OMR_DIRECT_URL=http://localhost:8082
  ```
- [x] Crear hook `useOMREndpoint()`:
  - [x] Return legacy o direct URL según flag
  - [x] Fallback a legacy si direct falla
  - Archivo: `lib/hooks/useOMREndpoint.ts`

#### 5.2 JWT Extraction
- [x] Crear función `getSupabaseJWT()`:
  ```typescript
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
  ```
- [x] Error handling si no hay session
- Archivo: `lib/utils/jwt.ts`

#### 5.3 Direct POST Request
- [x] Modificar función de escaneo:
  - [x] Extract JWT
  - [x] FormData con image file (field: 'file')
  - [x] POST a OMR Direct URL
  - [x] Headers: `Authorization: Bearer <jwt>`
  - [x] Parse response y transformar a formato legacy
  - [x] Fallback automático a legacy si direct falla
  - Archivo: `components/exam/wizard-steps/processing.tsx`

#### 5.4 Fetch Respuestas Correctas
- [x] Ya implementado en `Results` component
- [x] Parsear `qr_data` → `exam_id`
- [x] Query a `/api/exams/${examId}/questions`
- [x] Query a `/api/opciones-respuesta/correct`
- [x] Cache respuestas en state
- Archivo: `components/exam/wizard-steps/results.tsx:162-299`

#### 5.5 Calcular Score Client-Side
- [x] Ya implementado en `Results` component
- [x] Función `calculateExamScore()`:
  - [x] Match detected answers vs correct answers
  - [x] Count correct responses (solo habilitadas)
  - [x] Calculate percentage
  - [x] Calculate puntaje obtenido
- Archivo: `components/exam/wizard-steps/results.tsx:162-299`

#### 5.6 Preview Component
- [x] Ya implementado en `Results` component
- [x] Mostrar processed_image (OMR form visual)
- [x] Mostrar score calculado
- [x] Lista de respuestas (detected vs correct con colores)
- [x] Botón confirmar (guardar)
- [x] Botón corregir manualmente (retomar foto)
- Archivo: `components/exam/wizard-steps/results.tsx`

#### 5.7 Guardar Resultados
- [x] Ya implementado en `handleSaveResults()`
- [x] Al confirmar, POST a `/api/exams/save-results`:
  - [x] Pasar imágenes comprimidas (base64 WebP)
  - [x] Pasar answers con `es_correcta`
  - [x] Pasar `exam_score`
  - [x] Pasar `qr_data`
- Archivo: `components/exam/wizard-steps/results.tsx:657-850`

#### 5.8 Error Handling
- [x] Network errors (en processing.tsx)
- [x] JWT missing/expired (throw error, usuario debe re-autenticar)
- [x] OMR processing errors (mostrar mensaje user-friendly)
- [x] Fallback a legacy API si direct falla
- [x] Show user-friendly messages (via toast y estado)

#### 5.9 Loading States
- [x] Ya implementados en ambos components
- [x] Uploading image (estado 'processing')
- [x] Processing OMR (spinner + overlay)
- [x] Fetching correct answers (examScore.loading)
- [x] Saving results (saving state + disabled button)

### Validación
- [x] Flow completo funciona (legacy API verificado)
- [x] JWT se extrae correctamente
- [x] POST directo implementado con fallback
- [x] Preview muestra resultados correctamente
- [x] Guardar persiste a DB (ya existente)
- [x] Error handling robusto implementado
- [x] TypeScript types completamente definidos (OMRDirectResponse, OMRLegacyResponse)
- [x] Code compila sin errores TypeScript
- [x] Documentación deployment en Vercel creada
- [ ] **Testing E2E con Direct API** (pendiente - deployment en Hetzner)

---

## Fase 6: Testing Local

**Duración**: 2-3 horas
**Objetivo**: Testing exhaustivo local

### Tasks

#### 6.1 Unit Tests (Python)
- [x] Test `compress_to_webp()`:
  - [x] Large images (3.4MB)
  - [x] EXIF rotation
- [x] Test `verify_supabase_jwt()`:
  - [x] Valid token
  - [x] Invalid token
  - [x] Expired token
  - [x] Missing token

#### 6.2 Integration Tests (Python)
- [x] Test `/process` endpoint:
  - [x] Happy path (17/17 preguntas detectadas)
  - [x] Missing auth (401)
  - [x] Invalid auth (401)
  - [x] Large file (3.4MB procesado exitosamente)
  - [x] QR detection (exitoso)
  - [x] OMR processing (exitoso)

#### 6.3 E2E Tests (Cliente)
- [ ] Captura foto (pendiente - Fase 5)
- [ ] Escaneo completo (pendiente - Fase 5)
- [ ] Preview resultados (pendiente - Fase 5)
- [ ] Guardar a DB (pendiente - Fase 5)
- [ ] Error scenarios (pendiente - Fase 5)

#### 6.4 Performance Tests
- [x] Latency: 1.34s (excelente)
- [x] Memory usage: < 1GB
- [x] Compression ratio: ~58x
- [ ] Concurrent requests (pendiente)

### Test Data
- [x] Imagen de prueba real:
  - [x] Examen bien escaneado (scan_6eabdac2...)
  - [x] QR detectado correctamente

### Validación
- [x] Tests API pasan exitosamente
- [x] Performance excelente (1.34s)
- [x] Logs limpios (sin debug spam)
- [x] Error handling JWT robusto

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
| 1. Setup | 8 | 8 | ✅ 100% |
| 2. API Core | 14 | 14 | ✅ 100% |
| 3. JWT | 13 | 13 | ✅ 100% |
| 4. Compresión | 9 | 9 | ✅ 100% |
| 5. Cliente | 25 | 24 | ✅ 96% |
| 6. Testing | 14 | 11 | 79% |
| 7. Deployment | 18 | 0 | 0% ← **SIGUIENTE** |
| 8. Integration | 13 | 0 | 0% |
| 9. Rollout | 11 | 0 | 0% |
| 10. Deprecation | 8 | 0 | 0% |
| **TOTAL** | **133** | **79** | **59%** |

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

**Última actualización**: 2025-11-23
**Progress**: 59% (79/133 tasks)
**Next**: Fase 7 - Deployment a Hetzner
**Status**: Backend API + Cliente completamente funcional ✅
**Archivos modificados**:
- `.env.local` - Variables de entorno
- `lib/hooks/useOMREndpoint.ts` - Hook selector de endpoint
- `lib/utils/jwt.ts` - Extracción JWT Supabase
- `components/exam/types.ts` - Tipos OMRDirectResponse, OMRLegacyResponse
- `components/exam/wizard-steps/processing.tsx` - Integración Direct API + fallback
- `mddocs/omr-direct-api/VERCEL_DEPLOYMENT.md` - Guía deployment Vercel
- `mddocs/omr-direct-api/TASKS.md` - Este archivo

**Pending**: Deployment en Hetzner + testing E2E en preview Vercel
