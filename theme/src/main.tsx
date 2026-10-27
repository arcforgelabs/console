import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/jetbrains-mono'
import { KcPage } from './kc.gen'
import './login/styles.css'

// Follow the device setting: dark unless the device asks for light.
document.documentElement.classList.toggle(
  'dark',
  !window.matchMedia('(prefers-color-scheme: light)').matches
)

// `pnpm dev` shows a page with mock data, for example /?page=login.ftl.
// The mock code is only in the dev build.
if (import.meta.env.DEV && !window.kcContext) {
  const { getKcContextMock } = await import('./login/KcPageStory')
  const page = new URLSearchParams(location.search).get('page') ?? 'login.ftl'
  window.kcContext = getKcContextMock({ pageId: page as never })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.kcContext ? (
      <KcPage kcContext={window.kcContext} />
    ) : (
      <p>No Keycloak context.</p>
    )}
  </StrictMode>
)
