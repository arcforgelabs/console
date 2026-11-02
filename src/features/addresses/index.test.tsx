import { renderRoute } from '@/test/render-route'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { Claw } from '@/lib/api'

const claws: Claw[] = [
  {
    name: 'c7k2mq',
    label: 'Acme assistant',
    url: 'https://acme.arcforge.space/',
    addresses: {
      permanent: 'c7k2mq.arcforge.space',
      chosenName: 'acme',
      domains: [
        { hostname: 'chat.acme.example', cnameTarget: 'c7k2mq.arcforge.space' },
      ],
    },
  },
]

describe('Addresses page', () => {
  it('shows the permanent address, the chosen name and the CNAME for an own domain', async () => {
    const s = await renderRoute('/addresses', { claws })
    await expect
      .element(s.getByText('c7k2mq.arcforge.space', { exact: true }))
      .toBeVisible()
    await expect
      .element(s.getByText('acme.arcforge.space', { exact: true }))
      .toBeVisible()
    await expect
      .element(s.getByText('CNAME chat.acme.example → c7k2mq.arcforge.space'))
      .toBeVisible()
  })

  it('sends a rename only when the name check says the name is free', async () => {
    const s = await renderRoute('/addresses', {
      claws,
      'name-check,acme': { available: false, reason: 'taken' },
      'name-check,bright': { available: true },
    })
    await userEvent.click(s.getByRole('button', { name: 'Rename' }))
    const input = s.getByRole('textbox', { name: 'Name' })
    const send = s.getByRole('button', { name: 'Send request' })

    await userEvent.fill(input, 'acme')
    await expect
      .element(s.getByText('That name is taken. Try another.'))
      .toBeVisible()
    await expect.element(send).toBeDisabled()

    await userEvent.fill(input, 'bright')
    await expect
      .element(s.getByText('bright.arcforge.space is free.'))
      .toBeVisible()
    await expect.element(send).toBeEnabled()
  })
})
