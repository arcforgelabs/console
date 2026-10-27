import { useQuery } from '@tanstack/react-query'

export type Me = {
  email: string
  name: string
  accountsUrl: string | null
}

export type Claw = {
  name: string
  label: string
  url: string
  status?: string
  version?: string
}

export class ApiError extends Error {
  constructor(public status: number) {
    super(`API error ${status}`)
  }
}

// Demo mode (VITE_DEMO=1) shows synthetic data with no Worker. It is for
// local work and screenshots only; a production build never sets it.
export const demo = import.meta.env.VITE_DEMO === '1'

const demoMe: Me = {
  email: 'jordan@acme.example',
  name: 'jordan',
  accountsUrl: null,
}

const demoClaws: Claw[] = [
  {
    name: 'acme',
    label: 'Acme assistant',
    url: 'https://acme.arcforge.space/',
    status: 'online',
    version: '2026.10.3',
  },
  {
    name: 'acme-ops',
    label: 'Acme ops',
    url: 'https://acme-ops.arcforge.space/',
    status: 'online',
    version: '2026.10.3',
  },
]

export async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { accept: 'application/json' },
  })
  if (!res.ok) throw new ApiError(res.status)
  return (await res.json()) as T
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => (demo ? demoMe : getJson<Me>('/api/me')),
    staleTime: 5 * 60 * 1000,
  })
}

export function useClaws() {
  return useQuery({
    queryKey: ['claws'],
    queryFn: async () =>
      demo
        ? demoClaws
        : (await getJson<{ claws: Claw[] }>('/api/me/claws')).claws,
  })
}

// Cloudflare Access ends the session for every Access app at this path.
export const signOutUrl = '/cdn-cgi/access/logout'

export function initialsOf(me: Me | undefined) {
  return (me?.name ?? '?').slice(0, 2).toUpperCase()
}
