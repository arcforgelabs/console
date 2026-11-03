import { test, expect } from '@playwright/test'

test('report consent survives in-app navigation and resets only on reload', async ({
  page,
}) => {
  const writes: string[] = []
  page.on('request', (request) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()))
      writes.push(request.url())
  })
  await page.clock.install()
  await page.goto('/reports')
  const consent = page.getByRole('switch', {
    name: 'Receive reports in OpenClaw (demo)',
  })
  await expect(consent).not.toBeChecked()
  await consent.click()
  await expect(
    page.getByText('Opt-in preview is on. No reports are sent.', {
      exact: false,
    })
  ).toBeVisible()
  // Cross the normal ten-second query freshness boundary before navigation.
  await page.clock.fastForward(11_000)
  await page
    .getByRole('link', { name: 'Demo weekly report · 1 November 2026' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'What changed' })
  ).toBeVisible()
  await page.getByRole('link', { name: 'All reports', exact: true }).click()
  // Settle real browser query refetches, unlike the seeded UI cache fixture.
  await page.waitForLoadState('networkidle')
  await expect(consent).toBeChecked()
  await page.reload()
  await expect(consent).not.toBeChecked()
  expect(writes).toEqual([])
})
