# Arc Forge Console

The customer console for Arc Forge. A customer signs in once and sees every
claw (OpenClaw gateway) they can use, as cards.

Address: `console.arcforge.au`. Account pages live at `accounts.arcforge.au`
(the self-hosted Keycloak sign-in service).

## How sign-in works

```
browser ──► Cloudflare Access ──► console Worker (this repo)
               │  (Keycloak is the sign-in provider)
               └─ one Access session also opens each claw
```

1. Cloudflare Access sits in front of the console and every claw.
2. Access signs the person in with Keycloak. The Access session is shared, so
   the person signs in once.
3. The Worker checks the `Cf-Access-Jwt-Assertion` token (issuer, audience,
   RS256 key from `<team>/cdn-cgi/access/certs`) on every `/api/*` call.
4. The Worker reads the claw list from KV and returns only the claws that
   match the person's email or email domain.

The Worker never trusts a header without checking the token.

## Layout

| Path             | What it holds                                                           |
| ---------------- | ----------------------------------------------------------------------- |
| `src/`           | React app (shadcn/ui, TanStack Router, Tailwind 4)                      |
| `worker/`        | Cloudflare Worker: Access check, `/api/me`, `/api/me/claws`             |
| `theme/`         | Keycloak sign-in theme for accounts.arcforge.au (see `theme/README.md`) |
| `wrangler.jsonc` | Worker config for local runs (deploy config lives in the platform repo) |

## Run it

```sh
pnpm install
pnpm dev                 # UI only, needs VITE_DEMO=1 for sample data
VITE_DEMO=1 pnpm dev     # UI with synthetic data (no sign-in)
pnpm build && pnpm dev:worker   # Worker + built UI on wrangler dev
```

Checks:

```sh
pnpm lint && pnpm format:check
pnpm test:worker
pnpm test:browser:install && pnpm test:ui
pnpm build && pnpm build:worker
```

## Deploy contract

The platform repo (`arcforgelabs/platform`, stack `tofu/console`) deploys a
pinned commit of this repo. It owns the Access app, the KV namespace and all
secrets. This repo holds no secrets and no customer data.

| Item          | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Build command | `pnpm install --frozen-lockfile && pnpm build && pnpm build:worker`        |
| Static assets | `./dist`                                                                   |
| Worker bundle | `dist-worker/index.js`                                                     |
| Worker name   | `arcforge-console`                                                         |
| KV binding    | `CLAWS`, key `claws`: JSON array of claw records                           |
| Vars          | `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `ACCOUNTS_URL` (optional)              |
| Routing       | `/api/*` runs the Worker first; other paths serve assets with SPA fallback |

Release: push a tag `vX.Y.Z`. The Release workflow builds that commit on a
GitHub-hosted runner and attaches `arcforge-console-vX.Y.Z.tar.gz` (holds
`dist/` and `dist-worker/`) and its `.sha256` file to the GitHub release.
It also attaches `arcforge-keycloak-theme-vX.Y.Z.jar` (the sign-in theme)
and its `.sha256` file. The platform repo pins the tag and the hashes. The
deploy host never runs pnpm.

Claw record:

```json
{
  "name": "acme-main",
  "label": "Acme main claw",
  "hostname": "acme.claw.arcforge.au",
  "emails": ["jordan@acme.example"],
  "email_domains": ["acme.example"],
  "status": "running",
  "version": "2026.10.1"
}
```

## Plan

Design and research: arcforgelabs/platform#172. Next pages: team seats,
usage, app care plans, support tickets, billing (Stripe customer portal).

## Licence

MIT. Started from [shadcn-admin](https://github.com/satnaing/shadcn-admin)
(MIT, Sat Naing). See `LICENSE`.
