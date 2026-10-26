import type { PageProps } from 'keycloakify/login/pages/PageProps'
import type { KcContext } from '../KcContext'
import type { I18n } from '../i18n'
import { quietLink, summary } from '../ui'

type Props = PageProps<
  Extract<KcContext, { pageId: 'login-verify-email.ftl' }>,
  I18n
>

// One instruction. "Send it again" stays behind "No email?".
export default function LoginVerifyEmail(props: Props) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props
  const { url, user } = kcContext

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode='Check your email'
    >
      <p className='mb-6'>
        Open the link we sent to{' '}
        <span className='font-medium break-all'>
          {user?.email ?? 'your email'}
        </span>
        .
      </p>
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
    </Template>
  )
}
