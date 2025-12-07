# Checkout Integration

Polar offers three main ways to integrate checkout flows:

## 1. Checkout Links (No-Code)

The simplest way to sell. Create a link in the dashboard and share it.
-   **Features**: Handles product selection, variants, and discounts.
-   **Usage**: Share via email, social media, or simple website buttons.
-   **Configuration**: Can prefill customer email, name, discount codes, and custom field data via query parameters.

## 2. Embedded Checkout

Integrate the checkout form directly into your website so customers never leave your domain.
-   **Implementation**: A simple HTML snippet or React component.
-   **Wallets**: Apple Pay and Google Pay supported (requires domain validation for embedded).
-   **Customization**: Supports light/dark themes.

## 3. Checkout API

For complete control over the checkout experience.
-   **Ad-hoc Pricing**: Create dynamic prices on the fly that aren't in your catalog.
-   **Multiple Products**: Allow customers to purchase multiple items in one session.
-   **Metadata**: Pass custom metadata to track orders.
-   **Redirects**: Configure success and cancel URLs.

## Custom Fields

Add custom inputs to your checkout flow to collect extra information.
-   **Types**: Text, Number, Date, Checkbox (e.g., for Terms of Service), Select.
-   **Validation**: Required fields, min/max length, etc.
-   **Data Access**: Available in Order and Subscription objects and webhooks.

## Variants

Polar handles variants by allowing you to create multiple separate products (e.g., "Basic", "Pro") and grouping them or presenting them together. You can create a checkout session that allows the user to switch between these "variants".

## Advanced Guides

-   **Theme Switching**: Pass `?theme=dark` or `?theme=light` to checkout URLs.
-   **Ordering Products**: Control the display order of products in a checkout via the API `products` array order.
-   **Disable Email Editing**: Pass `customer_id` or `external_customer_id` when creating a session to lock the email field for authenticated users.
