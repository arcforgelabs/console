import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
// Styles
import '@fontsource-variable/geist'
import '@fontsource-variable/jetbrains-mono'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'
import { onSignedIn, onSignedOut } from '@/lib/session'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
// Generated Routes
import { routeTree } from './routeTree.gen'
import './styles/index.css'

const queryClient = new QueryClient({
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
    onSuccess: () => onSignedIn(sessionStorage),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        onSignedOut({
          storage: sessionStorage,
          reload: () => {
            toast.error('Your session ended. Signing you in again.')
            window.location.reload()
          },
          showSignedOut: () => router.navigate({ to: '/401' }),
        })
      }
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <RouterProvider router={router} />
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
