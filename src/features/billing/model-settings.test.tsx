import { renderRoute } from '@/test/render-route'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { demoBilling } from '@/lib/demo-data'

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  demo: true,
}))
describe('Model payer preview', () => {
  it('uses one exclusive choice, keeps it when reopened and states connection limits', async () => {
    const s = await renderRoute('/billing', {
      billing: demoBilling,
      'model-settings': { payer: 'included', ownConnected: false },
    })
    await userEvent.click(
      s.getByRole('button', { name: 'Model settings', exact: true })
    )
    await expect
      .element(s.getByRole('radio', { name: /Included plan/ }))
      .toBeChecked()
    await userEvent.click(s.getByRole('radio', { name: /Both/ }))
    await expect
      .element(s.getByRole('radio', { name: /Included plan/ }))
      .not.toBeChecked()
    await expect
      .element(s.getByText(/No own subscription is connected/))
      .toBeVisible()
    await userEvent.click(s.getByRole('button', { name: 'Preview choice' }))
    await expect
      .element(s.getByText('Demo choice saved for this page session only.'))
      .toBeVisible()
    await userEvent.click(
      s.getByRole('button', { name: 'Model settings', exact: true })
    )
    await userEvent.click(
      s.getByRole('button', { name: 'Model settings', exact: true })
    )
    await expect.element(s.getByRole('radio', { name: /Both/ })).toBeChecked()
    await userEvent.click(s.getByRole('button', { name: 'More options' }))
    await expect
      .element(
        s.getByText(/Spend caps, prices and per-claw choices are not decided/)
      )
      .toBeVisible()
  })
})
