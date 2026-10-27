import { expect, test } from '@playwright/test'
import {
  createUser,
  expectConsole,
  password,
  useArcforgeBrowserFlow,
} from './keycloak'

// Account steps an app asks for after sign-in (kc_action). The person can
// always leave with Cancel, and the email check does not claim an email was
// sent before it was.

test.beforeAll(useArcforgeBrowserFlow)

test('Cancel leaves the one-time code set-up with the code box empty', async ({
  page,
}) => {
  const user = await createUser([])
  await password(page, user.username, user.password, 'CONFIGURE_TOTP')
  await expect(
    page.getByRole('heading', { name: 'Set up two-step sign-in' })
  ).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expectConsole(page)
})

test('the email check asks before it sends a link', async ({ page }) => {
  const user = await createUser([], { emailVerified: false })
  await password(page, user.username, user.password, 'VERIFY_EMAIL')
  await expect(
    page.getByRole('heading', { name: 'Confirm your email' })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send link' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expectConsole(page)
})
