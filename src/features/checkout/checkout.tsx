import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Product = { sku: string; label: string }
type TurnstileApi = {
  render(
    element: HTMLElement,
    options: {
      sitekey: string
      action: string
      callback(token: string): void
      'expired-callback'(): void
      'error-callback'(): void
    }
  ): string
  remove(id: string): void
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}
function SecurityCheck({
  siteKey,
  onToken,
}: {
  siteKey: string
  onToken(token: string): void
}) {
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let widget: string | undefined
    let disposed = false
    const mount = () => {
      if (
        !disposed &&
        container.current &&
        window.turnstile &&
        widget === undefined
      )
        widget = window.turnstile.render(container.current, {
          sitekey: siteKey,
          action: 'checkout',
          callback: onToken,
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
        })
    }
    let script = document.querySelector<HTMLScriptElement>(
      'script[data-checkout-turnstile]'
    )
    if (!script) {
      script = document.createElement('script')
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.dataset.checkoutTurnstile = 'true'
      script.async = true
      document.head.append(script)
    }
    script.addEventListener('load', mount)
    mount()
    return () => {
      disposed = true
      script.removeEventListener('load', mount)
      if (widget !== undefined) window.turnstile?.remove(widget)
    }
  }, [siteKey, onToken])
  return <div ref={container} />
}
async function call(path: string, body?: unknown) {
  const response = await fetch('/checkout/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok)
    throw new Error(data.error || 'Checkout unavailable. Try again later.')
  return data
}
async function continueCheckout() {
  const { url } = await call('session', {})
  if (
    typeof url !== 'string' ||
    new URL(url).origin !== 'https://checkout.stripe.com'
  )
    throw new Error('Unexpected checkout destination')
  window.location.assign(url)
}
export function Buy({ statusPage = false }: { statusPage?: boolean }) {
  const [products, setProducts] = useState<Product[]>([])
  const [sku, setSku] = useState('')
  const [siteKey, setSiteKey] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [securityAttempt, setSecurityAttempt] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  async function refresh() {
    setError('')
    setBusy(true)
    try {
      setStatus((await call('status')).status)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        if (statusPage) {
          const data = await call('status')
          if (active) setStatus(data.status)
        } else {
          const data = await call('catalogue')
          if (active) {
            setProducts(data.products)
            setSiteKey(data.site_key)
          }
        }
      } catch (e) {
        if (active) setError((e as Error).message)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [statusPage])
  async function pay() {
    setError('')
    setBusy(true)
    try {
      if (!statusPage) {
        await call('orders', { sku, turnstile_token: token })
        // Persist recovery navigation before the external redirect or any uncertain effect.
        window.location.assign('/buy/status')
        return
      }
      await continueCheckout()
    } catch (e) {
      setError(
        (e as Error).message + ' Use payment status to retry the same order.'
      )
    } finally {
      setBusy(false)
      setToken('')
      setSecurityAttempt((attempt) => attempt + 1)
    }
  }
  return (
    <main className='mx-auto max-w-xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle role='heading' aria-level={1}>
            {statusPage ? 'Payment status' : 'Buy an Arc Forge subscription'}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p>Test checkout only. No live payments are accepted.</p>
          {statusPage ? (
            <>
              <p role='status'>
                {status === 'confirmed'
                  ? 'Payment confirmed. Setup is not confirmed here.'
                  : status === 'failure'
                    ? 'Payment failed or subscription ended. Contact support before buying again.'
                    : status === 'pending'
                      ? 'Payment pending. Refresh to check Stripe again.'
                      : 'Payment status not checked. Refresh to try again.'}
              </p>
              <Button onClick={refresh} disabled={busy}>
                Refresh payment status
              </Button>
              {status === 'pending' && (
                <Button onClick={pay} disabled={busy}>
                  Continue this checkout
                </Button>
              )}
            </>
          ) : (
            <>
              {!products.length ? (
                <p>
                  Purchases are not available yet. No products or prices have
                  been activated.
                </p>
              ) : (
                <>
                  <label className='block'>
                    Subscription
                    <select
                      className='mt-2 block w-full rounded border p-2'
                      value={sku}
                      onChange={(event) => setSku(event.target.value)}
                    >
                      <option value=''>Select a subscription</option>
                      {products.map((product) => (
                        <option key={product.sku} value={product.sku}>
                          {product.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {!siteKey && (
                    <p>Security check unavailable. Try again later.</p>
                  )}
                  {siteKey && (
                    <SecurityCheck
                      key={securityAttempt}
                      siteKey={siteKey}
                      onToken={setToken}
                    />
                  )}
                  <Button onClick={pay} disabled={busy || !sku || !token}>
                    Create test checkout
                  </Button>
                </>
              )}
            </>
          )}
          {error && <p role='alert'>{error}</p>}
          <p>
            <a className='underline' href={statusPage ? '/buy' : '/buy/status'}>
              {statusPage
                ? 'Available subscriptions'
                : 'Check an existing payment'}
            </a>
          </p>
          <p className='text-sm text-muted-foreground'>
            Existing-customer changes, billing portal, resize and deletion are
            not available here.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
