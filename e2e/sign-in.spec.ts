import { expect, test } from '@playwright/test'
import {
  createUser,
  expectConsole,
  freshPage,
  password,
  totp,
  useArcforgeBrowserFlow,
} from './keycloak'

// One person's whole sign-in life on the real Keycloak with the arcforge
// theme: first sign-in with set-up, a normal sign-in, and a sign-in with a
// recovery code. Each sign-in must end on the console.

test.beforeAll(useArcforgeBrowserFlow)

test('set up, sign in with a code, sign in with a recovery code', async ({
  page,
  browser,
}) => {
  const user = await createUser([
    'CONFIGURE_TOTP',
    'CONFIGURE_RECOVERY_AUTHN_CODES',
  ])
  let key = ''
  let codes: string[] = []

  await test.step('first sign-in sets up the one-time code', async () => {
    await password(page, user.username, user.password)
    await expect(
      page.getByRole('heading', { name: 'Set up two-step sign-in' })
    ).toBeVisible()
    await expect(page.locator('#kc-totp-secret-qr-code')).toBeVisible()
    // The setup key stays closed until the person asks for it.
    await expect(page.locator('#kc-totp-secret-key')).toBeHidden()

    await page.getByLabel('Code from the app').fill('000000')
    await page.getByRole('button', { name: 'Verify' }).click()
    await expect(page.locator('#input-error-otp-code')).toHaveText(
      'Invalid authenticator code.'
    )

    await page.getByText("Can't scan? Use a setup key").click()
    key = (await page.locator('#kc-totp-secret-key').innerText()).trim()
    // A typed key needs the app settings that the QR code carries.
    await expect(page.locator('#kc-totp-policy')).toHaveText(
      'Time-based, every 30 s · SHA1 · 6 digits'
    )
    await page.getByLabel('Code from the app').fill(totp(key))
    await page.getByRole('button', { name: 'Verify' }).click()
  })

  await test.step('first sign-in shows the recovery codes once', async () => {
    await expect(
      page.getByRole('heading', { name: 'Save your recovery codes' })
    ).toBeVisible()
    codes = await page.locator('#kc-recovery-codes-list code').allInnerTexts()
    expect(codes).toHaveLength(12)
    const next = page.getByRole('button', { name: 'Continue' })
    await expect(next).toBeDisabled()
    await page.getByLabel('I saved these codes').check()
    await next.click()
    await expectConsole(page)
  })

  await test.step('next sign-in asks for the code', async () => {
    const p = await freshPage(browser)
    await password(p, user.username, user.password)
    await expect(
      p.getByLabel('Code from your authenticator app')
    ).toBeVisible()
    // Keycloak refuses a code twice, so use the app's next code.
    await p
      .getByLabel('Code from your authenticator app')
      .fill(totp(key, Date.now() + 30_000))
    await p.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expectConsole(p)
  })

  await test.step('a recovery code signs in without the phone', async () => {
    const p = await freshPage(browser)
    await password(p, user.username, user.password)
    await p.getByRole('button', { name: 'Try another way' }).click()
    await p.getByRole('button', { name: /^Recovery code/ }).click()
    // Keycloak asks for one code from the sheet, by its number.
    const box = p.getByLabel(/^Recovery code number \d+$/)
    const label = await p.locator('label[for=recoveryCodeInput]').innerText()
    const number = Number(label.match(/\d+$/)?.[0])
    await box.fill(codes[number - 1])
    await p.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expectConsole(p)
  })
})
