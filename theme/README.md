# Arc Forge sign-in theme

The Keycloak login theme `arcforge` for `accounts.arcforge.au`. It uses
[Keycloakify](https://www.keycloakify.dev) (MIT) and the same Arc Forge
tokens as the console (`../src/styles/theme.css`).

Every page keeps Keycloakify's own page logic, so the realm features work:
organisation identity-first login, passkeys, two-step setup (TOTP), passkey
registration, email check and password reset. `src/login/Template.tsx` gives
the frame, and `src/login/KcPage.tsx` maps Keycloak's class names to
Tailwind classes. Keycloak's default CSS is off.

## Run it

```sh
pnpm dev                    # mock data: open /?page=login.ftl
pnpm build:jar              # dist_keycloak/arcforge-keycloak-theme.jar
```

`build:jar` needs Java and Maven. The JAR is for Keycloak 26 and later.

## Deploy

The console release attaches `arcforge-keycloak-theme-<version>.jar` and
its `.sha256` file. The platform repo (Keycloak role) downloads the pinned
JAR, checks the hash, mounts it in `/opt/keycloak/providers` and sets the
realm's login theme to `arcforge`.
