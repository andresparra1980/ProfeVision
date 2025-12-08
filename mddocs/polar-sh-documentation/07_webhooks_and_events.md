# Webhooks and Events

Webhooks allow your application to react to events in Polar in real-time.

## Setup
-   **Standard Webhooks**: Polar follows the Standard Webhooks specification for security and signatures.
-   **Secret**: Each endpoint has a signing secret. **Always verify signatures** to prevent spoofing.
-   **Retries**: Exponential backoff for failed deliveries (up to 10 retries).

## Key Events

### Billing
-   `checkout.created` / `updated`: Track checkout sessions.
-   `order.created` / `paid`: Triggered when a payment succeeds. **Use `order.paid` for provisioning access.**
-   `subscription.created` / `updated` / `active` / `canceled` / `revoked`: Lifecycle events for subscriptions.
-   `refund.created`: When a refund is issued.

### Customers
-   `customer.created` / `updated` / `deleted`
-   `customer.state_changed`: A high-level event triggered when *anything* significant changes for a customer (subscription, benefit, etc.). Useful for syncing permissions.

### Benefits
-   `benefit_grant.created` / `revoked`: When a user gains or loses access to a specific benefit (e.g., License Key, Discord role).

## Security
-   **IP Allowlist**: Polar publishes its IP ranges for firewalls.
-   **Signature Verification**: SDKs provide helper functions to validate `Webhook-Signature` headers.

## Integrations
-   **Slack/Discord**: Built-in format support to send notifications directly to chat channels.
-   **Zapier**: Trigger Zaps from Polar webhooks.
