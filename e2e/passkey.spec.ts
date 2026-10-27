import {
  type BrowserContext,
  type Page,
  expect,
  test,
} from '@playwright/test'
import {
  createUser,
  credentials,
  expectConsole,
  password,
  signInUrl,
  totp,
  useArcforgeBrowserFlow,
} from './keycloak'

// A passkey made on first sign-in then signs the person in with no password,
// and a second device adds its own passkey. Chromium's virtual
// authenticator stands in for a phone or laptop: it answers the real
// WebAuthn calls with a real key pair.

test.beforeAll(useArcforgeBrowserFlow)

async function authenticator(context: BrowserContext, page: Page) {
  const cdp = await context.newCDPSession(page)
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
  return { cdp, authenticatorId }
}

test('add a passkey, sign in with it, add a second one', async ({
  page,
  browser,
}) => {
  const first = await authenticator(page.context(), page)
  const user = await createUser([
    'CONFIGURE_TOTP',
    'webauthn-register-passwordless',
  ])
  let key = ''

  await test.step('first sign-in adds a passkey', async () => {
    await password(page, user.username, user.password)
    await page.getByText("Can't scan? Use a setup key").click()
    key = (await page.locator('#kc-totp-secret-key').innerText()).trim()
    await page.getByLabel('Code from the app').fill(totp(key))
    await page.getByRole('button', { name: 'Verify' }).click()

    await expect(
      page.getByRole('heading', { name: 'Add a passkey' })
    ).toBeVisible()
    await page.getByRole('button', { name: 'Add a passkey' }).click()
    await expectConsole(page)
    expect(await credentials(user.username, 'webauthn-passwordless')).toHaveLength(1)
  })

  await test.step('the passkey signs in with no password', async () => {
    const { credentials: keys } = await first.cdp.send(
      'WebAuthn.getCredentials',
      { authenticatorId: first.authenticatorId }
    )
    // Signed out: a new browser that holds the same authenticator.
    const context = await browser.newContext(test.info().project.use)
    const p = await context.newPage()
    const same = await authenticator(context, p)
    await same.cdp.send('WebAuthn.addCredential', {
      authenticatorId: same.authenticatorId,
      credential: keys[0],
    })
    // The sign-in page asks the browser for a passkey as soon as it opens
    // (passkey autofill). The authenticator answers, so no click is needed,
    // and a passkey sign-in skips the one-time code.
    await p.goto(signInUrl())
    await expectConsole(p)
  })

  await test.step('a second device adds its own passkey', async () => {
    const context = await browser.newContext(test.info().project.use)
    const p = await context.newPage()
    await authenticator(context, p)
    await password(p, user.username, user.password, 'webauthn-register-passwordless')
    // Keycloak refuses a code twice, so use the app's next code.
    await p
      .getByLabel('Code from your authenticator app')
      .fill(totp(key, Date.now() + 30_000))
    await p.getByRole('button', { name: 'Sign in', exact: true }).click()
    // A double click must still add one passkey, not post an error.
    await p.getByRole('button', { name: 'Add a passkey' }).dblclick()
    await expectConsole(p)
    // Each passkey has its own name, or Keycloak refuses the second one.
    const keys = await credentials(user.username, 'webauthn-passwordless')
    expect(keys).toHaveLength(2)
    expect(new Set(keys.map((k) => k.userLabel)).size).toBe(2)
  })
})
