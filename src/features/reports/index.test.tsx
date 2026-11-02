import { renderRoute } from '@/test/render-route'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { demoReports } from '@/lib/reports-api'

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  demo: true,
}))
describe('Bounded report preview', () => {
  it('starts opted out, previews consent and opens the selected period through its real route', async () => {
    const s = await renderRoute('/reports', {
      reports: demoReports,
      'report-preferences': { enabled: false },
    })
    const consent = s.getByRole('switch', {
      name: 'Receive reports in OpenClaw (demo)',
    })
    await expect.element(consent).not.toBeChecked()
    await userEvent.click(consent)
    await expect
      .element(s.getByText(/Opt-in preview is on. No reports are sent./))
      .toBeVisible()
    await userEvent.click(
      s.getByRole('link', { name: 'Demo weekly report · 1 November 2026' })
    )
    await expect
      .element(s.getByRole('heading', { name: 'What changed' }))
      .toBeVisible()
    expect(s.router.state.location.pathname).toBe('/reports/2026-11-01')
    await userEvent.click(
      s.getByRole('button', { name: 'Native report payload' })
    )
    await expect
      .element(
        s.getByText(/does not prove rendering inside a customer Gateway/)
      )
      .toBeVisible()
    await userEvent.click(
      s.getByRole('link', { name: 'All reports', exact: true })
    )
    await expect
      .element(
        s.getByRole('switch', { name: 'Receive reports in OpenClaw (demo)' })
      )
      .toBeChecked()
  })
  it('does not substitute another period when a report is missing', async () => {
    const s = await renderRoute('/reports/unknown', { reports: demoReports })
    await expect
      .element(s.getByRole('alert'))
      .toHaveTextContent('Report not found')
    await expect
      .element(s.getByRole('heading', { name: 'What changed' }))
      .not.toBeInTheDocument()
  })
  it('shows a useful empty state', async () => {
    const s = await renderRoute('/reports', {
      reports: [],
      'report-preferences': { enabled: false },
    })
    await expect.element(s.getByText('No reports yet.')).toBeVisible()
  })
})
