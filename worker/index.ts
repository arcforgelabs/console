// The console Worker: static assets, plus a few JSON routes under /api/.
// Contract with the private platform deploy (README, "Deploy"):
//   vars ACCESS_TEAM_DOMAIN, ACCESS_AUD, ACCOUNTS_URL (optional)
//   KV binding CLAWS, key "claws"
import { AccessError, verifyAccess } from './access'
import { clawsFor, parseClaws } from './claws'

export interface Env {
  ASSETS: Fetcher
  CLAWS: KVNamespace
  ACCESS_TEAM_DOMAIN: string
  ACCESS_AUD: string
  ACCOUNTS_URL?: string
}

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers })
}

export async function handleApi(
  request: Request,
  env: Env,
  deps: { verify?: typeof verifyAccess } = {}
): Promise<Response> {
  const url = new URL(request.url)
  if (request.method !== 'GET')
    return json({ error: 'method not allowed' }, 405)

  let identity
  try {
    identity = await (deps.verify ?? verifyAccess)(request, {
      teamDomain: env.ACCESS_TEAM_DOMAIN,
      audience: env.ACCESS_AUD,
    })
  } catch (e) {
    if (e instanceof AccessError) return json({ error: 'not signed in' }, 401)
    throw e
  }

  switch (url.pathname) {
    case '/api/me':
      return json({ ...identity, accountsUrl: env.ACCOUNTS_URL || null })
    case '/api/me/claws': {
      const records = parseClaws(await env.CLAWS.get('claws'))
      return json({ claws: clawsFor(identity.email, records) })
    }
    default:
      return json({ error: 'not found' }, 404)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) return handleApi(request, env)
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
