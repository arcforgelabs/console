import { renderRoute } from '@/test/render-route'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { demoUsage } from '@/lib/demo-data'

describe('Usage page', () => {
  it('leads with the included plan used, breakdown on a tap', async () => {
    const s = await renderRoute('/usage', { usage: demoUsage })
    await expect.element(s.getByText('$42.10')).toBeVisible()
    await expect.element(s.getByText('of $100.00 used')).toBeVisible()
    await expect
      .element(s.getByRole('meter', { name: 'Included plan used' }))
      .toHaveAttribute('aria-valuenow', '42')
    await expect.element(s.getByText('Sam Ortiz')).not.toBeInTheDocument()

    await userEvent.click(s.getByRole('button', { name: 'Breakdown' }))
    await expect.element(s.getByText('Sam Ortiz')).toBeVisible()
  })
})
