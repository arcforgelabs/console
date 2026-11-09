# Bounded checkout review repairs — 2026-11-09

Candidate reviewed: 2eac8351533089e079d1b234a71dfc2b367d6e17.
Independent initial report: checkout-stripe-evidence-20261109/clawsweeper-initial/0.md.
This repair worker did not run independent review, commit, push or deploy.

## Repairs and owner proof

- Active/recurring/test price validation now occurs after Turnstile and before
  durable order INSERT. Session recovery replays the admitted immutable order
  without repeating mutable active-price validation. The 23-hour uncertain-effect
  cutoff, stable idempotency key and live-response refusal remain unchanged.
- The bundled Worker + native D1 test asserts missing, forged and invalidated
  capabilities all return 404 with Order not found and cause **zero Stripe
  requests**, before creation and after synthetic successful creation with lost
  response. Invalidation changes the stored capability hash, not a mocked owner.
- Restricted sandbox keys (rk_test_) work alongside sk_test_. Negative controls
  reject sk_live_, rk_live_, organization, publishable, unknown and empty values
  without provider requests. No real credential is present.
- Admission rejects live, archived and one-time prices without inserting an order.

The archival regression was first run alone against the unchanged candidate
Worker: POST retry returned 503, expected 200, after the synthetic provider had
accepted the original key and D1 still had session_id NULL. It passes after the
repair. The initial all-case red run also showed admission returning 201 instead
of 503; later failures in that run cascaded from the deliberately failed setup.
Use the isolated archival red receipt as the recovery evidence.

External raw receipts (outside repository):
/home/deploy/repos/checkout-stripe-evidence-20261109/

- repair-recovery-red.log: intended original-candidate archival failure.
- repair-red.log: original-candidate admission failure plus cascades (not green).
- repair-worker-final.log: complete repaired Worker suite.
- repair-ui.log: focused checkout UI owner, 3 tests passed.
- repair-browser-final.log: 2 active built-browser flows passed.
- repair-ui-build.log / repair-worker-build.log: UI + TypeScript and Worker dry run.
- repair-lint.log / repair-focused-lint-final.log / repair-format-final.log: checks.
- repair-restricted-isolated-final.log: independent key-prefix/rate-limit control.
- repair-demo-reports.log: demo report browser flow, 1 passed.
- repair-demo-state-{invite,support,model}.log: 3 demo-state scenarios passed
  separately (23.1s, 22.6s, 22.9s). The single combined demo-state process hit
  its 1986 MiB host bound; individual runs avoided it. Initial demo startup also
  hit injected-proxy loopback interception; ordinary local tests used only
  NO_PROXY=127.0.0.1,localhost (and lowercase equivalent), no service changes.

The complete Worker suite passed 4 files / 29 tests. Checkout UI source did not
change: its focused 3 tests passed; the parent already proved all 20 UI files /
73 tests in bounded batches, so this worker did not rerun that memory-heavy suite.

## Maintained browser flow

Run separately (not in a memory-heavy combined suite):

```sh
VITE_DEMO=1 pnpm build
pnpm build:worker
CHECKOUT_EVIDENCE_DIR=docs/evidence/checkout pnpm test:checkout
```

Requires installed Playwright Chromium and openssl. The harness generates a
one-day local HTTPS certificate and serves the actual dist assets through the
ASSETS adapter of the actual bundled Worker in Miniflare/workerd. Native D1 and
rate limiter are used. Browser ignores this local self-signed certificate only;
Secure/HttpOnly/SameSite=Strict cookie semantics remain enabled. TLS retry warnings
from self-signed local connections did not prevent either flow from passing.

The only simulated boundaries are external Turnstile script/Siteverify and Stripe
HTTP/hosted checkout. No production test seam or frontend API mock was added.
Both browser and Worker outbound handlers reject unexpected external traffic.
This is **not Stripe sandbox or real Turnstile acceptance**.

At 1280×900 and 390×900 the real browser selects the synthetic SKU, completes the
synthetic security check, creates an actual D1 order/cookie, navigates to recovery
before any session creation, clicks Continue, observes a lost-response refusal,
reloads pending, refuses all three invalid capabilities with zero provider calls,
then replays the same key after price archival. It follows the Stripe destination,
returns, explicitly refreshes pending then confirmed provider facts and reloads
confirmed. It never says payment confirmation means setup/provisioning.

Artifacts in this directory:

- active-buy-{1280,390}.png: selected synthetic subscription/security check.
- active-pending-{1280,390}.png: actual recovery page after uncertain effect.
- active-confirmed-{1280,390}.png: confirmed payment, no provisioning claim.
- active-trace-{1280,390}.json: redacted ordered wire/browser/authority events.

No keys, capability values, personal data, real payment or non-public destination
are included in those traces. Synthetic IDs are explicitly named synthetic.

## Remaining gates

Actual Stripe sandbox acceptance, including restricted-key dependencies and
expanded invoice/payment-intent permissions; genuine Turnstile token/action/host
and replay acceptance; hosted public-path Access bypass; remote D1/queue/cron,
monitoring and retention; backend current-fact verification, trusted owner binding,
and durable provisioning effect idempotency. All activation needs separate Deploy
approval. Live mode remains unsupported. See ../../checkout-test-mode.md.
