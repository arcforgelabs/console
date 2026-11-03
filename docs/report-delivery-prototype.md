# Report delivery: bounded source prototype

Related: console#24. This does not complete that issue.
Merges, deployment and live customer integration are HELD.

## Decision

Recommend a compact native OpenClaw dashboard report (session:report), delivered
only after explicit opt-in and account checks. Use expanded task presentation
when wanted. Do not build a second email service or a report app server.
No price, cap, router, schedule or customer Gateway choice is decided here.

## Options checked against stock installed documentation

| Option | Benefit | Cost and limits |
| --- | --- | --- |
| Chat summary or file | Least machinery; works in a conversation | History can bury reports; file/channel sharing needs controls |
| Native session:report | Recommended: text, metrics, tables, charts, links; no server | Structured data only; up to 24 blocks and 8KB JSON; not an arbitrary HTML site |
| Portal or separate site | A real app can supply richer interaction | Portal proxies a running server; needs authentication, ingress and lifecycle ownership |

References inspected before this source prototype:

- OpenClaw docs/tools/show-widget.md, Native dashboard reports.
- OpenClaw docs/web/dashboards.md, expanded presentation and thread ownership.
- OpenClaw docs/gateway/portals.md, server, bearer and ingress contracts.

The current tool catalog supports dashboard widget_put with session:report and
structured props. Custom HTML authoring is unavailable in this task. A portal
is not a static file viewer by itself. Full task width is a layout option,
not permission to inject arbitrary full-bleed HTML into a dashboard.

## Prototype and reproduction

Run VITE_DEMO=1 pnpm dev --host 127.0.0.1. Open /reports, then the sample period.
The actual console renders synthetic data from src/lib/reports-api.ts.
The period page exposes the candidate native report JSON behind Native report
payload. Its console renderer is a mock, not the stock Gateway renderer.
The opt-in switch starts off, updates only the local query cache and resets on
reload. It performs no delivery or schedule setup. No extra server is required.

The browser regression owner is e2e/demo-reports.browser.ts. Run
pnpm test:demo-reports. It crosses the normal query freshness boundary before
navigation and checks consent retention, reload reset and zero network writes.
The initial seeded UI test missed refetch resets; the real browser test failed
on commit 2098f2f before the demo-only freshness fix. The shared page query
client now owns freshness and retention for every editable demo preview.
Reports uses that owner, without its former per-feature freshness override.
The unseeded e2e/demo-state.browser.ts also crosses real 11.5-second waits for
invites, support and model settings. Run pnpm test:demo-state.

## Security and tenant boundaries

- Synthetic, public-safe report data only. No patient, customer or secret data.
- The console demo owns no customer identity or Gateway mapping.
- A dashboard/session is not an account or tenant authorization boundary.
- A future producer must select an account from verified identity, check report
  membership and explicit consent, and send only to that account's authorized
  Gateway/session. Do not trust a browser-supplied account or period alone.
- Future report payloads must remain plain structured data, with no executable
  actions, HTML, scripts, network reads or credentials. Enforce the stock limits
  before delivery. This prototype does not add that production service.
- Existing Worker Access protection is unchanged. No backend route is added.
- No R2, email, scheduler, portal listener, ingress, config or customer write.

## Evidence limits

Screenshots show the real local console with synthetic data. They do not prove
native customer-frame rendering, real opt-in storage, delivery, account isolation
or revocation. Those require an approved integration step. Native render and
expanded presentation remain unverified in this task; no Gateway widget was
created, and no customer session was accessed.

Subscription cards, email choices, protected report storage and account mapping
remain in console#24. This source slice is related progress only.
