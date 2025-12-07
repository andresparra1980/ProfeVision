# API, SDKs, and Integrations

## API Overview
-   **Base URL**: `https://api.polar.sh/v1`
-   **Authentication**: Bearer Token (Organization Access Token).
-   **Pagination**: Cursor-based or Page-based depending on endpoint.

## SDKs
Official SDKs are available for:
-   **TypeScript / JavaScript** (`@polar-sh/sdk`)
-   **Python** (`polar-sdk`)
-   **PHP**
-   **Go**

## Framework Adapters
Quick-start adapters for effortless integration:
-   **Next.js**: Checkout handlers, webhooks, and customer portal routing.
-   **Laravel**, **Symfony**, **Remix**, **Nuxt**, **Astro**, **SvelteKit**, **Fastify**, **Elysia**, **Hono**.

## Sandbox Environment
-   **URL**: `https://sandbox-api.polar.sh/v1`
-   **Dashboard**: `https://sandbox.polar.sh`
-   **Usage**: Completely isolated from production. Use Stripe test cards (e.g., `4242...`) to simulate payments.
-   **Note**: Production tokens do **not** work in Sandbox and vice versa.

## OAuth 2.0 (Connect)
For platforms building on top of Polar:
-   Standard OpenID Connect flow.
-   Scopes for granular access (e.g., `orders:read`, `subscriptions:write`).
-   Supports both Organization-scoped and User-scoped tokens.

## Integrations
-   **Zapier**: Connect Polar events to 5000+ apps.
-   **Raycast**: Manage Polar from your Mac launcher.
-   **Framer**: Drag-and-drop checkout components.
-   **Affonso**: Affiliate marketing integration.
-   **Fernand**: Customer support integration.
-   **MCP (Model Context Protocol)**: Connect AI agents (Claude, Cursor) to your Polar data for context-aware assistance.
