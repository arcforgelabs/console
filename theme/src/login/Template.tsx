import { useEffect } from 'react'
import { kcSanitize } from 'keycloakify/lib/kcSanitize'
import { useInitialize } from 'keycloakify/login/Template.useInitialize'
import type { TemplateProps } from 'keycloakify/login/TemplateProps'
import type { KcContext } from './KcContext'
import type { I18n } from './i18n'

const alertTone = {
  success: 'border-emerald-500/40 bg-emerald-500/10',
  info: 'border-border bg-muted',
  warning: 'border-amber-500/40 bg-amber-500/10',
  error: 'border-destructive/50 bg-destructive/10 text-destructive',
}

// The page frame for every sign-in page: mark, card, message, footer.
// Based on keycloakify/login/Template (MIT), restyled for Arc Forge.
export default function Template(props: TemplateProps<KcContext, I18n>) {
  const {
    displayInfo = false,
    displayMessage = true,
    headerNode,
    socialProvidersNode = null,
    infoNode = null,
    documentTitle,
    kcContext,
    i18n,
    doUseDefaultCss,
    children,
  } = props

  const { msg, msgStr, currentLanguage, enabledLanguages } = i18n
  const { realm, auth, url, message, isAppInitiatedAction } = kcContext

  useEffect(() => {
    document.title = documentTitle ?? msgStr('loginTitle', realm.displayName)
  }, [documentTitle, msgStr, realm.displayName])

  const { isReadyToRender } = useInitialize({ kcContext, doUseDefaultCss })
  if (!isReadyToRender) return null

  const showUsername =
    auth !== undefined && auth.showUsername && !auth.showResetCredentials

  return (
    <div className='flex min-h-svh flex-col items-center bg-background px-4 py-10 text-foreground'>
      <a
        href={url.loginRestartFlowUrl}
        className='mb-8 flex items-center gap-2.5 font-semibold tracking-tight'
        aria-label='Arc Forge'
      >
        <span className='flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground'>
          A
        </span>
        Arc Forge
      </a>

      <main className='w-full max-w-sm rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8'>
        <header className='mb-6'>
          {showUsername ? (
            <div className='flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm'>
              <span id='kc-attempted-username' className='truncate'>
                {auth.attemptedUsername}
              </span>
              <a
                id='reset-login'
                href={url.loginRestartFlowUrl}
                className='shrink-0 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
              >
                {msg('restartLoginTooltip')}
              </a>
            </div>
          ) : (
            <h1 id='kc-page-title' className='text-xl font-semibold'>
              {headerNode}
            </h1>
          )}
        </header>

        {displayMessage &&
          message !== undefined &&
          (message.type !== 'warning' || !isAppInitiatedAction) && (
            <div
              role={message.type === 'error' ? 'alert' : 'status'}
              className={`mb-4 rounded-md border px-3 py-2 text-sm ${alertTone[message.type]}`}
              dangerouslySetInnerHTML={{ __html: kcSanitize(message.summary) }}
            />
          )}

        <div id='kc-content'>{children}</div>

        {auth !== undefined && auth.showTryAnotherWayLink && (
          <form
            id='kc-select-try-another-way-form'
            action={url.loginAction}
            method='post'
            className='mt-4 text-center text-sm'
          >
            <input type='hidden' name='tryAnotherWay' value='on' />
            <button
              type='submit'
              id='try-another-way'
              className='text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
            >
              {msg('doTryAnotherWay')}
            </button>
          </form>
        )}

        {socialProvidersNode}

        {displayInfo && (
          <div id='kc-info' className='mt-6 text-center text-sm text-muted-foreground'>
            {infoNode}
          </div>
        )}
      </main>

      <footer className='mt-8 flex flex-col items-center gap-3 text-xs text-muted-foreground'>
        <div className='flex gap-4'>
        <a href='https://arcforge.au/privacy' className='hover:text-foreground'>
          Privacy
        </a>
        <a href='https://status.arcforge.au' className='hover:text-foreground'>
          Service status
        </a>
        </div>
        {enabledLanguages.length > 1 && (
          <nav
            aria-label={msgStr('languages')}
            className='flex w-full max-w-sm flex-wrap justify-center gap-x-3 gap-y-1'
          >
            {enabledLanguages.map(({ languageTag, label, href }) => (
              <a
                key={languageTag}
                href={href}
                aria-current={label === currentLanguage.label ? 'true' : undefined}
                className='hover:text-foreground aria-[current]:text-foreground'
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </footer>
    </div>
  )
}
