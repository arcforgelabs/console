import { renderRoute } from '@/test/render-route'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { demoTeam } from '@/lib/demo-data'

describe('Team page', () => {
  it('counts seats and shows claw access on a tap', async () => {
    const s = await renderRoute('/team', { team: demoTeam })
    await expect.element(s.getByText('4 of 10 seats used.')).toBeVisible()

    // An owner can always open every claw: the switch is locked on.
    await userEvent.click(s.getByText('Jordan Lee'))
    const owner = s.getByRole('switch', {
      name: 'Jordan Lee can open Acme ops',
    })
    await expect.element(owner).toBeChecked()
    await expect.element(owner).toBeDisabled()

    await userEvent.click(s.getByText('Sam Ortiz'))
    const sam = s.getByRole('switch', { name: 'Sam Ortiz can open Acme ops' })
    await expect.element(sam).not.toBeChecked()
    await userEvent.click(sam)
    await expect.element(sam).toBeChecked()
  })
})
