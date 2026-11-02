import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  page.on('request', (request) => {
    expect(['GET', 'HEAD', 'OPTIONS']).toContain(request.method())
  })
})

test('invite and seat count survive stale navigation until reload', async ({
  page,
}) => {
  await page.goto('/team')
  await page.getByRole('button', { name: 'Invite', exact: true }).click()
  await page
    .getByLabel('Email', { exact: true })
    .fill('lifetime@invite.example')
  await page
    .getByRole('button', { name: 'Preview invite', exact: true })
    .click()
  await expect(
    page.getByText('5 of 10 seats used.', { exact: true })
  ).toBeVisible()
  await page.waitForTimeout(11_500)
  await page.getByRole('link', { name: 'Billing', exact: true }).click()
  await page.getByRole('heading', { name: /^Billing/ }).waitFor()
  await page.getByRole('link', { name: 'Team', exact: true }).click()
  await page.waitForLoadState('networkidle')
  await expect(
    page.getByText('lifetime@invite.example', { exact: true })
  ).toBeVisible()
  await expect(
    page.getByText('5 of 10 seats used.', { exact: true })
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByText('4 of 10 seats used.', { exact: true })
  ).toBeVisible()
  await expect(
    page.getByText('lifetime@invite.example', { exact: true })
  ).toHaveCount(0)
})
