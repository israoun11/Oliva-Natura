# Payments
**Working now:** Cash on Delivery (Tunisia only; can be switched off in Admin > Settings > Payments). Orders are created `UNPAID`/`PENDING`. When an admin marks a COD order *Delivered*, the payment is marked `PAID` (cash collected). No online payment is ever marked paid by the browser.

**Not integrated (needs your merchant account + credentials):** any card / local-bank provider. No provider has been chosen and eligibility for a Tunisian business has not been verified.

## Adding a provider later
1. Implement `PaymentProvider` (`apps/api/src/lib/payments.ts`): `isConfigured()` (reads env vars) and `handleWebhook()` which MUST verify the provider's signature on the raw body, then return `{orderNumber, paid}`.
2. Register it in `providers`, add a `PaymentMethod` value if needed, and allow it in the `paymentMethod` enum of `routes/orders.ts`.
3. Add `POST /api/payments/webhook/:provider` using `express.raw()`; on verified success update `Payment.status`, `Order.paymentStatus = PAID` in one transaction, idempotently (use `Payment.providerRef` unique).
4. Create orders as `PENDING` and only mark `PAID` from the webhook. Use the provider's sandbox for testing.
