import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from 'jose'
import { describe, expect, it } from 'vitest'
import { AccessError, verifyAccess } from './access'

const teamDomain = 'https://team.cloudflareaccess.com'
const audience = 'console-aud'

async function setup() {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' }
  const keys = createLocalJWKSet({ keys: [jwk] })
  const sign = (
    claims: Record<string, unknown>,
    opts: { iss?: string; aud?: string; exp?: string } = {}
  ) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer(opts.iss ?? teamDomain)
      .setAudience(opts.aud ?? audience)
      .setIssuedAt()
      .setExpirationTime(opts.exp ?? '5m')
      .sign(privateKey)
  return { keys, sign }
}

const req = (token?: string) =>
  new Request('https://console.example/api/me', {
    headers: token ? { 'cf-access-jwt-assertion': token } : {},
  })

describe('verifyAccess', () => {
  it('accepts a valid token and returns the email in lower case', async () => {
    const { keys, sign } = await setup()
    const id = await verifyAccess(
      req(await sign({ email: 'Jordan@Acme.example' })),
      { teamDomain, audience, keys }
    )
    expect(id).toEqual({ email: 'jordan@acme.example', name: 'jordan' })
  })

  it('refuses a request with no token', async () => {
    const { keys } = await setup()
    await expect(
      verifyAccess(req(), { teamDomain, audience, keys })
    ).rejects.toBeInstanceOf(AccessError)
  })

  it('refuses a token for another Access app', async () => {
    const { keys, sign } = await setup()
    const token = await sign({ email: 'a@b.example' }, { aud: 'other-app' })
    await expect(
      verifyAccess(req(token), { teamDomain, audience, keys })
    ).rejects.toBeInstanceOf(AccessError)
  })

  it('refuses a token from another team', async () => {
    const { keys, sign } = await setup()
    const token = await sign(
      { email: 'a@b.example' },
      { iss: 'https://evil.cloudflareaccess.com' }
    )
    await expect(
      verifyAccess(req(token), { teamDomain, audience, keys })
    ).rejects.toBeInstanceOf(AccessError)
  })

  it('refuses an expired token', async () => {
    const { keys, sign } = await setup()
    const token = await sign({ email: 'a@b.example' }, { exp: '-1m' })
    await expect(
      verifyAccess(req(token), { teamDomain, audience, keys })
    ).rejects.toBeInstanceOf(AccessError)
  })

  it('refuses a token signed by another key', async () => {
    const { keys } = await setup()
    const other = await setup()
    const token = await other.sign({ email: 'a@b.example' })
    await expect(
      verifyAccess(req(token), { teamDomain, audience, keys })
    ).rejects.toBeInstanceOf(AccessError)
  })

  it('refuses a token with no email', async () => {
    const { keys, sign } = await setup()
    await expect(
      verifyAccess(req(await sign({})), { teamDomain, audience, keys })
    ).rejects.toBeInstanceOf(AccessError)
  })

  it('refuses when the deploy did not set the audience', async () => {
    const { keys, sign } = await setup()
    const token = await sign({ email: 'a@b.example' })
    await expect(
      verifyAccess(req(token), { teamDomain, audience: '', keys })
    ).rejects.toBeInstanceOf(AccessError)
  })
})
