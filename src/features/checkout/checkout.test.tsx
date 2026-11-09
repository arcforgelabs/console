import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { Buy } from './checkout'

afterEach(() => {
  vi.unstubAllGlobals()
  delete window.turnstile
})
describe('test checkout UI', () => {
  it('does not invent products or provide a fake purchase action while catalogue is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ products: [], site_key: null }))
    )
    const view = await render(<Buy />)
    await expect
      .element(
        view.getByText('Purchases are not available yet.', { exact: false })
      )
      .toBeInTheDocument()
    await expect.element(view.getByRole('button')).not.toBeInTheDocument()
    await expect
      .element(view.getByRole('link', { name: 'Check an existing payment' }))
      .toHaveAttribute('href', '/buy/status')
  })
  it('requires product and security check, and presents server rejection without a fake success', async () => {
    const requests: { url: string; body?: string }[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, options?: RequestInit) => {
        requests.push({ url, body: options?.body as string | undefined })
        return url.endsWith('catalogue')
          ? Response.json({
              products: [{ sku: 'synthetic', label: 'Synthetic test plan' }],
              site_key: 'synthetic',
            })
          : Response.json(
              { error: 'Security check failed. Try again.' },
              { status: 400 }
            )
      })
    )
    window.turnstile = {
      render: (element, options) => {
        const button = document.createElement('button')
        button.textContent = 'Synthetic security check'
        button.onclick = () => options.callback('synthetic-token')
        element.append(button)
        return 'synthetic'
      },
      remove: () => {},
    }
    const view = await render(<Buy />)
    const buy = view.getByRole('button', { name: 'Create test checkout' })
    await expect.element(buy).toBeDisabled()
    await view.getByRole('combobox').selectOptions('synthetic')
    await expect.element(buy).toBeDisabled()
    await view.getByRole('button', { name: 'Synthetic security check' }).click()
    await buy.click()
    await expect
      .element(view.getByRole('alert'))
      .toHaveTextContent('Security check failed')
    expect(
      JSON.parse(
        requests.find((request) => request.url.endsWith('orders'))!.body!
      )
    ).toEqual({ sku: 'synthetic', turnstile_token: 'synthetic-token' })
    expect(requests.some((request) => request.url.endsWith('session'))).toBe(
      false
    )
  })
  it('refreshes server payment facts and never calls a paid order built', async () => {
    let status = 'pending'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ status }))
    )
    const view = await render(<Buy statusPage />)
    await expect
      .element(view.getByRole('status'))
      .toHaveTextContent('Payment pending')
    status = 'confirmed'
    await view.getByRole('button', { name: 'Refresh payment status' }).click()
    await expect
      .element(view.getByRole('status'))
      .toHaveTextContent('Payment confirmed. Setup is not confirmed here.')
    await expect
      .element(view.getByRole('button', { name: 'Continue this checkout' }))
      .not.toBeInTheDocument()
    status = 'failure'
    await view.getByRole('button', { name: 'Refresh payment status' }).click()
    await expect
      .element(view.getByRole('status'))
      .toHaveTextContent('Payment failed or subscription ended')
  })
})
