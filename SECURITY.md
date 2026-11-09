# Security

Report a vulnerability through GitHub private vulnerability reporting on this
repo (Security tab, "Report a vulnerability"). Do not open a public issue.

Scope: the console UI and the Worker in `worker/`. The Worker must reject any
`/api/*` request without a valid Cloudflare Access token.

The public test checkout uses `/checkout/*` and `/webhooks/stripe` outside that
API boundary. It requires test-only Stripe credentials, server-owned catalogue,
Origin/Turnstile/rate-limit checks, capability-protected status and signed raw
webhooks. See [the checkout activation gates](docs/checkout-test-mode.md).
