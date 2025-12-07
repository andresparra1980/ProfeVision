# Usage Based Billing

Polar supports sophisticated usage-based billing models built on an event-driven architecture.

## How it Works
1.  **Ingest Events**: Send usage events (e.g., `api_call`, `storage_gb`) to Polar via API.
2.  **Meters**: Define how events are aggregated (Sum, Count, Unique, Max, etc.) to calculate usage.
3.  **Bill**: Attach meters to products to charge based on usage.

## Ingestion Strategies
Polar provides SDK helpers for common patterns:
-   **LLM Strategy**: Automatically track token usage from OpenAI/AI SDKs.
-   **S3 Strategy**: Track bytes uploaded/downloaded.
-   **Delta Time**: Track execution duration.
-   **Stream**: Track data throughput.

## Pricing Models
-   **Metered Pricing**: Charge per unit (e.g., $0.01 per API call).
-   **Fixed + Metered**: Base subscription fee + overage charges.
-   **Capped**: Set a maximum spend limit.

## Credits System
-   **Pre-paid Usage**: Allow customers to buy credits (e.g., $50 for 50k tokens) upfront.
-   **Drawdown**: Usage events deduct from the credit balance first.
-   **Overage**: Once credits are exhausted, the meter can fallback to on-demand billing or stop service.
-   **Granting Credits**:
    -   *Via Benefit*: Auto-grant recurring or one-time credits on purchase.
    -   *Via API*: Programmatically grant credits (e.g., for referrals or signup bonuses).

## Customer View
Customers can view their real-time usage and remaining balance in the Customer Portal.
