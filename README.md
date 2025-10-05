# ProfeVision 📚✨

Plataforma integral que transforma la forma en que los profesores crean, administran y califican exámenes. Con ProfeVision, los docentes pueden diseñar evaluaciones de opción múltiple, generar formatos personalizados para cada estudiante, y calificar automáticamente mediante escaneo con un smartphone.

## Calidad de Código

Hemos implementado mejoras significativas en la calidad del código:

1. **ESLint Configurado**: Configuración estandarizada para detectar y prevenir errores comunes
2. **Centralizamos el Logging**: Creamos un sistema de logs centralizado en `lib/utils/logger.ts`
3. **Guía de Calidad**: Ver [CODE_QUALITY.md](./CODE_QUALITY.md) para estándares y mejores prácticas

## Características Principales 🚀

- **Creación de Exámenes**: Diseño intuitivo con asistencia de IA
- **Versiones Únicas**: Generación automática de múltiples versiones
- **Calificación Automática**: Escaneo y calificación mediante smartphone
- **Análisis Detallado**: Insights sobre el desempeño estudiantil

## Stack Tecnológico 💻

- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Next.js API Routes, Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **AI**: OpenRouter.ai (GPT-4, Claude 3, Gemini), LangChain
- **Observability**: LangSmith (AI tracing, cost analytics)
- **Procesamiento de Imágenes**: MediaDevices API, jsQR/zxing, TensorFlow.js/OpenCV.js
- **Payments**: PayU API

## Inicio Rápido 🏃‍♂️

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/profevision.git
cd profevision

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Iniciar en modo desarrollo
npm run dev
```

## Estado del Proyecto 🌱

Actualmente en desarrollo activo. MVP planificado para Q1 2024.

## Licencia 📄

Este proyecto está bajo la licencia [MIT](./LICENSE).

## Uso de la Plataforma

Con ProfeVision, los docentes pueden:

- Diseñar evaluaciones de opción múltiple
- Generar formatos personalizados para cada estudiante
- Calificar automáticamente mediante escaneo con un smartphone
- Obtener análisis detallados del desempeño estudiantil

## Desarrollo

### Requisitos

- Node.js 18+
- npm o yarn
- Git

### Comandos Principales

- `npm run dev` - Iniciar servidor de desarrollo
- `npm run build` - Compilar para producción
- `npm run start` - Iniciar en modo producción
- `npm run lint` - Ejecutar verificación de linting

## Contribuciones

Consulta [CONTRIBUTING.md](./CONTRIBUTING.md) para conocer nuestras pautas de contribución.

## Configuración de entorno para generación de preguntas con IA

Asegúrate de tener las siguientes variables en tu `.env.local`:

```bash
# OpenRouter (Required)
OPENROUTER_API_KEY=tu_api_key_de_openrouter
OPENAI_MODEL=google/gemini-2.5-flash-lite
OPENAI_FALLBACK_MODEL=mistralai/ministral-8b

# LangSmith (Optional - for AI observability)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=tu_api_key_de_langsmith
LANGCHAIN_PROJECT=ProfeVision
```

### API Keys
- **OpenRouter**: Obtén tu API Key en [openrouter.ai](https://openrouter.ai/)
- **LangSmith**: Obtén tu API Key en [smith.langchain.com/settings](https://smith.langchain.com/settings)

### Modelos Recomendados
- **Primario**: `google/gemini-2.5-flash-lite` (rápido y económico)
- **Fallback**: `mistralai/ministral-8b` (backup confiable)
- **Alternativas**: `openai/gpt-4`, `anthropic/claude-3-opus`

### Observabilidad (Opcional)
Ver **[LANGSMITH_QUICKSTART.md](./LANGSMITH_QUICKSTART.md)** para configurar tracing completo de IA con:
- 📊 Análisis de costos en tiempo real
- 🔍 Debugging de prompts y respuestas
- 📈 Métricas de rendimiento
- 💰 Tracking de tokens y gastos

No se requiere configuración adicional en Supabase para esta funcionalidad.