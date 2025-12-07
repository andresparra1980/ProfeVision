# Customer Management

Polar provides comprehensive tools to manage your customers and their lifecycle.

## Customer Portal
A self-service portal for your customers to:
-   View active subscriptions and order history.
-   Download receipts and invoices.
-   Access benefits (License keys, downloads, etc.).
-   Manage payment methods and subscription plans (Upgrade/Downgrade/Cancel).
-   **Authentication**: Passwordless email login (Magic Link).

## Customer Data
-   **External ID**: Map Polar customers to your internal database IDs for easy reconciliation.
-   **Metadata**: Store custom JSON data on customer records.
-   **Customer State**: A powerful API concept that aggregates a customer's active subscriptions, granted benefits, and meter balances in a single call.

## Subscription Management
-   **Upgrades/Downgrades**: Customers can change plans. You can control proration behavior (invoice immediately vs. next cycle).
-   **Cancellation**:
    -   *End of Period*: Access remains until the billing cycle ends (Default).
    -   *Immediate*: Access and billing stop immediately.
-   **Preventing Changes**: You can disable self-service plan changes in the dashboard settings.

## Customer Session
For seamless integration, you can generate a **Customer Session** token via the API to authenticate a user directly into the Customer Portal or embedded customer views without them needing to log in again.
