import { renderRoute } from '@/test/render-route'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { demoBilling } from '@/lib/demo-data'

describe('Billing page', () => {
  it('shows the plan and one button; invoices on a tap', async () => {
    const s = await renderRoute('/billing', { billing: demoBilling })
    await expect.element(s.getByText('Business', { exact: true })).toBeVisible()
    await expect
      .element(s.getByRole('button', { name: 'Manage billing' }))
      .toBeVisible()
    await expect.element(s.getByText('1 Oct 2026')).not.toBeInTheDocument()

    await userEvent.click(s.getByRole('button', { name: 'Invoices' }))
    await expect.element(s.getByText('1 Oct 2026')).toBeVisible()
  })
})
