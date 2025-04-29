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
- **AI**: OpenRouter.ai (GPT-4, Claude 3, Mixtral)
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

```
OPENROUTER_API_KEY=tu_api_key_de_openrouter
OPENAI_MODEL=gpt-4
```

- `OPENROUTER_API_KEY`: Obtén tu API Key en https://openrouter.ai/
- `OPENAI_MODEL`: Modelo recomendado: `gpt-4` o `claude-3-opus` (puedes cambiarlo según disponibilidad y calidad deseada).

No se requiere configuración adicional en Supabase para esta funcionalidad.