import { describe, expect, it } from 'vitest'
import { AccessError } from './access'
import worker, { handleApi, type Env } from './index'

const kv = (value: string | null) =>
  ({ get: async () => value }) as unknown as KVNamespace
const env = (claws: string | null = null): Env => ({
  ASSETS: {} as Fetcher,
  CLAWS: kv(claws),
  ACCESS_TEAM_DOMAIN: 'https://team.cloudflareaccess.com',
  ACCESS_AUD: 'aud',
})
const signedIn = async () => ({ email: 'sam@acme.example', name: 'sam' })
const signedOut = async () => {
  throw new AccessError('no token')
}
const get = (path: string, method = 'GET') =>
  new Request(`https://console.example${path}`, { method })

describe('handleApi', () => {
  it('answers 401 when Access did not sign the request', async () => {
    const res = await handleApi(get('/api/me'), env(), { verify: signedOut })
    expect(res.status).toBe(401)
  })

  it('returns the signed-in person', async () => {
    const res = await handleApi(get('/api/me'), env(), { verify: signedIn })
    expect(await res.json()).toEqual({
      email: 'sam@acme.example',
      name: 'sam',
      accountsUrl: null,
    })
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  it("returns only that person's claws", async () => {
    const claws = JSON.stringify([
      {
        name: 'acme',
        label: 'Acme',
        hostname: 'acme.arcforge.space',
        email_domains: ['acme.example'],
      },
      {
        name: 'other',
        label: 'Other',
        hostname: 'other.arcforge.space',
        emails: ['x@other.example'],
      },
    ])
    const res = await handleApi(get('/api/me/claws'), env(claws), {
      verify: signedIn,
    })
    const body = (await res.json()) as { claws: { name: string }[] }
    expect(body.claws.map((c) => c.name)).toEqual(['acme'])
  })

  it('refuses writes', async () => {
    const res = await handleApi(get('/api/me', 'POST'), env(), {
      verify: signedIn,
    })
    expect(res.status).toBe(405)
  })

  it('answers 404 for an unknown route', async () => {
    const res = await handleApi(get('/api/nope'), env(), { verify: signedIn })
    expect(res.status).toBe(404)
  })
})

describe('fetch', () => {
  // A page from the asset store, as Cloudflare sends it: immutable headers.
  const assets = {
    fetch: async () => Response.redirect('https://console.example/', 302),
  } as unknown as Fetcher
  const page = async () => {
    const res = await worker.fetch(get('/claws'), { ...env(), ASSETS: assets })
    return res.headers
  }

  it('sends pages with headers that stop framing, outside scripts and referrers', async () => {
    const h = await page()
    expect(h.get('content-security-policy')).toContain("script-src 'self'")
    expect(h.get('content-security-policy')).toContain("frame-ancestors 'none'")
    expect(h.get('x-frame-options')).toBe('DENY')
    expect(h.get('referrer-policy')).toBe('no-referrer')
    expect(h.get('x-content-type-options')).toBe('nosniff')
  })
})
