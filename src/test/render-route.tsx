import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'
import { render } from 'vitest-browser-react'
import type { Me } from '@/lib/api'
import { DirectionProvider } from '@/context/direction-provider'
import { FontProvider } from '@/context/font-provider'
import { ThemeProvider } from '@/context/theme-provider'

const me: Me = {
  email: 'jordan@acme.example',
  name: 'jordan',
  accountsUrl: null,
}

// Renders one console route through the real providers, router, layout and
// page (as main.tsx does), with the query cache already holding the page's
// data. The data is what the
// Worker would send; the page, not the test, decides what to show.
export async function renderRoute(path: string, data: Record<string, unknown>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(['me'], me)
  for (const [key, value] of Object.entries(data))
    queryClient.setQueryData([key], value)
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FontProvider>
          <DirectionProvider>
            <RouterProvider router={router} />
          </DirectionProvider>
        </FontProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
  return { ...screen, router }
}
