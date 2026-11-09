# Checkout source proof — 2026-11-09

Branch: arc/stripe-checkout-44. Initial candidate:
2eac8351533089e079d1b234a71dfc2b367d6e17 (base
8ef6f0f3586a9a04dfc25abe7e8241ffd3482762). Review repairs below are uncommitted;
no commit, push, deployment or provider write was performed by the repair worker.

The [bounded review-repair proof](review-repairs.md) supersedes the initial
missing active-browser evidence below and records the archival/capability/key repairs.

## Initial candidate checks

- pnpm lint
- pnpm format:check
- pnpm test:worker: 4 files, 28 tests (6 new checkout boundary cases).
- All 20 UI test files, 73 tests: two bounded batches of 10 files using
  pnpm exec vitest run --project ui --browser.headless --maxWorkers=1 FILES.
  The unbounded default and one later whole-suite attempt exceeded the host's
  memory limit; both bounded batches passed against the final UI source.
- pnpm build (includes all TypeScript project checks).
- pnpm build:worker (Wrangler dry run only).
- git diff --check.

The checkout suite bundles the actual Worker, runs it in workerd/Miniflare with
real D1, native rate limiting and one native Queue, and intercepts outbound
Stripe/Turnstile HTTP at the wire boundary. It verifies durable intent before
Stripe, lost-response idempotency, old-key refusal, live key/price/event refusal,
Origin/Turnstile/client-authority guards, capability status, current async payment
facts, raw whitespace-bearing signatures/body bounds, D1 transaction rollback,
deduplication and native scheduled replay after send/ack loss. Duplicate queue
delivery is expected and proved, not represented as exactly-once provisioning.

Miniflare 4.20260730.0 could not run the repository's 2026-10-01 compatibility
date (runtime maximum 2026-08-06). The proof dependency now exactly matches the
already installed Wrangler dependency: Miniflare 5.20261019.2-beta, using its
supported V4 options converter. No compatibility date or production binding was
changed. Existing Wrangler/workers-types peer and Vite native-config warnings
remain; neither prevented TypeScript checks, tests or builds.

## Red on base

An isolated bundle of the three original Worker source files at the base SHA,
with the same assets fixture, returned HTTP 200 for a disallowed-Origin
POST /checkout/orders. The new boundary assertion expected 403 and failed
(200 !== 403), as intended: checkout did not exist on the base. That assertion
passes in the current real-Worker suite. The whole new suite was not rerun on
the base, because later cases require a successfully created order.

## Visual proof

Screenshots are the actual built app served by local wrangler dev --local,
not a drawn mock or a live customer. Catalogue is the real empty default and
status correctly reports unavailable configuration. No provider key or data was
used. Both pages were checked at 1280×900 and 390×900, light and dark, with no
horizontal overflow; the images are in this directory:

- buy-{1280,390}-{light,dark}.png
- buy-status-{1280,390}-{light,dark}.png

The local preview was stopped after capture.

## Deliberate gaps

No actual Stripe sandbox acceptance (key absent), real Turnstile token/replay
acceptance, hosted Access-bypass proof, remote D1/queue configuration, backend
provisioning acceptance, or live-mode support. No independent review was run
inside this worker (nested delegation was prohibited). The provisional queue
reference and separate activation/Deploy gates are in
[checkout-test-mode.md](../../checkout-test-mode.md).
