import { renderRoute } from '@/test/render-route'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { demoSupport } from '@/lib/demo-data'

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  demo: true,
}))
const claws = [
  { name: 'acme', label: 'Acme assistant', url: 'https://demo.example' },
  { name: 'ops', label: 'Acme ops', url: 'https://ops.example' },
]
describe('Demo support requests', () => {
  it('preselects a claw, rejects blank input and opens the new request without losing existing requests', async () => {
    const s = await renderRoute('/support', { support: demoSupport, claws })
    await userEvent.click(
      s.getByRole('button', { name: 'New request', exact: true })
    )
    await expect.element(s.getByText('Claw: Acme assistant')).toBeVisible()
    await userEvent.fill(
      s.getByRole('textbox', { name: 'What went wrong?' }),
      '   '
    )
    await expect
      .element(s.getByRole('button', { name: 'Preview request' }))
      .toBeDisabled()
    await userEvent.fill(
      s.getByRole('textbox', { name: 'What went wrong?' }),
      'Demo export does not open'
    )
    await userEvent.click(s.getByRole('button', { name: 'Preview request' }))
    await expect
      .element(s.getByText('Demo export does not open', { exact: true }))
      .toBeVisible()
    await expect.element(s.getByText('Quote PDF shows old logo')).toBeVisible()
    await userEvent.click(
      s.getByText('Demo export does not open', { exact: true })
    )
    await expect.element(s.getByText('Opened', { exact: true })).toBeVisible()
    await expect
      .element(s.getByText(/Demo only · Acme assistant/))
      .toBeVisible()
  })
  it('cannot submit without an available claw', async () => {
    const s = await renderRoute('/support', { support: [], claws: [] })
    await userEvent.click(
      s.getByRole('button', { name: 'New request', exact: true })
    )
    await userEvent.fill(
      s.getByRole('textbox', { name: 'What went wrong?' }),
      'Demo issue'
    )
    await expect
      .element(s.getByRole('button', { name: 'Preview request' }))
      .toBeDisabled()
  })
})
