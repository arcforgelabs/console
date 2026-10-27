import { kcSanitize } from 'keycloakify/lib/kcSanitize'
import type { PageProps } from 'keycloakify/login/pages/PageProps'
import type { KcContext } from '../KcContext'
import type { I18n } from '../i18n'
import { input, primaryButton, quietLink } from '../ui'

type Props = PageProps<
  Extract<KcContext, { pageId: 'login-reset-password.ftl' }>,
  I18n
>

// One line, one box, one button. "Back to sign in" is the only link.
export default function LoginResetPassword(props: Props) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props
  const { url, realm, auth, messagesPerField } = kcContext
  const { msg } = i18n

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      displayMessage={!messagesPerField.existsError('username')}
      headerNode='Reset your password'
    >
      <p className='mb-6 text-muted-foreground'>
        We send a reset link to your email.
      </p>
      <form
        id='kc-reset-password-form'
        action={url.loginAction}
        method='post'
        className='flex flex-col gap-4'
      >
        <div className='flex flex-col gap-1.5'>
          <label htmlFor='username' className='text-sm font-medium'>
            {!realm.loginWithEmailAllowed
              ? msg('username')
              : !realm.registrationEmailAsUsername
                ? msg('usernameOrEmail')
                : msg('email')}
          </label>
          <input
            type='text'
            id='username'
            name='username'
            autoComplete='username'
            autoFocus
            required
            defaultValue={auth.attemptedUsername ?? ''}
            className={input}
            aria-invalid={messagesPerField.existsError('username')}
          />
          {messagesPerField.existsError('username') && (
            <span
              id='input-error-username'
              className='text-sm text-destructive'
              aria-live='polite'
              dangerouslySetInnerHTML={{
                __html: kcSanitize(messagesPerField.get('username')),
              }}
            />
          )}
        </div>
        <button type='submit' className={primaryButton}>
          Send reset link
        </button>
      </form>
      <p className='mt-4 text-center'>
        <a href={url.loginUrl} className={quietLink}>
          Back to sign in
        </a>
      </p>
    </Template>
  )
}
