# Feature checklist

Each thing a customer can do, where it lives, where its data comes from and
which test owns it. Update this table in the same pull request that adds or
changes a feature. Design: arcforgelabs/platform#172. Proof rules:
arcforgelabs/platform `docs/proof-standard.md`.

State:

- **Live:** works in production with real data.
- **Demo:** the page is built and tested with synthetic data. Its data route
  does not exist yet. In production the page says "… is not connected yet".
- **Planned:** not built.

## Sign-in (accounts.arcforge.au, Keycloak theme `arcforge`)

| Feature                              | Page (`theme/src/login/`)                | Owner test                                                   | State |
| ------------------------------------ | ---------------------------------------- | ------------------------------------------------------------ | ----- |
| Sign in with password                | Keycloakify `Login` + `Template.tsx`     | `e2e/sign-in.spec.ts`                                        | Live¹ |
| Set up a one-time code (first time)  | `pages/LoginConfigTotp.tsx`              | `e2e/sign-in.spec.ts` (wrong code refused, right code works) | Live¹ |
| Sign in with a one-time code         | `pages/LoginOtp.tsx`                     | `e2e/sign-in.spec.ts`                                        | Live¹ |
| Save recovery codes                  | `pages/LoginRecoveryAuthnCodeConfig.tsx` | `e2e/sign-in.spec.ts`                                        | Live¹ |
| Sign in with a recovery code         | `pages/LoginRecoveryAuthnCodeInput.tsx`  | `e2e/sign-in.spec.ts`                                        | Live¹ |
| Add a passkey                        | `pages/WebauthnRegister.tsx`             | `e2e/passkey.spec.ts`                                        | Live¹ |
| Sign in with a passkey               | Keycloakify `Login` (passkey autofill)   | `e2e/passkey.spec.ts`                                        | Live¹ |
| Land on the console after sign-in    | console `/`                              | `e2e/sign-in.spec.ts`, `e2e/passkey.spec.ts`                 | Live¹ |
| Reset a forgotten password           | `pages/LoginResetPassword.tsx`           | none yet: needs a mail catcher in the test                   | Live¹ |
| Check email                          | `pages/LoginVerifyEmail.tsx`             | none yet: needs a mail catcher in the test                   | Live¹ |
| Choose an organisation               | `pages/SelectOrganization.tsx`           | none yet: needs an organisation in the test realm            | Live¹ |
| Account pages (profile, sessions)    | Keycloak's own account console           | none                                                         | Planned (own theme) |

¹ Live once `prod-keycloak` runs with this theme (arcforgelabs/platform#171).
The sign-in tests run on a real Keycloak 26.8.1 with a realm that copies
`tofu/keycloak` (see `e2e/README.md`).

## Console (console.arcforge.au)

| Feature                                | Page and route                  | Data route (Worker)            | Owner test                                         | State |
| -------------------------------------- | ------------------------------- | ------------------------------ | -------------------------------------------------- | ----- |
| Only signed-in people get data         | every `/api/*`                  | Access token check             | `worker/access.test.ts`, `worker/index.test.ts`    | Live  |
| Pages block framing and outside scripts | every path                     | Security headers (CSP)         | `worker/index.test.ts`                             | Live  |
| See and open my claws                  | Claws, `/`                      | `/api/me/claws` (KV `claws`)   | `worker/claws.test.ts`, `src/features/claws/index.test.tsx` | Live  |
| See my apps and care plans             | Apps, `/apps`                   | `/api/apps` (Stripe)           | `src/features/apps/index.test.tsx`                 | Demo  |
| Start or change a care plan            | Apps, `/apps` → Details         | Stripe checkout                | none                                               | Planned |
| See support requests and progress      | Support, `/support`             | `/api/support` (support relay) | `src/features/support/index.test.tsx`              | Demo  |
| Open a new support request, add a note | Support, `/support`             | support relay                  | none                                               | Planned |
| See seats and who opens which claw     | Team, `/team`                   | `/api/team` (Keycloak organisations) | `src/features/team/index.test.tsx`           | Demo  |
| Invite people, save claw access        | Team, `/team`                   | Keycloak admin, console client | none                                               | Planned |
| See model use against the plan         | Usage, `/usage`                 | `/api/usage` (ClawRouter)      | `src/features/usage/index.test.tsx`                | Demo  |
| See plan, invoices; manage billing     | Billing, `/billing`             | `/api/billing` (Stripe portal) | `src/features/billing/index.test.tsx`              | Demo  |
| Choose how claws reach models          | Billing, `/billing` → Model settings | not decided               | none                                               | Planned |
| "Not connected yet" for a missing route | every Demo page                | 404 from the Worker            | `src/components/page.test.tsx`                     | Live  |
| Change theme and font on this device   | Appearance, `/settings/appearance` | none (browser only)         | none                                               | Live  |
| Sign out                               | profile menu                    | `/cdn-cgi/access/logout`       | none                                               | Live  |
