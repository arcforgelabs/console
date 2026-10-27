import { QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api'

// A 401 from the API means the Access session ended. One reload sends the
// browser through Cloudflare Access, which signs the person in again. If the
// API still answers 401 after that reload, Access cannot help (for example
// an expired session or an Access fault): stop and show the signed-out page,
// or the page reloads without end.
const reloadedKey = 'console:reloaded-for-401'

export type SessionDeps = {
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  reload: () => void
  showSignedOut: () => void
}

// The console's query client (main.tsx builds it once per page load).
export function createQueryClient({
  storage,
  reload,
  showSignedOut,
}: SessionDeps) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          !(
            error instanceof ApiError && [401, 403, 404].includes(error.status)
          ) && failureCount < 3,
        refetchOnWindowFocus: import.meta.env.PROD,
        staleTime: 10 * 1000, // 10s
      },
    },
    queryCache: new QueryCache({
      // Any answer from the API shows the session works again.
      onSuccess: () => storage.removeItem(reloadedKey),
      onError: (error) => {
        if (!(error instanceof ApiError && error.status === 401)) return
        if (storage.getItem(reloadedKey)) return showSignedOut()
        storage.setItem(reloadedKey, '1')
        reload()
      },
    }),
  })
}
