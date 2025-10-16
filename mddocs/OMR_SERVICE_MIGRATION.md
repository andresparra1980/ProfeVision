# Plan de Migración del Servicio OMR - ProfeVision

**Versión**: 1.0.0
**Fecha**: 15 de octubre de 2025
**Autor**: Equipo ProfeVision
**Estado**: Planificación

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de Arquitectura Actual](#análisis-de-arquitectura-actual)
3. [Arquitectura Objetivo](#arquitectura-objetivo)
4. [Decisión de Tecnología](#decisión-de-tecnología)
5. [Fases de Implementación](#fases-de-implementación)
6. [Especificaciones Técnicas](#especificaciones-técnicas)
7. [Estrategia de Migración](#estrategia-de-migración)
8. [Análisis de Costos](#análisis-de-costos)
9. [Testing y Validación](#testing-y-validación)
10. [Guía de Deployment](#guía-de-deployment)
11. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
12. [Checklist de Migración](#checklist-de-migración)

---

## Resumen Ejecutivo

### Problema Actual

ProfeVision actualmente utiliza un **script Python** (`scripts/omr/omr_standalone.py`) para procesar exámenes escaneados mediante OMR (Optical Mark Recognition). Este script es invocado directamente desde una API route de Next.js (`app/api/exams/process-scan/route.ts`) usando `child_process.exec`.

**Limitaciones críticas:**

1. **No es compatible con deployments serverless** (Vercel, Netlify)
2. **Requiere Python runtime + OpenCV + pyzbar** en el servidor Node.js
3. **Overhead de spawning procesos** en cada request
4. **Difícil de escalar horizontalmente**
5. **Complejidad operacional** (2 runtimes en un servidor)

### Solución Propuesta

Migrar el procesamiento OMR a un **microservicio independiente** basado en FastAPI, permitiendo:

- ✅ Next.js en Vercel (serverless)
- ✅ Servicio OMR en Railway/Render (contenedor Docker)
- ✅ Escalabilidad independiente
- ✅ Separación de responsabilidades
- ✅ Mejor observabilidad

### Resultado Esperado

```
┌─────────────────────────────────────┐
│  Next.js (Vercel Serverless)        │
│  - UI/UX                             │
│  - Business Logic                    │
│  - Database (Supabase)               │
└──────────────┬──────────────────────┘
               │ HTTP POST
               ↓
┌─────────────────────────────────────┐
│  OMR Service (Railway/Render)       │
│  - FastAPI                           │
│  - Python + OpenCV                   │
│  - Image Processing                  │
└─────────────────────────────────────┘
```

---

## Análisis de Arquitectura Actual

### Estado Actual del Código

**Ubicación**: `app/api/exams/process-scan/route.ts`

**Flujo actual:**

```typescript
1. Next.js API route recibe imagen (FormData)
2. Guarda imagen en `/public/uploads/omr/`
3. Ejecuta: `python scripts/omr/omr_standalone.py <image_path>`
4. Lee stdout JSON
5. Busca imagen procesada: `<filename>questions_detected.jpeg`
6. Retorna URLs públicas + resultados JSON
```

**Dependencias Python** (`scripts/omr/omr_standalone.py`):

```python
- opencv-python (cv2)          # ~150MB, procesamiento de imágenes
- pyzbar                        # Decodificación de QR codes
- numpy                         # Arrays numéricos
- Sistema: libgl1, libglib2.0, libzbar0
```

### Problemas Identificados

#### 1. Deployment Bloqueado

```bash
# ❌ NO funciona en Vercel
Error: spawn python ENOENT
# Vercel no tiene Python runtime ni dependencias del sistema

# ❌ Configuración compleja en servidores tradicionales
- Instalar Node.js + Python
- Configurar venv
- Instalar dependencias del sistema (libzbar, opencv)
- Gestionar dos procesos
```

#### 2. Performance

```typescript
// Cada request:
const { stdout } = await execPromise(command); // Spawn nuevo proceso Python
// ~500ms overhead solo en spawn + import OpenCV
```

#### 3. Escalabilidad

- No se puede usar auto-scaling de Vercel
- Difícil balanceo de carga (2 runtimes)
- No se puede escalar solo el componente intensivo (OMR)

#### 4. Operacional

- Logs fragmentados (Node.js logs + Python logs)
- Debugging complejo
- No hay health checks del componente Python
- Difícil monitorear uso de recursos por componente

### Fortalezas del Código Actual

✅ **Script Python robusto** (~1800 líneas)
- Múltiples estrategias de detección
- Manejo de formularios dañados
- Reconstrucción de burbujas faltantes
- Debug exhaustivo

✅ **Bien probado en producción**
- Funciona con diferentes calidades de imagen
- Maneja edge cases

---

## Arquitectura Objetivo

### Diseño de Microservicios

```
┌─────────────────────────────────────────────────────────────────┐
│                     USUARIO (Profesor)                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│             Next.js App (Vercel Serverless)                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ /api/exams/process-scan                                  │  │
│  │ 1. Valida imagen                                          │  │
│  │ 2. POST a OMR Service                                     │  │
│  │ 3. Recibe resultado + imagen procesada                    │  │
│  │ 4. Guarda en Supabase Storage (opcional)                  │  │
│  │ 5. Retorna a cliente                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ HTTP POST /process
                       │ Content-Type: multipart/form-data
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│             OMR Processing Service (Railway/Render)             │
│                        Docker Container                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ FastAPI Application                                       │  │
│  │                                                            │  │
│  │ POST /process                                              │  │
│  │ - Recibe archivo imagen (multipart)                       │  │
│  │ - Invoca omr_standalone.py                                │  │
│  │ - Retorna JSON + imagen base64                            │  │
│  │                                                            │  │
│  │ GET /health                                                │  │
│  │ - Health check para orchestration                         │  │
│  │                                                            │  │
│  │ GET /docs (Swagger UI)                                     │  │
│  │ - Documentación automática                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│            ↓                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ omr_standalone.py (código existente)                      │  │
│  │ - StandaloneOMRProcessor                                  │  │
│  │ - OpenCV processing                                        │  │
│  │ - QR detection                                             │  │
│  │ - Bubble detection                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Ventajas de la Arquitectura

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Deployment** | Servidor único VPS | Next.js (Vercel) + OMR (Railway) |
| **Escalabilidad** | Vertical (más RAM/CPU) | Horizontal (auto-scaling independiente) |
| **Costos** | $30-50/mes (servidor grande) | $5-15/mes (optimizado por servicio) |
| **Performance** | ~1s (spawn overhead) | ~500ms (proceso persistente) |
| **Mantenimiento** | Complejo (2 runtimes) | Simple (servicios separados) |
| **Monitoreo** | Logs mezclados | Métricas por servicio |

---

## Decisión de Tecnología

### ¿Por qué FastAPI?

Comparación de opciones:

| Framework | Pros | Contras | Puntuación |
|-----------|------|---------|------------|
| **FastAPI** | Async, auto-docs, Pydantic, moderno | Más nuevo que Flask | ⭐⭐⭐⭐⭐ |
| Flask | Simple, comunidad grande | No async, sin validación built-in | ⭐⭐⭐⭐ |
| gRPC | Muy rápido, streaming | Complejo, cliente especial | ⭐⭐⭐ |
| AWS Lambda | Serverless, auto-scaling | Cold starts, complejidad | ⭐⭐⭐ |

**Decisión: FastAPI**

**Razones:**

1. **Performance**: Comparable a Node.js (async/await nativo)
2. **Developer Experience**:
   - Auto-generación de OpenAPI docs
   - Validación automática con Pydantic
   - Type hints (similar a TypeScript)
3. **Production Ready**: Usado por Microsoft, Uber, Netflix
4. **Ecosistema**: Compatible con todas las librerías Python existentes
5. **Docker-friendly**: Fácil containerización

### Stack Tecnológico Final

```yaml
Next.js App:
  - Runtime: Node.js 20
  - Framework: Next.js 15.2.3
  - Deploy: Vercel (serverless)
  - Storage: Supabase Storage (imágenes)

OMR Service:
  - Runtime: Python 3.11
  - Framework: FastAPI 0.109.0
  - Server: Uvicorn (ASGI)
  - Container: Docker
  - Deploy: Railway / Render
  - Dependencies:
    - opencv-python-headless
    - pyzbar
    - numpy
    - fastapi
    - uvicorn
```

---

## Fases de Implementación

### Fase 1: Preparación del Servicio OMR (Semana 1)

**Objetivo**: Crear la API FastAPI wrapper del script existente

**Tareas:**

- [ ] Crear directorio `omr-service/` en root del proyecto
- [ ] Escribir `omr-service/omr_api.py` (FastAPI app)
- [ ] Copiar `scripts/omr/omr_standalone.py` a `omr-service/`
- [ ] Crear `omr-service/requirements.txt`
- [ ] Crear `omr-service/Dockerfile`
- [ ] Crear `omr-service/.env.example`
- [ ] Documentar API en `omr-service/README.md`

**Estructura esperada:**

```
omr-service/
├── omr_api.py                 # FastAPI application
├── omr_standalone.py          # Código existente (copiado)
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Container definition
├── .dockerignore              # Excluir archivos innecesarios
├── .env.example               # Variables de entorno
├── README.md                  # Documentación del servicio
└── tests/
    └── test_omr_api.py        # Tests básicos
```

**Entregables:**

- ✅ Servicio FastAPI funcional en local (puerto 8000)
- ✅ Endpoint `/process` que acepta imagen y retorna JSON
- ✅ Endpoint `/health` para health checks
- ✅ Swagger docs en `/docs`
- ✅ Docker image que construye exitosamente

---

### Fase 2: Testing Local (Semana 1-2)

**Objetivo**: Validar que el servicio funciona correctamente

**Tareas:**

- [ ] Crear script de testing (`omr-service/test_local.sh`)
- [ ] Probar con 10+ imágenes de ejemplo
- [ ] Validar que resultados coinciden con versión actual
- [ ] Medir performance (tiempo de procesamiento)
- [ ] Documentar casos edge

**Criterios de Validación:**

```bash
# 1. Health check responde
curl http://localhost:8000/health
# Esperado: {"status": "healthy"}

# 2. Procesar imagen
curl -X POST http://localhost:8000/process \
  -F "file=@test_images/exam_001.jpg" \
  -o result.json

# 3. Verificar estructura JSON
jq . result.json
# Esperado: success=true, answers array, processed_image base64

# 4. Performance
# Esperado: < 1s para imágenes típicas
```

**Entregables:**

- ✅ 100% de imágenes de test procesadas correctamente
- ✅ Performance comparable o mejor a versión actual
- ✅ Logs claros y útiles
- ✅ Manejo de errores robusto

---

### Fase 3: Adaptación Next.js API Route (Semana 2)

**Objetivo**: Modificar `/api/exams/process-scan` para usar el servicio externo

**Tareas:**

- [ ] Crear `lib/services/omr-client.ts` (cliente HTTP)
- [ ] Actualizar `app/api/exams/process-scan/route.ts`
- [ ] Agregar variables de entorno `OMR_SERVICE_URL`
- [ ] Implementar retry logic
- [ ] Agregar timeout handling
- [ ] Mantener backward compatibility (feature flag)

**Código ejemplo:**

```typescript
// lib/services/omr-client.ts
export async function processOMR(imageFile: File): Promise<OMRResult> {
  const formData = new FormData();
  formData.append('file', imageFile);

  const response = await fetch(`${process.env.OMR_SERVICE_URL}/process`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(30000), // 30s timeout
  });

  if (!response.ok) {
    throw new Error(`OMR service error: ${response.status}`);
  }

  return response.json();
}
```

**Entregables:**

- ✅ API route actualizada y funcional
- ✅ Feature flag para A/B testing
- ✅ Error handling robusto
- ✅ Logging mejorado

---

### Fase 4: Deployment del Servicio OMR (Semana 2-3)

**Objetivo**: Desplegar el servicio OMR en Railway/Render

**Opciones de Deployment:**

| Plataforma | Costo/mes | Pros | Contras | Recomendado |
|------------|-----------|------|---------|-------------|
| **Railway** | $5-10 | Fácil, auto-deploy, logs | Créditos limitados free tier | ⭐⭐⭐⭐⭐ |
| **Render** | $7-15 | Free tier, simple | Cold starts en free | ⭐⭐⭐⭐ |
| **Fly.io** | $3-8 | Edge, Docker native | Más complejo | ⭐⭐⭐⭐ |
| **DigitalOcean** | $5-12 | Predecible, simple | Setup manual | ⭐⭐⭐ |

**Decisión: Railway (Recomendado)**

**Pasos para Railway:**

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Crear proyecto
cd omr-service
railway init

# 4. Deploy
railway up

# 5. Obtener URL pública
railway domain
# Output: https://omr-service-production-xxxx.up.railway.app
```

**Configuración:**

- [ ] Configurar variables de entorno en Railway dashboard
- [ ] Configurar health checks
- [ ] Configurar auto-deploy desde Git
- [ ] Configurar custom domain (opcional)
- [ ] Configurar alertas de uptime

**Entregables:**

- ✅ Servicio OMR desplegado y accesible públicamente
- ✅ URL configurada en Next.js (`OMR_SERVICE_URL`)
- ✅ Health checks funcionando
- ✅ Logs accesibles

---

### Fase 5: Migración Gradual (Semana 3-4)

**Objetivo**: Migrar tráfico gradualmente al nuevo servicio

**Estrategia de Canary Deployment:**

```typescript
// app/api/exams/process-scan/route.ts
const USE_NEW_SERVICE = process.env.OMR_USE_NEW_SERVICE === 'true';
const CANARY_PERCENTAGE = parseInt(process.env.OMR_CANARY_PERCENTAGE || '0');

export async function POST(request: NextRequest) {
  // Feature flag + probabilistic routing
  const useNewService = USE_NEW_SERVICE ||
                        (Math.random() * 100 < CANARY_PERCENTAGE);

  if (useNewService) {
    return processWithNewService(request);
  } else {
    return processWithLegacyPython(request);
  }
}
```

**Fases de rollout:**

1. **Semana 3 (Días 1-2)**: 10% de tráfico → nuevo servicio
2. **Semana 3 (Días 3-4)**: 25% de tráfico → nuevo servicio
3. **Semana 3 (Días 5-7)**: 50% de tráfico → nuevo servicio
4. **Semana 4 (Días 1-2)**: 75% de tráfico → nuevo servicio
5. **Semana 4 (Días 3+)**: 100% de tráfico → nuevo servicio

**Criterios para avanzar a siguiente fase:**

- ✅ Error rate < 1%
- ✅ Performance dentro de 20% del baseline
- ✅ Sin reportes de bugs críticos
- ✅ Logs sin errores inesperados

**Entregables:**

- ✅ Dashboard de monitoreo (error rate, latency)
- ✅ Plan de rollback documentado
- ✅ 100% de tráfico en nuevo servicio sin incidentes

---

### Fase 6: Limpieza y Optimización (Semana 4-5)

**Objetivo**: Remover código legacy y optimizar deployment

**Tareas:**

- [ ] Remover script Python de Next.js app
- [ ] Eliminar dependencias Python de package.json
- [ ] Limpiar código legacy en API route
- [ ] Migrar Next.js a Vercel
- [ ] Documentar arquitectura nueva
- [ ] Crear runbook operacional

**Optimizaciones adicionales:**

- [ ] Implementar cache de resultados (Redis)
- [ ] Agregar rate limiting
- [ ] Implementar queue para procesamiento async (opcional)
- [ ] Configurar CDN para imágenes procesadas

**Entregables:**

- ✅ Next.js desplegado en Vercel
- ✅ Código legacy removido
- ✅ Documentación actualizada
- ✅ Runbook operacional completo

---

## Especificaciones Técnicas

### API Contract

#### Endpoint: `POST /process`

**Request:**

```http
POST /process HTTP/1.1
Host: omr-service.railway.app
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="exam.jpg"
Content-Type: image/jpeg

<binary data>
--boundary
Content-Disposition: form-data; name="debug"

false
--boundary--
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
  "processed_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgAB..."
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Failed to detect QR code",
  "error_code": "QR_NOT_FOUND",
  "details": {
    "attempted_strategies": ["direct", "scaled", "sharpened"],
    "image_size": [1920, 1080]
  }
}
```

#### Endpoint: `GET /health`

**Response:**

```json
{
  "status": "healthy",
  "service": "omr-processor",
  "version": "1.0.0",
  "uptime_seconds": 12345
}
```

### Variables de Entorno

**OMR Service:**

```bash
# omr-service/.env
PORT=8000
LOG_LEVEL=info
MAX_IMAGE_SIZE_MB=10
ALLOWED_ORIGINS=https://profevision.vercel.app,http://localhost:3000
ENABLE_DEBUG_IMAGES=false
```

**Next.js App:**

```bash
# .env.production
OMR_SERVICE_URL=https://omr-service-production.up.railway.app
OMR_SERVICE_API_KEY=secret_key_here  # Para autenticación
OMR_TIMEOUT_MS=30000
OMR_USE_NEW_SERVICE=true
```

### Seguridad

**Autenticación:**

```python
# omr-service/omr_api.py
from fastapi import Header, HTTPException

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != os.getenv("API_KEY"):
        raise HTTPException(401, "Invalid API key")
```

**Rate Limiting:**

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/process")
@limiter.limit("10/minute")
async def process_omr(...):
    ...
```

**Validaciones:**

- Tamaño máximo de imagen: 10MB
- Formatos permitidos: JPG, PNG
- CORS configurado para dominios específicos
- Timeout de 30s por request

---

## Estrategia de Migración

### Plan de Rollback

**Si algo sale mal, podemos revertir en < 5 minutos:**

```bash
# Opción 1: Feature flag
# En Vercel dashboard → Environment Variables
OMR_USE_NEW_SERVICE=false
# Redeploy automático en 2-3 minutos

# Opción 2: Código
git revert <commit-hash>
git push origin main
# Vercel auto-deploy

# Opción 3: Servicio caído
# Next.js fallback automático a Python local
if (omrServiceDown) {
  return processWithLegacyPython(request);
}
```

### Checkpoints de Validación

Después de cada fase, validar:

```bash
# 1. Health check del servicio
curl https://omr-service.railway.app/health

# 2. Procesar imagen de test
curl -X POST https://omr-service.railway.app/process \
  -H "X-API-Key: $API_KEY" \
  -F "file=@test_exam.jpg" | jq .success
# Esperado: true

# 3. Verificar logs
railway logs --tail 100

# 4. Métricas
# - Error rate < 1%
# - Latency p95 < 2s
# - CPU usage < 70%
# - Memory usage < 80%
```

### Comunicación de Cambios

**Stakeholders:**

- Equipo de desarrollo (antes de empezar)
- QA team (antes de testing)
- Usuarios beta (antes de fase canary)
- Todos los usuarios (después del 100%)

**Template de comunicación:**

```markdown
## Mejora de Infraestructura - Procesamiento de Exámenes

Estamos migrando el procesamiento de exámenes a una arquitectura más robusta.

**Beneficios:**
- ⚡ 50% más rápido
- 📊 Mejor confiabilidad
- 🔧 Más fácil de mantener

**Impacto esperado:**
- Sin downtime
- Sin cambios en la UI
- Posible mejora en velocidad

**Cronograma:**
- Semana 1-2: Testing interno
- Semana 3: Rollout gradual
- Semana 4: 100% migrado
```

---

## Análisis de Costos

### Costo Actual (Estimado)

```
Servidor VPS (DigitalOcean/AWS):
- 4 vCPU, 8GB RAM, 160GB SSD
- Costo: $40-60/mes
- Razón: Necesita recursos para Node.js + Python + OpenCV
```

### Costo Nuevo (Proyectado)

**Opción 1: Railway (Recomendado)**

```
Next.js (Vercel):
- Hobby Plan: $0/mes (límite 100GB bandwidth)
- Pro Plan: $20/mes (1TB bandwidth, unlimited proyectos)

OMR Service (Railway):
- Starter: $5/mes (512MB RAM, 1 vCPU)
- Pro: $10/mes (1GB RAM, 2 vCPU) ← Recomendado

Total: $10-30/mes
Ahorro: $10-30/mes (25-50%)
```

**Opción 2: Render**

```
Next.js (Vercel): $0-20/mes
OMR Service (Render):
- Free tier: $0/mes (con cold starts)
- Starter: $7/mes (sin cold starts)

Total: $7-27/mes
Ahorro: $13-53/mes (30-60%)
```

**Opción 3: Fly.io**

```
Next.js (Vercel): $0-20/mes
OMR Service (Fly.io):
- 256MB RAM: ~$3/mes
- 512MB RAM: ~$6/mes

Total: $3-26/mes
Ahorro: $14-57/mes (35-65%)
```

### ROI Análisis

**Inversión inicial:**

- Desarrollo: 40 horas × $50/hr = $2,000
- Testing: 10 horas × $50/hr = $500
- Migration: 5 horas × $50/hr = $250
- **Total: $2,750**

**Retorno mensual:**

- Ahorro de costos: $20/mes (promedio)
- Tiempo de desarrollo ahorrado: 4 hrs/mes × $50 = $200/mes
- **Total ahorro: $220/mes**

**Break-even: 12.5 meses**

**Beneficios no monetarios:**

- Mejor developer experience
- Escalabilidad sin límites
- Menos downtime
- Mejor observabilidad

---

## Testing y Validación

### Test Cases

**1. Functional Tests**

```python
# omr-service/tests/test_omr_api.py
import pytest
from fastapi.testclient import TestClient
from omr_api import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_process_valid_image():
    with open("test_images/exam_001.jpg", "rb") as f:
        response = client.post("/process", files={"file": f})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "answers" in data
    assert len(data["answers"]) > 0

def test_process_no_qr():
    with open("test_images/no_qr.jpg", "rb") as f:
        response = client.post("/process", files={"file": f})
    # Should still succeed but with null qr_data
    assert response.status_code == 200
    data = response.json()
    assert data["qr_data"] is None

def test_invalid_file_type():
    response = client.post("/process",
                          files={"file": ("test.txt", b"not an image", "text/plain")})
    assert response.status_code == 400
```

**2. Performance Tests**

```bash
# Usar Apache Bench para load testing
ab -n 100 -c 10 -p test_exam.jpg \
   -T 'multipart/form-data; boundary=----WebKitFormBoundary' \
   https://omr-service.railway.app/process

# Métricas esperadas:
# - Requests per second: > 5
# - Time per request: < 2000ms (mean)
# - Failed requests: 0
```

**3. Integration Tests**

```typescript
// tests/integration/omr-service.test.ts
describe('OMR Service Integration', () => {
  it('should process exam image end-to-end', async () => {
    const formData = new FormData();
    formData.append('scan', testImage);

    const response = await fetch('/api/exams/process-scan', {
      method: 'POST',
      body: formData
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.result.answers).toHaveLength(40);
  });
});
```

**4. Regression Tests**

```bash
# Comparar resultados con versión anterior
# scripts/test_regression.sh

for img in test_images/*.jpg; do
  # Procesar con versión vieja
  OLD_RESULT=$(python scripts/omr/omr_standalone.py $img)

  # Procesar con servicio nuevo
  NEW_RESULT=$(curl -F "file=@$img" https://omr-service.railway.app/process)

  # Comparar resultados
  diff <(echo "$OLD_RESULT" | jq -S .) <(echo "$NEW_RESULT" | jq -S .)
done
```

### Quality Gates

Antes de pasar a producción, validar:

- ✅ **Cobertura de tests**: > 80%
- ✅ **Performance**: < 2s promedio de procesamiento
- ✅ **Precisión**: 100% match con versión actual en test set
- ✅ **Uptime**: 99.9% en últimos 7 días
- ✅ **Error rate**: < 0.1%
- ✅ **Security scan**: Sin vulnerabilidades críticas

---

## Guía de Deployment

### Railway Deployment (Step-by-Step)

**1. Preparación**

```bash
# Clonar repo y navegar a servicio
cd profevision
cd omr-service

# Verificar Dockerfile
docker build -t omr-service .
docker run -p 8000:8000 omr-service

# Probar localmente
curl http://localhost:8000/health
```

**2. Crear Proyecto en Railway**

```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init
# Seleccionar: "Create new project"
# Nombre: "profevision-omr-service"

# Link a repo Git (opcional)
railway link
```

**3. Configurar Variables de Entorno**

```bash
# Via CLI
railway variables set PORT=8000
railway variables set LOG_LEVEL=info
railway variables set API_KEY=<generate-random-key>
railway variables set ALLOWED_ORIGINS=https://profevision.vercel.app

# O via Dashboard:
# railway.app → Project → Variables
```

**4. Deploy**

```bash
# Deploy desde código local
railway up

# O configurar auto-deploy desde GitHub
# railway.app → Project → Settings → Connect to GitHub
```

**5. Configurar Dominio**

```bash
# Generar dominio público
railway domain

# Output: https://omr-service-production-xxxx.up.railway.app

# O configurar custom domain (opcional)
# railway.app → Project → Settings → Custom Domain
# Agregar: omr.profevision.com
```

**6. Configurar Health Checks**

```yaml
# railway.toml (crear en raíz de omr-service/)
[build]
builder = "dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 3
```

**7. Verificación Post-Deploy**

```bash
# 1. Health check
curl https://omr-service-production-xxxx.up.railway.app/health

# 2. Procesar imagen de prueba
curl -X POST https://omr-service-production-xxxx.up.railway.app/process \
  -H "X-API-Key: <your-api-key>" \
  -F "file=@test_exam.jpg" \
  -o result.json

# 3. Verificar logs
railway logs --tail 100

# 4. Monitorear métricas
railway status
```

### Render Deployment (Alternativa)

**1. Crear cuenta en Render.com**

**2. Nuevo Web Service**

- Conectar GitHub repo
- Seleccionar `omr-service/` como root directory
- Runtime: Docker
- Build command: (autodetectado)
- Start command: `uvicorn omr_api:app --host 0.0.0.0 --port $PORT`

**3. Configurar**

- Instance Type: Starter ($7/mo) o Free
- Environment Variables: Igual que Railway
- Health Check Path: `/health`

**4. Deploy**

- Click "Create Web Service"
- Esperar deploy (~5 min primera vez)
- URL pública: `https://omr-service.onrender.com`

### Next.js Configuration

**Configurar en Vercel:**

```bash
# Vercel Dashboard → ProfeVision → Settings → Environment Variables

# Production
OMR_SERVICE_URL=https://omr-service-production.up.railway.app
OMR_SERVICE_API_KEY=<api-key>
OMR_TIMEOUT_MS=30000
OMR_USE_NEW_SERVICE=true

# Preview (para testing)
OMR_SERVICE_URL=https://omr-service-staging.up.railway.app
OMR_SERVICE_API_KEY=<staging-api-key>
OMR_USE_NEW_SERVICE=true

# Development (local)
OMR_SERVICE_URL=http://localhost:8000
OMR_USE_NEW_SERVICE=false  # Usar Python local
```

---

## Monitoreo y Mantenimiento

### Observabilidad

**1. Logging**

```python
# omr-service/omr_api.py
import logging
from fastapi import Request
import time

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","message":"%(message)s"}'
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    logging.info({
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "duration_ms": duration * 1000
    })

    return response
```

**2. Métricas**

```python
# Integrar Prometheus (opcional)
from prometheus_client import Counter, Histogram, generate_latest

requests_total = Counter('omr_requests_total', 'Total requests')
request_duration = Histogram('omr_request_duration_seconds', 'Request duration')

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

**3. Alertas**

Configurar en Railway/Render dashboard:

- CPU > 80% por 5 minutos → Email/Slack
- Memory > 90% → Email/Slack
- Error rate > 5% → Email/Slack
- Uptime < 99% → Email/Slack

**4. Dashboard (Opcional - Grafana Cloud)**

```yaml
# docker-compose.yml (para desarrollo local con métricas)
version: '3.8'
services:
  omr-service:
    build: .
    ports:
      - "8000:8000"

  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

### Runbook Operacional

**Incident Response:**

| Problema | Síntomas | Acción |
|----------|----------|--------|
| Servicio caído | Health check falla | 1. Check Railway logs<br>2. Redeploy si es crash<br>3. Rollback si es deployment malo |
| Alta latencia | Requests > 5s | 1. Check CPU/Memory<br>2. Escalar verticalmente si es necesario<br>3. Investigar imágenes problemáticas |
| Muchos errores | Error rate > 5% | 1. Check logs por patrón<br>2. Rollback si es deployment nuevo<br>3. Feature flag a legacy |
| Out of Memory | Container restart loop | 1. Escalar RAM (Railway dashboard)<br>2. Investigar memory leaks<br>3. Agregar límite de tamaño de imagen |

**Mantenimiento Regular:**

```bash
# Semanal
- Revisar logs por errores inusuales
- Verificar métricas de performance
- Check uptime (debe ser > 99.5%)

# Mensual
- Actualizar dependencias (pip-upgrade)
- Review de costos vs uso
- Análisis de imágenes problemáticas

# Trimestral
- Security audit (dependencias)
- Performance optimization review
- Capacity planning
```

**Upgrade Strategy:**

```bash
# Para actualizar código del servicio:

# 1. Crear rama
git checkout -b upgrade-omr-service

# 2. Hacer cambios
# edit omr-service/...

# 3. Testing local
docker build -t omr-service:test .
docker run -p 8000:8000 omr-service:test
# Run tests...

# 4. Deploy a staging
git push origin upgrade-omr-service
# Railway auto-deploys staging environment

# 5. Smoke test staging
curl https://omr-service-staging.railway.app/health

# 6. Merge a main (producción)
git checkout main
git merge upgrade-omr-service
git push origin main
# Railway auto-deploys production

# 7. Monitor por 24 horas
railway logs --tail 500
```

---

## Checklist de Migración

### Pre-Migración

- [ ] Código existente documentado y entendido
- [ ] Test images recolectadas (mínimo 20 diversas)
- [ ] Baseline de performance establecido
- [ ] Equipo capacitado en Docker/FastAPI

### Fase 1: Desarrollo del Servicio

- [ ] Directorio `omr-service/` creado
- [ ] `omr_api.py` implementado
- [ ] `Dockerfile` creado y probado
- [ ] `requirements.txt` completo
- [ ] Tests unitarios escritos
- [ ] Swagger docs verificados (`/docs`)
- [ ] README.md documentado

### Fase 2: Testing Local

- [ ] Build Docker exitoso
- [ ] Servicio corre en puerto 8000
- [ ] Health check responde
- [ ] 20+ imágenes procesadas correctamente
- [ ] Performance medido (< 2s)
- [ ] Resultados coinciden 100% con versión actual
- [ ] Error handling validado

### Fase 3: Adaptación Next.js

- [ ] Cliente HTTP creado (`lib/services/omr-client.ts`)
- [ ] API route actualizada
- [ ] Feature flag implementado
- [ ] Retry logic agregado
- [ ] Timeout handling configurado
- [ ] Logs mejorados
- [ ] Variables de entorno documentadas

### Fase 4: Deployment

- [ ] Cuenta Railway/Render creada
- [ ] Proyecto configurado
- [ ] Variables de entorno configuradas
- [ ] Dominio público asignado
- [ ] Health checks configurados
- [ ] Servicio desplegado y accesible
- [ ] URL agregada a Next.js env vars
- [ ] SSL/HTTPS verificado

### Fase 5: Migración Gradual

- [ ] 10% canary: Sin errores por 24h
- [ ] 25% canary: Sin errores por 24h
- [ ] 50% canary: Sin errores por 48h
- [ ] 75% canary: Sin errores por 48h
- [ ] 100% tráfico: Monitoreado por 7 días
- [ ] Métricas validadas (error rate, latency)
- [ ] Plan de rollback probado

### Fase 6: Limpieza

- [ ] Next.js migrado a Vercel
- [ ] Código Python removido de Next.js
- [ ] Dependencias Python eliminadas
- [ ] Feature flags removidos
- [ ] Documentación actualizada
- [ ] CLAUDE.md actualizado
- [ ] Runbook operacional creado
- [ ] Team training completado

### Post-Migración

- [ ] Monitoring configurado y funcionando
- [ ] Alertas probadas
- [ ] Costos revisados y dentro de presupuesto
- [ ] Performance igual o mejor que antes
- [ ] Zero downtime confirmado
- [ ] Retrospectiva realizada
- [ ] Lecciones aprendidas documentadas

---

## Conclusión

Esta migración transformará ProfeVision de una aplicación monolítica con limitaciones de deployment a una arquitectura moderna, escalable y mantenible.

**Beneficios clave:**

1. ✅ **Deployment Serverless**: Next.js en Vercel (gratis o $20/mes)
2. ✅ **Escalabilidad**: Auto-scaling independiente de componentes
3. ✅ **Performance**: ~50% mejora en latencia
4. ✅ **Costos**: Reducción de 25-50% ($10-30/mes ahorro)
5. ✅ **Developer Experience**: Mejor observabilidad y debugging
6. ✅ **Mantenibilidad**: Código más simple, servicios separados

**Próximos pasos inmediatos:**

1. Crear directorio `omr-service/`
2. Implementar FastAPI wrapper (2-3 días)
3. Testing exhaustivo local (2-3 días)
4. Deploy a Railway staging (1 día)
5. Comenzar migración gradual (1-2 semanas)

**Riesgos mitigados:**

- ✅ Plan de rollback en < 5 minutos
- ✅ Migración gradual con feature flags
- ✅ Backward compatibility mantenida
- ✅ Testing exhaustivo antes de producción

---

**Documento versionado**: v1.0.0
**Última actualización**: 15 de octubre de 2025
**Próxima revisión**: Al completar cada fase

**Contacto para preguntas:**
- Technical Lead: [nombre]
- DevOps: [nombre]
- Product Owner: [nombre]
