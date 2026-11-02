import { renderRoute } from '@/test/render-route'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { demoTeam } from '@/lib/demo-data'

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  demo: true,
}))

describe('Demo invites', () => {
  it('previews selected access, counts the seat, and rejects a duplicate', async () => {
    const s = await renderRoute('/team', { team: demoTeam })
    await userEvent.click(
      s.getByRole('button', { name: 'Invite', exact: true })
    )
    await expect
      .element(s.getByRole('checkbox', { name: 'Acme assistant' }))
      .toBeChecked()
    await userEvent.click(s.getByRole('checkbox', { name: 'Acme ops' }))
    await userEvent.fill(
      s.getByRole('textbox', { name: 'Email' }),
      'NEW@acme.example'
    )
    await userEvent.click(s.getByRole('button', { name: 'Preview invite' }))
    await expect.element(s.getByText('5 of 10 seats used.')).toBeVisible()
    await userEvent.click(s.getByText('new@acme.example', { exact: true }))
    await expect
      .element(
        s.getByRole('switch', {
          name: 'new@acme.example can open Acme assistant',
        })
      )
      .toBeChecked()
    await expect
      .element(
        s.getByRole('switch', { name: 'new@acme.example can open Acme ops' })
      )
      .not.toBeChecked()
    await userEvent.click(
      s.getByRole('button', { name: 'Invite', exact: true })
    )
    await userEvent.fill(
      s.getByRole('textbox', { name: 'Email' }),
      'new@acme.example'
    )
    await userEvent.click(s.getByRole('button', { name: 'Preview invite' }))
    await expect
      .element(s.getByRole('alert'))
      .toHaveTextContent('already on the team')
  })
  it('blocks a full team and links to billing', async () => {
    const s = await renderRoute('/team', {
      team: { ...demoTeam, seatsIncluded: 4 },
    })
    await userEvent.click(
      s.getByRole('button', { name: 'Invite', exact: true })
    )
    await expect
      .element(s.getByRole('button', { name: 'Preview invite' }))
      .toBeDisabled()
    await expect
      .element(s.getByRole('link', { name: 'View billing' }))
      .toHaveAttribute('href', '/billing')
  })
})
