import { renderRoute } from '@/test/render-route'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { demoApps } from '@/lib/demo-data'

describe('Apps page', () => {
  it('shows the plan line and one Open button, details on a tap', async () => {
    const s = await renderRoute('/apps', { apps: [demoApps[0]] })
    await expect
      .element(s.getByText('Care, monthly · renews 1 Dec 2026'))
      .toBeVisible()
    await expect
      .element(s.getByRole('link', { name: 'Open app' }))
      .toHaveAttribute('href', demoApps[0].url)
    const report = s.getByRole('link', { name: 'Report a problem' })
    await expect.element(report).not.toBeInTheDocument()

    await userEvent.click(s.getByRole('button', { name: 'Details' }))
    await expect.element(s.getByText('99.98%')).toBeVisible()
    await expect.element(report).toHaveAttribute('href', '/support')
  })
})
