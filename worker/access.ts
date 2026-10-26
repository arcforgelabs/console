// Checks the Cloudflare Access token on each request. Access sits in front of
// the console, but the Worker still checks the signature and audience itself:
// a request that reached the Worker some other way must not be trusted.
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'

export type Identity = {
  email: string
  name: string
}

export class AccessError extends Error {}

const keySets = new Map<string, JWTVerifyGetKey>()

function teamKeys(teamDomain: string): JWTVerifyGetKey {
  let keys = keySets.get(teamDomain)
  if (!keys) {
    keys = createRemoteJWKSet(new URL('/cdn-cgi/access/certs', teamDomain))
    keySets.set(teamDomain, keys)
  }
  return keys
}

export async function verifyAccess(
  request: Request,
  options: { teamDomain: string; audience: string; keys?: JWTVerifyGetKey }
): Promise<Identity> {
  const token = request.headers.get('cf-access-jwt-assertion')
  if (!token) throw new AccessError('no Access token')
  if (!options.teamDomain || !options.audience) {
    throw new AccessError('ACCESS_TEAM_DOMAIN or ACCESS_AUD is not set')
  }

  let payload
  try {
    ;({ payload } = await jwtVerify(
      token,
      options.keys ?? teamKeys(options.teamDomain),
      {
        issuer: options.teamDomain,
        audience: options.audience,
        algorithms: ['RS256'],
      }
    ))
  } catch (_e) {
    throw new AccessError('Access token is not valid')
  }

  const email =
    typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  if (!email) throw new AccessError('Access token has no email')
  return { email, name: email.split('@')[0] }
}
