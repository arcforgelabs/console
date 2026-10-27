# Sign-in test

A real Keycloak 26.8.1 with the `arcforge` theme from this commit signs a new
person in, then lands them on the console demo build. It covers password,
one-time code set-up and sign-in, recovery codes, and passkeys (through
Chromium's virtual authenticator), at desktop and phone width.

This is the release tier of the proof standard (Rule 6). It runs before every
release (`release.yml` calls `sign-in-test.yml`) and by hand from the Actions
tab. Pull request checks do not run it.

## The realm

`realm-arcforge.json` copies the realm in arcforgelabs/platform
`tofu/keycloak/main.tf` (PR #171): login theme, no self sign-up, password
policy, brute-force limits, organisations, required actions (one-time code by
default, passkey, recovery codes) and passkey settings. Differences:

- No SMTP server, and email check off: the test has no mail catcher.
- `sslRequired` is `none` and the passkey relying party is `localhost`.
- A public `console` client with a `localhost:4173` redirect stands in for
  Cloudflare Access, which the test cannot run.
- The `arcforge browser` flow is made in test set-up through the admin API
  (`useArcforgeBrowserFlow` in `keycloak.ts`), because a realm import cannot
  copy a built-in flow.

When `tofu/keycloak` changes, change this file in the same way.

## Run it locally

```sh
pnpm --filter @arcforgelabs/accounts-theme build:jar
docker run -d --name keycloak -p 8089:8080 -p 9000:9000 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=local-test-only \
  -v "$PWD/theme/dist_keycloak/arcforge-keycloak-theme.jar:/opt/keycloak/providers/arcforge-keycloak-theme.jar:ro" \
  -v "$PWD/e2e/realm-arcforge.json:/opt/keycloak/data/import/realm-arcforge.json:ro" \
  quay.io/keycloak/keycloak:26.8.1-0 start-dev --import-realm --health-enabled=true
pnpm exec playwright install chromium
pnpm test:sign-in
```

The test builds the console demo into `dist-e2e/` and serves it on port 4173.
