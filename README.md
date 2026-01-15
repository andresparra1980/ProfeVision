# ProfeVision 📚✨

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![Powered by AI](https://img.shields.io/badge/AI-Powered-purple)](https://vercel.com/ai)


Plataforma integral impulsada por IA que transforma la forma en que los profesores crean, administran y califican exámenes. Con ProfeVision, los docentes pueden diseñar evaluaciones de opción múltiple con asistencia de IA, generar formatos personalizados, y calificar automáticamente en segundos mediante escaneo con smartphone.

## 🚀 Características Principales

### 🤖 Potenciado por IA (Mastra + Vercel AI SDK)
- **Generación de Exámenes**: Crea evaluaciones completas en segundos utilizando modelos avanzados como **Gemini 1.5 Pro/Flash**, **GPT-4o** y **Claude 3.5 Sonnet**.
- **Asistente Virtual (Mastra Chat)**: Chat inteligente integrado para ayudar a los profesores a mejorar preguntas, sugerir temas y refinar el contenido.
- **Análisis Predictivo**: Insights profundos sobre el rendimiento de los estudiantes y la calidad de las preguntas.

### 📱 Escaneo y Calificación Inteligente
- **OMR Digital**: Tecnología de reconocimiento óptico de marcas (Optical Mark Recognition) usando `opencv-js` y `jsqr`.
- **Calificación en Tiempo Real**: Escanea las hojas de respuesta con la cámara de tu dispositivo y obtén resultados instantáneos.
- **Soporte Móvil**: Interfaz optimizada para uso en smartphones y tablets.

### 💰 Suscripciones y Monetización (Polar.sh)
- **Gestión de Planes**: Integración completa con **Polar.sh** para gestionar suscripciones (Free vs ProfeVision Plus).
- **Billing Flexible**: Soporte para facturación mensual y anual.
- **Límites por Tier**: Control de acceso a features avanzadas basado en el nivel de suscripción.

### 🌍 Internacionalización (i18n)
- **Multilenguaje Nativo**: Soporte completo para múltiples idiomas (Español, Inglés, Portugués, Francés) mediante `next-intl`.
- **Adaptación Cultural**: Contenidos y formatos adaptados a diferentes regiones educativas.

### 📊 Dashboard y Análisis
- **Reportes Detallados**: Gráficos interactivos con **Tremor** y **Recharts**.
- **Gestión de Cursos y Estudiantes**: Panel administrativo completo para organizar grupos y alumnos.
- **Historial Académico**: Seguimiento longitudinal del desempeño.

## 💻 Stack Tecnológico

El proyecto utiliza una arquitectura moderna basada en un monorepo gestionado con **Turborepo**, lo que nos permite escalar y mantener múltiples aplicaciones y paquetes en un solo repositorio de manera eficiente.

### Estructura del Monorepo

- `apps/web`: La aplicación principal de ProfeVision (Next.js 15), donde reside la plataforma para profesores y estudiantes.
- `apps/docs`: Sitio de documentación (si aplica) o recursos estáticos adicionales para el proyecto.
- `packages/*`: (Opcional) Librerías compartidas de UI, configuraciones de TS/ESLint, etc.

### 📱 Aplicación Móvil
La aplicación nativa (React Native) para Android e iOS se gestiona en un repositorio independiente:
👉 **[andresparra1980/profevision-mobile-app](https://github.com/andresparra1980/profevision-mobile-app)**

### Frontend
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Core**: React 19 RC
- **Estilos**: Tailwind CSS 3.4, Shadcn/UI (Radix Primitives)
- **Visualización**: Tremor, Recharts
- **Edición**: Tiptap Editor

### Backend & Servicios
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **AI Engine**: Mastra Core, Vercel AI SDK, LangChain
- **Pagos**: Polar.sh SDK
- **Edge Functions**: Supabase Edge Functions

### Calidad y Testing
- **Unit & Integration**: Vitest
- **Linting**: ESLint (Configuración Next.js + Prettier)
- **Type Checking**: TypeScript 5

## 🛠️ Desarrollo Local

### Requisitos Previos
- Node.js 20+
- pnpm 9+
- Git

### Instalación

1.  **Clonar el repositorio**
    ```bash
    git clone https://github.com/tu-usuario/profevision.git
    cd profevision
    ```

2.  **Instalar dependencias**
    ```bash
    pnpm install
    ```

3.  **Configurar Variables de Entorno**
    Copia el archivo de ejemplo y completa tus credenciales:
    ```bash
    cp apps/web/.env.example apps/web/.env.local
    ```
    *Necesitarás API Keys de: Supabase, OpenRouter (o OpenAI/Anthropic), y Polar.sh (para pagos).*

4.  **Iniciar Servidor de Desarrollo**
    Utilizamos Turbopack para una experiencia de desarrollo ultra rápida:
    ```bash
    pnpm dev
    ```
    La aplicación estará disponible en `http://localhost:3000`.

### Comandos Útiles

- `pnpm build` - Compilar el proyecto para producción.
- `pnpm test` - Ejecutar suite de pruebas con Vitest.
- `pnpm test:ui` - Abrir interfaz gráfica de pruebas.
- `pnpm lint` - Verificar calidad de código.


## 📄 Licencia

Propiedad de **ProfeVision**.
Todos los derechos reservados. No está permitida la distribución ni modificación de este código sin autorización previa.