# Benefits and Entitlements

Polar automates the delivery of benefits upon purchase. Benefits are separate resources linked to products.

## Supported Benefit Types

### 1. License Keys
-   **Features**: Brandable prefixes, expiration dates, activation limits (seats), and usage quotas (e.g., AI tokens).
-   **Validation API**: Endpoints to validate, activate, and deactivate keys from your application.

### 2. File Downloads
-   **Capacity**: Up to 10GB per file.
-   **Security**: Signed, expiring download URLs. SHA-256 checksums available.
-   **Updates**: Customers get access to updated files if you add them later.

### 3. GitHub Repository Access
-   **Mechanism**: Automatically invites customers as collaborators to private GitHub repositories.
-   **Roles**: Configurable permission levels (Read, Triage, Write, etc.).
-   **Revocation**: Access is automatically removed if a subscription is cancelled or expires.

### 4. Discord Access
-   **Mechanism**: Invites users to a Discord server and assigns specific roles.
-   **Revocation**: Roles/access removed upon cancellation.

### 5. Credits (Usage Meter)
-   **Mechanism**: Credits a customer's usage balance.
-   **Use Case**: Pre-paid usage billing (e.g., buy 10,000 tokens).

### 6. Custom Benefit
-   **Mechanism**: Display a private note or link (Markdown supported) to the customer after purchase.
-   **Use Case**: Private Telegram links, Cal.com booking links, secret messages.

## Management

-   **Granularity**: Benefits can be shared across multiple products.
-   **Lifecycle**: Granted immediately on purchase. Revoked automatically for expired/cancelled subscriptions (where applicable).
-   **Post-Purchase**: Customers access benefits via the Customer Portal or email.
