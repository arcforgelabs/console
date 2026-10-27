import type { PageProps } from 'keycloakify/login/pages/PageProps'
import type { KcContext } from '../KcContext'
import type { I18n } from '../i18n'
import { primaryButton, quietLink, secondaryButton, summary } from '../ui'

type Props = PageProps<
  Extract<KcContext, { pageId: 'login-verify-email.ftl' }>,
  I18n
>

// One instruction. Keycloak sends the email at once at sign-in, but not when
// an app asks for the check (isAppInitiatedAction): then the page offers
// "Send link" first. "Send it again" stays behind "No email?".
export default function LoginVerifyEmail(props: Props) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props
  const { url, user, verifyEmail, isAppInitiatedAction } = kcContext
  const { msgStr } = i18n
  const address = (
    <span className='font-medium break-all'>
      {verifyEmail ?? user?.email ?? 'your email'}
    </span>
  )
  const sent = verifyEmail !== undefined || !isAppInitiatedAction

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={sent ? 'Check your email' : 'Confirm your email'}
    >
      <p className='mb-6'>
        {sent ? (
          <>Open the link we sent to {address}.</>
        ) : (
          <>We send a link to {address}.</>
        )}
      </p>

      {isAppInitiatedAction ? (
        <form
          id='kc-verify-email-form'
          action={url.loginAction}
          method='post'
          className='flex flex-col gap-2'
        >
          {sent ? (
            <details className='mb-2 text-sm'>
              <summary className={summary}>No email?</summary>
              <p className='mt-3 text-center text-muted-foreground'>
                Look in your junk folder, or{' '}
                <button type='submit' className={quietLink}>
                  send it again
                </button>
                .
              </p>
            </details>
          ) : (
            <button type='submit' className={primaryButton}>
              Send link
            </button>
          )}
          <button
            type='submit'
            name='cancel-aia'
            value='true'
            formNoValidate
            className={secondaryButton}
          >
            {msgStr('doCancel')}
          </button>
        </form>
      ) : (
        <details className='text-sm'>
          <summary className={summary}>No email?</summary>
          <p className='mt-3 text-center text-muted-foreground'>
            Look in your junk folder, or{' '}
            <a href={url.loginAction} className={quietLink}>
              send it again
            </a>
            .
          </p>
        </details>
      )}
    </Template>
  )
}
