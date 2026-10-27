import { renderRoute } from '@/test/render-route'
import { describe, expect, it } from 'vitest'
import type { Claw } from '@/lib/api'

const claws: Claw[] = [
  {
    name: 'acme',
    label: 'Acme assistant',
    url: 'https://acme.example.test/',
    status: 'online',
  },
]

describe('Claws page', () => {
  it('opens each claw at its own address in a new tab', async () => {
    const s = await renderRoute('/', { claws })
    await expect.element(s.getByText('Acme assistant')).toBeVisible()
    const open = s.getByRole('link', { name: 'Open' })
    await expect.element(open).toHaveAttribute('href', claws[0].url)
    await expect.element(open).toHaveAttribute('target', '_blank')
  })

  it('tells a person with no claws who adds them', async () => {
    const s = await renderRoute('/', { claws: [] })
    await expect
      .element(s.getByText('No claws yet. Your Arc Forge contact adds you.'))
      .toBeVisible()
  })
})
