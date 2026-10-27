import { expect, test } from '@playwright/test'
import {
  CONSOLE,
  createUser,
  signInUrl,
  totp,
  useArcforgeBrowserFlow,
} from './keycloak'

// A passkey made on first sign-in then signs the person in with no password.
// Chromium's virtual authenticator stands in for a phone or laptop: it
// answers the real WebAuthn calls with a real key pair.

test.beforeAll(useArcforgeBrowserFlow)

test('add a passkey, then sign in with it', async ({ page, browser }) => {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('WebAuthn.enable')
  const { authenticatorId } = await cdp.send(
    'WebAuthn.addVirtualAuthenticator',
    {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
      },
    }
  )
  const user = await createUser([
    'CONFIGURE_TOTP',
    'webauthn-register-passwordless',
  ])

  await page.goto(signInUrl())
  await page.getByLabel('Username or email').fill(user.username)
  await page.getByLabel('Password', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.getByText("Can't scan? Use a setup key").click()
  const key = (await page.locator('#kc-totp-secret-key').innerText()).trim()
  await page.getByLabel('Code from the app').fill(totp(key))
  await page.getByRole('button', { name: 'Verify' }).click()

  await expect(
    page.getByRole('heading', { name: 'Add a passkey' })
  ).toBeVisible()
  await page.getByRole('button', { name: 'Add a passkey' }).click()
  await page.waitForURL((u) => u.href.startsWith(CONSOLE))
  const { credentials } = await cdp.send('WebAuthn.getCredentials', {
    authenticatorId,
  })
  expect(credentials).toHaveLength(1)

  // Signed out: a new browser that holds the same authenticator.
  const context = await browser.newContext(test.info().project.use)
  const p = await context.newPage()
  const cdp2 = await context.newCDPSession(p)
  await cdp2.send('WebAuthn.enable')
  const second = await cdp2.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
    },
  })
  await cdp2.send('WebAuthn.addCredential', {
    authenticatorId: second.authenticatorId,
    credential: credentials[0],
  })
  // The sign-in page asks the browser for a passkey as soon as it opens
  // (passkey autofill). The authenticator answers, so no click is needed.
  await p.goto(signInUrl())
  await p.waitForURL((u) => u.href.startsWith(CONSOLE))
  await expect(p.getByRole('heading', { name: /^Claws/ })).toBeVisible()
})
