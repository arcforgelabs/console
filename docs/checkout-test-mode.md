# Test checkout slice — console#44

Source only. No provider resources, real catalogue, price, D1, queue or deployment
have been activated. Related platform work: #814, #815, #818.

## Ownership and public boundary

The existing Worker serves public /buy, /buy/status, /checkout/* and
/webhooks/stripe. Every /api/* route keeps its existing Cloudflare Access checks.
Only the two buy pages allow the Turnstile script/frame in CSP. Platform must
separately configure Access bypass for these exact public paths, not /api/*.

Official Stripe SDK, sk_test_ keys only. Live keys/events/prices are rejected.
CHECKOUT_CATALOGUE is server-owned JSON of {sku,label,price_id}; absent means [].
No real SKU or price is included. Browser input selects a SKU, never a price,
tenant or owner. Stripe Checkout displays the provider price before payment.

POST /checkout/orders verifies exact Origin, native rate limiter and server-side
Turnstile hostname + action=checkout. It writes a D1 order with immutable price
and origin and a hashed random capability before any Stripe creation. The
Secure/HttpOnly/SameSite=Strict host-only cookie grants status/session access.
The browser then navigates to status; Continue this checkout creates or resumes
the Stripe session. Two steps intentionally retain a recovery page before any
uncertain provider effect. The return URL carries no payment authority.

Session creation uses checkout-v1-ORDER_UUID. All effect parameters are pinned.
Retry uses the same order/key, including after a lost response. Uncertain orders
older than 23 hours fail closed before Stripe can prune its 24-hour key. No
automatic new purchase follows an error. One browser cookie retains one current
order; clearing/replacing it loses self-service access (support recovery is not
implemented). Catalogue changes never change an existing order's price.

Status re-fetches current Checkout session, subscription and latest invoice,
checks test mode/order/price, and reports pending, failure or payment confirmed.
Payment confirmed never means provisioned. Asynchronous events cannot overwrite
current Stripe facts. No polling is hidden; Refresh is a real provider re-check.

## Provisional backend contract — NOT build authority

The producer uses the single platform provisioning queue, not a new provisioner:

    {schema_version:1, source:'stripe', event_id, subscription_id, order_id}

Backend owner agreement is pending. This reference is an untrusted wake-up hint.
The backend MUST re-fetch the current Stripe event/invoice/subscription, verify
test mode, current payment/entitlement, the durable order/catalogue and trusted
tenant/owner binding, then use durable effect idempotency before provisioning.
Checkout metadata and a paid email are NOT tenant authority. There is deliberately
no tenant authority field or backend implementation in this repository. Backend
needs an agreed read path to the durable order and trusted owner-binding policy
before activation. Do not provision while that contract remains unresolved.

Supported events: checkout.session.completed, async_payment_succeeded,
async_payment_failed; invoice.paid, invoice.payment_failed;
customer.subscription.updated/deleted. Raw UTF-8 bodies are bounded to 256 KiB
and verified with the SDK (300s tolerance); event IDs deduplicate. D1 batch commits
the event receipt and outbox atomically. A send precedes marking sent_at; crashes
may duplicate delivery, never justify duplicate backend effects. No event ordering
assumption is made. Unknown event types are acknowledged without provisioning.

Webhook retries and the Worker's scheduled handler drain unsent rows through the
SAME queue (50 per invocation). Platform must configure a frequent cron and an
alert for backlog/drain errors; there is no public replay/admin endpoint. Durable
receipt/outbox retention and support reconciliation are activation decisions.

## Activation gates (separate Deploy records)

- No actual Stripe sandbox acceptance: no key is available. Wire-stub runtime
  tests are not a sandbox acceptance receipt.
- Configure CHECKOUT_DB; apply worker/migrations/0001_checkout.sql. Configure
  PROVISIONING_QUEUE to the existing backend queue and a retry cron. No bindings
  or cron are added to local/release wrangler.jsonc by this source change.
- Configure CHECKOUT_ORIGIN (exact HTTPS origin), CHECKOUT_LIMITER (native binding),
  TURNSTILE_SITE_KEY and secret TURNSTILE_SECRET_KEY, secret STRIPE_SECRET_KEY
  (test only) and STRIPE_WEBHOOK_SECRET. Missing protection fails closed.
- Backend independently proves current-fact validation, trusted owner binding,
  durable effect idempotency, async payment and replay handling on that queue.
- First TEST catalogue/price and first webhook endpoint require separate Deploy
  approvals/proof. Register only supported event types with this SDK's API version.
- LIVE mode is not supported by this code and needs a separate design/approval,
  implementation and Deploy gate. No flag silently enables it.
- Existing-customer portal, account linkage, resize and destroy remain deferred
  until trusted owner binding is available. This slice does not modify them.
