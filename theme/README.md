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

## Email theme

The same JAR holds the `arcforge` email theme (`src/email/`, plain Keycloak
FreeMarker, parent `base`). Design approved by Samuel on 2 November 2026
(arcforgelabs/platform#575).

- `email-src/layout.mjml` is the layout. `email-src/build` compiles it with
  MJML 4.15.3 into `src/email/html/template.ftl`. Do not edit that file by
  hand; change the MJML and run the build.
- `html/executeActions.ftl`, `password-reset.ftl` and `email-verification.ftl`
  give a title, one line and one button. Every other Keycloak email keeps its
  base text inside the same layout.
- `messages/messages_en.properties` holds the plain words, the subjects and
  the plain-text versions.
- The logo is `resources/img/logo.png`, served by Keycloak at
  `${url.resourcesUrl}/img/logo.png` (Gmail does not show SVG).
- No open or click tracking.

To use it, a realm sets `email_theme = "arcforge"` (platform `tofu/keycloak`).

## Deploy

The console release attaches `arcforge-keycloak-theme-<version>.jar` and
its `.sha256` file. The platform repo (Keycloak role) downloads the pinned
JAR, checks the hash, mounts it in `/opt/keycloak/providers` and sets the
realm's login theme to `arcforge`.
