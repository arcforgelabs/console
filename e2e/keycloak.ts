import { createHmac, randomUUID } from 'node:crypto'
import { type Browser, type Page, expect, test } from '@playwright/test'

// Test helpers for a throwaway Keycloak. The admin password is a local test
// value set when the test container starts, never a real credential.
export const KC = process.env.KC_URL ?? 'http://localhost:8089'
const ADMIN_USER = process.env.KC_ADMIN_USER ?? 'admin'
const ADMIN_PASSWORD = process.env.KC_ADMIN_PASSWORD ?? 'local-test-only'
export const CONSOLE = 'http://localhost:4173/'

async function adminToken() {
  const res = await fetch(
    `${KC}/realms/master/protocol/openid-connect/token`,
    {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: ADMIN_USER,
        password: ADMIN_PASSWORD,
      }),
    }
  )
  if (!res.ok) throw new Error(`admin token: ${res.status}`)
  return ((await res.json()) as { access_token: string }).access_token
}

async function admin(path: string, init: RequestInit = {}) {
  const res = await fetch(`${KC}/admin/realms/arcforge${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${await adminToken()}`,
      'content-type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path}: ${res.status}`)
  return res
}

type Execution = {
  id: string
  providerId?: string
  requirement: string
  level: number
  authenticationConfig?: string
}

// tofu/keycloak (platform PR #171) binds its own "arcforge browser" flow: a
// copy of the built-in browser flow where the second step offers the
// one-time code, a passkey and a recovery code, each as an alternative. The
// second step starts with a credential check (passkey not used), so a passkey
// sign-in skips it. A realm import cannot copy a built-in flow, so the test
// makes the same flow through the admin API and binds it.
export async function useArcforgeBrowserFlow() {
  const name = 'arcforge browser'
  const flows = (await (await admin('/authentication/flows')).json()) as {
    alias: string
  }[]
  if (!flows.some((f) => f.alias === name)) {
    await admin('/authentication/flows/browser/copy', {
      method: 'POST',
      body: JSON.stringify({ newName: name }),
    })
  }
  const path = `/authentication/flows/${encodeURIComponent(name)}/executions`
  const all = (await (await admin(path)).json()) as Execution[]
  const second = [
    'auth-otp-form',
    'webauthn-authenticator',
    'auth-recovery-authn-code-form',
  ]
  for (const e of all.filter((e) => second.includes(e.providerId ?? ''))) {
    if (e.requirement === 'ALTERNATIVE') continue
    await admin(path, {
      method: 'PUT',
      body: JSON.stringify({ ...e, requirement: 'ALTERNATIVE' }),
    })
  }
  const check = all.find((e) => e.providerId === 'conditional-credential')
  if (!check?.authenticationConfig)
    throw new Error('second step has no credential check')
  await admin(`/authentication/config/${check.authenticationConfig}`, {
    method: 'PUT',
    body: JSON.stringify({
      alias: 'arcforge-not-passkey',
      config: { credentials: 'webauthn-passwordless', included: 'false' },
    }),
  })
  await admin('', { method: 'PUT', body: JSON.stringify({ browserFlow: name }) })
}

export type TestUser = { username: string; password: string }

// A new person for each test, as Arc Forge makes them: no self sign-up.
export async function createUser(
  requiredActions: string[],
  { emailVerified = true } = {}
): Promise<TestUser> {
  const username = `e2e-${randomUUID().slice(0, 8)}`
  const password = `pw-${randomUUID()}`
  const res = await admin('/users', {
    method: 'POST',
    body: JSON.stringify({
      username,
      email: `${username}@example.test`,
      emailVerified,
      firstName: 'Test',
      lastName: 'Person',
      enabled: true,
      requiredActions,
      credentials: [{ type: 'password', value: password, temporary: false }],
    }),
  })
  // Keycloak adds the realm's default actions (the one-time code set-up) to
  // a new person. Set exactly the actions this test asks for.
  const id = res.headers.get('location')?.split('/').pop()
  await admin(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ requiredActions }),
  })
  return { username, password }
}

// The person's credentials of one type (for example webauthn-passwordless).
export async function credentials(username: string, type: string) {
  const [user] = (await (
    await admin(`/users?exact=true&username=${username}`)
  ).json()) as { id: string }[]
  const all = (await (
    await admin(`/users/${user.id}/credentials`)
  ).json()) as { type: string; userLabel?: string }[]
  return all.filter((c) => c.type === type)
}

// The console's sign-in request, as the console client in tofu/keycloak
// makes it (authorisation code with PKCE). kcAction asks Keycloak for one
// account step after sign-in, as an app does (application-initiated action).
export function signInUrl(kcAction?: string) {
  const q = new URLSearchParams({
    client_id: 'console',
    response_type: 'code',
    scope: 'openid',
    redirect_uri: CONSOLE,
    code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    code_challenge_method: 'S256',
  })
  if (kcAction) q.set('kc_action', kcAction)
  return `${KC}/realms/arcforge/protocol/openid-connect/auth?${q}`
}

// The sign-in ended on the console with a one-time code and no error:
// proof that Keycloak signed the person in for the console client, not only
// that the demo page loaded.
export async function expectConsole(page: Page) {
  await page.waitForURL((u) => u.href.startsWith(CONSOLE))
  await expect(page.getByRole('heading', { name: /^Claws/ })).toBeVisible()
  const params = new URL(page.url()).searchParams
  expect(params.get('error')).toBeNull()
  expect(params.get('code')).toBeTruthy()
}

export async function password(
  page: Page,
  username: string,
  pw: string,
  kcAction?: string
) {
  await page.goto(signInUrl(kcAction))
  await expect(
    page.getByRole('heading', { name: 'Sign in to Arc Forge' })
  ).toBeVisible()
  await page.getByLabel('Username or email').fill(username)
  await page.getByLabel('Password', { exact: true }).fill(pw)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}

// A new browser with no cookies: the person has signed out.
export async function freshPage(browser: Browser) {
  const context = await browser.newContext(test.info().project.use)
  return context.newPage()
}

function base32(s: string) {
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  for (const c of s.replace(/[\s=]/g, '').toUpperCase())
    bits += abc.indexOf(c).toString(2).padStart(5, '0')
  const out: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8)
    out.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(out)
}

// RFC 6238 code, as an authenticator app makes it from the setup key.
export function totp(key: string, now = Date.now()) {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30_000)))
  const h = createHmac('sha1', base32(key)).update(counter).digest()
  const o = h[19] & 15
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, '0')
}
