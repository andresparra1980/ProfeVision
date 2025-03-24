#### Frontend (Next.js)

- **Framework**: Next.js 14+ con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS + Shadcn/UI
- **Estado Global**: Context API + SWR para fetching
- **Formularios**: React Hook Form + Zod para validación

#### Backend (Next.js API Routes + Supabase)

- **Lenguaje**: TypeScript (Next.js API Routes)
- **Base de Datos**: PostgreSQL (a través de Supabase)
- **Autenticación**: Supabase Auth
- **Almacenamiento**: Supabase Storage para imágenes de exámenes
- **Funciones Serverless**: Supabase Edge Functions para procesamiento intensivo

#### Integración de IA (OpenRouter.ai)

- API REST para comunicación con diversos modelos de LLMs
- Modelos específicos por tarea:
    - Generación de preguntas: GPT-4, Claude 3 Opus
    - Verificación de calidad: Claude 3 Haiku
    - Generación de distractores: Mixtral, Llama 3

#### Procesamiento de Imágenes

- **Captura**: MediaDevices API (Web)
- **Procesamiento de QR**: jsQR o zxing
- **Reconocimiento óptico**: Biblioteca de procesamiento de imágenes como TensorFlow.js o OpenCV.js
- **Post-procesamiento**: Algoritmos personalizados para reconocimiento de marcas

#### Sistema de Pagos (PayU)

- Integración de API REST de PayU
- Webhook para confirmación de pagos
- Tokenización de tarjetas para pagos recurrentes

#### 