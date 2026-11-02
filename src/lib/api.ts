import { useQuery } from '@tanstack/react-query'

export type Me = {
  email: string
  name: string
  accountsUrl: string | null
}

// The Address page (platform#564): the permanent address never changes; the
// chosen name and own domains change only through an Arc Forge support
// request.
type Addresses = {
  permanent: string
  chosenName: string
  domains: { hostname: string; cnameTarget: string }[]
}

export type Claw = {
  name: string
  label: string
  url: string
  status?: string
  version?: string
  addresses?: Addresses
}

export type NameCheck = { available: boolean; reason?: 'shape' | 'taken' }

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
    addresses: {
      permanent: 'c7k2mq.arcforge.space',
      chosenName: 'acme',
      domains: [
        { hostname: 'chat.acme.example', cnameTarget: 'c7k2mq.arcforge.space' },
      ],
    },
  },
  {
    name: 'acme-ops',
    label: 'Acme ops',
    url: 'https://cq9v4d.arcforge.space/',
    status: 'online',
    version: '2026.10.3',
    addresses: {
      permanent: 'cq9v4d.arcforge.space',
      chosenName: '',
      domains: [],
    },
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

// Is a chosen name free? Yes or no only. Demo mode treats the demo names
// and "console" as taken.
export function useNameCheck(name: string) {
  return useQuery({
    queryKey: ['name-check', name],
    enabled: name.length > 0,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<NameCheck> =>
      demo
        ? ['acme', 'console'].includes(name)
          ? { available: false, reason: 'taken' }
          : { available: true }
        : getJson<NameCheck>(
            `/api/names/check?name=${encodeURIComponent(name)}`
          ),
  })
}

// Cloudflare Access ends the session for every Access app at this path.
export const signOutUrl = '/cdn-cgi/access/logout'

export function initialsOf(me: Me | undefined) {
  return (me?.name ?? '?').slice(0, 2).toUpperCase()
}
