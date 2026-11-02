import { renderRoute } from '@/test/render-route'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { demoReports } from '@/lib/reports-api'

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  demo: true,
}))
describe('Bounded report preview', () => {
  it('labels the native payload as a console mock, not a customer Gateway render', async () => {
    const s = await renderRoute('/reports/2026-11-01', { reports: demoReports })
    await userEvent.click(
      s.getByRole('button', { name: 'Native report payload' })
    )
    await expect
      .element(
        s.getByText(/does not prove rendering inside a customer Gateway/)
      )
      .toBeVisible()
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
