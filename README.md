# ProfeVision

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![Powered by AI](https://img.shields.io/badge/AI-Powered-purple)](https://vercel.com/ai)

Comprehensive AI-powered platform transforming how teachers create, manage, and grade exams. With ProfeVision, educators can design multiple-choice assessments with AI assistance, generate custom formats, and automatically grade in seconds using smartphone scanning.

## Main Features

### AI-Powered (Mastra + Vercel AI SDK)
- **Exam Generation**: Create complete assessments in seconds using advanced models like **Gemini 3.1 Pro/Flash**, **GPT-5**, and **Claude 4.5**.
- **Virtual Assistant (Mastra Chat)**: Integrated smart chat to help teachers improve questions, suggest topics, and refine content.
- **Predictive Analytics**: Insights into student performance and question quality.

### Smart Scanning and Grading
- **Digital OMR**: Optical Mark Recognition technology using `opencv-js` and `jsqr`.
- **Real-Time Grading**: Scan answer sheets with your device's camera and get instant results.
- **Mobile Support**: Optimized interface for smartphones and tablets.

### Subscriptions and Monetization (Polar.sh)
- **Plan Management**: Fully integrated with **Polar.sh** to manage subscriptions (Free vs ProfeVision Plus).
- **Flexible Billing**: Support for monthly and annual billing.
- **Tier Limits**: Access control to advanced features based on subscription level.

### Internationalization (i18n)
- **Native Multilingual**: Full support for multiple languages (Spanish, English, Portuguese, French) using `next-intl`.
- **Cultural Adaptation**: Content and formats adapted to different educational regions.

### Dashboard and Analytics
- **Detailed Reports**: Interactive charts with **Tremor** and **Recharts**.
- **Course and Student Management**: Complete administrative panel to organize groups and students.
- **Academic History**: Longitudinal tracking of performance.

## Technology Stack

The project uses a modern architecture based on a monorepo managed with **Turborepo**, allowing us to efficiently scale and maintain multiple applications and packages in a single repository.

### Monorepo Structure

- `apps/web`: The main ProfeVision application (Next.js 15), where the platform for teachers and students resides.
- `apps/blog`: The ProfeVision blog application (Payload CMS), designed for publishing educational articles, platform updates, and resources for teachers.
- `apps/docs`: Documentation site built with Fumadocs, containing static resources, guides, and tutorials for the project.
- `packages/*`: (Optional) Shared libraries for UI, TS/ESLint configurations, etc.
- `services/*`: Dedicated microservices for external processing. These services run inside Docker containers using FastAPI, exposed through an NGINX reverse proxy.
  - `services/omr-service-direct`: The active OMR (Optical Mark Recognition) microservice. It handles high-resolution image processing directly between the client and the service, bypassing Vercel's body limits and timeouts.
  - `services/latex-service`: Microservice responsible for rendering and compiling LaTeX documents (e.g., generating PDFs of the exams).
  - `services/omr-service`: **[DEPRECATED]** Previous OMR service. Deprecated because routing high-resolution images through Vercel resulted in payload/timeout limits.

### Mobile Application
The native application (React Native) for Android and iOS is managed in a separate repository:
**[andresparra1980/profevision-mobile-app](https://github.com/andresparra1980/profevision-mobile-app)** to avoid versioning issues with React Native

### Frontend
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Core**: React 19 RC
- **Styling**: Tailwind CSS 3.4, Shadcn/UI (Radix Primitives)
- **Visualization**: Tremor, Recharts
- **Editor**: Tiptap Editor

### Backend & Services
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Engine**: Mastra Core, Vercel AI SDK, LangChain
- **Payments**: Polar.sh SDK
- **Edge Functions**: Supabase Edge Functions

### Quality and Testing
- **Unit & Integration**: Vitest
- **Linting**: ESLint (Next.js config + Prettier)
- **Type Checking**: TypeScript 5

## Local Development

### Prerequisites
- Node.js 20+
- pnpm 9+
- Git

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/profevision.git
    cd profevision
    ```

2.  **Install dependencies**
    ```bash
    pnpm install
    ```

3.  **Configure Environment Variables**
    Copy the example file and fill in your credentials:
    ```bash
    cp apps/web/.env.example apps/web/.env.local
    ```
    *You will need API Keys for: Supabase, OpenRouter (or OpenAI/Anthropic), and Polar.sh (for payments).*

4.  **Start Development Server**
    We use Turbopack for lightning-fast development experience:
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:3000`.

### Useful Commands

- `pnpm build` - Build the project for production.
- `pnpm test` - Run test suite with Vitest.
- `pnpm test:ui` - Open graphical test interface.
- `pnpm lint` - Check code quality.


## License

Property of **ProfeVision**.
All rights reserved. Distribution or modification of this code without prior authorization is not permitted.