# Sistema de Auto-Captura de Documentos

## Overview

Sistema experimental de captura automática de hojas de examen usando OpenCV.js en el browser. Detecta documento, valida estabilidad, busca QR y captura automáticamente.

**Feature Flag:** `NEXT_PUBLIC_EXPERIMENTAL_AUTO_CAM=true`

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    image-capture.tsx                            │
│  ┌──────────┐ ┌──────────┐                                     │
│  │  Flash   │ │   B/W    │  ← Toggles con persistencia         │
│  │  Toggle  │ │  Toggle  │    localStorage                     │
│  └──────────┘ └──────────┘                                     │
│         ↓                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              DocumentCapture Component                   │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │              Video Stream                        │    │   │
│  │  │         (cámara trasera, full-res)              │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                      ↓                                   │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │         Processing Loop (cada 200ms)            │    │   │
│  │  │  1. Resize a 640x480                            │    │   │
│  │  │  2. Grayscale + Sharpness check                 │    │   │
│  │  │  3. Adaptive threshold                          │    │   │
│  │  │  4. Find contours (4 esquinas)                  │    │   │
│  │  │  5. Check stability                             │    │   │
│  │  │  6. Detect QR (jsQR)                            │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                      ↓                                   │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │              Capture (full-res)                  │    │   │
│  │  │  1. Canvas desde video                          │    │   │
│  │  │  2. Otsu threshold (si B/W enabled)             │    │   │
│  │  │  3. toBlob JPEG 100%                            │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                      API OMR Backend
```

## Componentes

### 1. image-capture.tsx (Wizard Step)

**Ubicación:** `components/exam/wizard-steps/image-capture.tsx`

Controla los toggles y lanza DocumentCapture:

```typescript
// Estados persistidos en localStorage
const [torchEnabled, setTorchEnabled] = useState(true);  // Flash ON por defecto
const [bwEnabled, setBwEnabled] = useState(true);        // B/W ON por defecto

// Keys localStorage
'profevision_torch_enabled'
'profevision_bw_enabled'
```

### 2. DocumentCapture Component

**Ubicación:** `components/exam/document-capture/`

```
document-capture/
├── index.tsx    # Componente principal
├── config.ts    # Parámetros calibrados
└── types.ts     # TypeScript types
```

## Flujo de Detección

### Loop de Procesamiento (cada 200ms)

```
Frame Video (640x480)
        ↓
   Grayscale
        ↓
   Sharpness Check (Laplacian variance)
        ↓ (si >= 70)
   Gaussian Blur
        ↓
   Adaptive Threshold
        ↓
   Dilate (opcional)
        ↓
   Find Contours
        ↓
   Filter: área 20-95%, 4 esquinas
        ↓
   Stability Check (sticky progress)
        ↓ (si 100%)
   QR Detection (jsQR)
        ↓ (si válido)
   AUTO-CAPTURE
```

### Sistema de Estabilidad (Sticky Progress)

No usa tiempo absoluto. Usa progreso acumulativo:

```
Cada frame con documento detectado: +33% (200ms/600ms)
Cada frame sin documento o blur:    -20% (decay)

Progress >= 100% → Trigger QR detection → Capture
```

**Beneficios:**
- Más robusto en dispositivos lentos
- No resetea a 0% por un frame malo
- 3 frames buenos consecutivos = captura

## Configuración

**Archivo:** `components/exam/document-capture/config.ts`

```typescript
export const DOCUMENT_CAPTURE_CONFIG = {
  // Processing
  processIntervalMs: 200,      // Loop cada 200ms
  processWidth: 640,           // Resolución de procesamiento
  processHeight: 480,

  // Adaptive threshold
  adaptiveBlockSize: 21,
  adaptiveC: 20,               // Mayor = menos sensible, más estable
  blurKernel: 5,
  dilateIterations: 1,

  // Contour detection
  minAreaRatio: 0.20,          // Documento debe ser >20% del frame
  maxAreaRatio: 0.95,          // Y <95%
  approxEpsilon: 0.02,         // Tolerancia para polígono

  // Stability
  stabilityDuration: 600,      // 600ms = 3 frames @ 200ms
  stabilityDecay: 0.2,         // -20% por frame fallido

  // Capture quality
  jpegQuality: 1.0,            // 100% calidad
  idealWidth: 2880,            // Resolución ideal cámara
  idealHeight: 2160,

  // QR Detection
  qrRoiRatio: 0.5,             // Busca QR en 50% superior izquierdo
  qrWarningDelayMs: 1000,      // 1s antes de mostrar warning
  qrMaxAttempts: 5,            // 5 frames sin QR = warning

  // Sharpness
  sharpnessThreshold: 70,      // Laplacian variance mínimo
};
```

## Estados de Captura

```typescript
type CaptureStatus = 
  | 'loading'       // Cargando OpenCV.js
  | 'ready'         // "Posiciona el documento"
  | 'detecting'     // Documento detectado, iniciando estabilidad
  | 'stable'        // "Mantén firme..."
  | 'searching_qr'  // Buscando QR en frame estable
  | 'blurry'        // "Imagen borrosa"
  | 'no_qr'         // "No se detecta código QR"
  | 'capturing'     // "Capturando..."
  | 'captured'      // "Capturado"
  | 'error';        // Error
```

## Flash/Torch

Usa MediaTrack API para controlar LED:

```typescript
const track = stream.getVideoTracks()[0];
const capabilities = track.getCapabilities();

if (capabilities.torch) {
  await track.applyConstraints({
    advanced: [{ torch: true }]
  });
}
```

**Compatibilidad:**
- Android Chrome: funciona
- iOS Safari: funciona

## Binarización (B/W)

Usa Otsu threshold para binarización automática:

```typescript
cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
cv.threshold(gray, bw, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
```

**Beneficios:**
- Reduce tamaño archivo ~60-80%
- Elimina información de color innecesaria para OMR
- Otsu encuentra umbral óptimo automáticamente

## Formato QR Esperado

```
examId:studentId:groupId:hash
```
o
```
examId:studentId:hash
```

## OpenCV.js

**Ubicación:** `public/opencv.js` (~11MB)

**Carga:**
- Lazy load cuando se abre DocumentCapture
- Cacheado 1 año (next.config.ts)
- Excluido de locale routing (middleware.ts)

## Mensajes UX (i18n)

**Archivos:**
- `i18n/locales/es/document-capture.json`
- `i18n/locales/en/document-capture.json`

```json
{
  "status": {
    "loading": "Cargando...",
    "requestingCamera": "Solicitando cámara...",
    "searching": "Posiciona el documento",
    "holdStill": "Mantén firme...",
    "capturing": "Capturando...",
    "captured": "Capturado",
    "searchingQr": "Buscando código QR...",
    "blurry": "Imagen borrosa",
    "noQr": "No se detecta código QR"
  }
}
```

## Optimizaciones para Dispositivos de Gama Baja

1. **Procesamiento a 640x480** - No procesa full-res
2. **200ms interval** - Balance CPU vs responsividad
3. **Sharpness threshold 70** - Más permisivo
4. **Sticky progress** - No resetea por frames malos
5. **Flash por defecto ON** - Mejor iluminación

## Troubleshooting

### Imagen borrosa constantemente
- Aumentar iluminación o activar flash
- Limpiar lente de cámara
- Reducir `sharpnessThreshold` en config

### No detecta documento
- Verificar área del documento (>20% del frame)
- Asegurar 4 esquinas visibles
- Fondo contrastante con documento

### No detecta QR
- QR debe estar en cuadrante superior izquierdo
- QR debe ser legible (no borroso)
- Verificar formato QR correcto

### Captura muy lenta
- Verificar que `stabilityDuration` sea 600ms
- En gama baja, considerar reducir `processWidth/Height`
