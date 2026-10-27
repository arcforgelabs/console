import { renderRoute } from '@/test/render-route'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { demoSupport } from '@/lib/demo-data'

describe('Support page', () => {
  it('lists open requests; progress and closed ones on a tap', async () => {
    const s = await renderRoute('/support', { support: demoSupport })
    await expect.element(s.getByText('Quote PDF shows old logo')).toBeVisible()
    await expect.element(s.getByText('Fix in review')).not.toBeInTheDocument()
    await expect
      .element(s.getByText('Invoice email bounced'))
      .not.toBeInTheDocument()

    await userEvent.click(s.getByText('Quote PDF shows old logo'))
    await expect.element(s.getByText('Fix in review')).toBeVisible()

    await userEvent.click(s.getByRole('button', { name: 'Closed (1)' }))
    await expect.element(s.getByText('Invoice email bounced')).toBeVisible()
    await expect.element(s.getByText('Closed · good')).toBeVisible()
  })
})
