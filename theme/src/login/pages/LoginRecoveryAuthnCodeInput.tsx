import { kcSanitize } from 'keycloakify/lib/kcSanitize'
import type { PageProps } from 'keycloakify/login/pages/PageProps'
import type { KcContext } from '../KcContext'
import type { I18n } from '../i18n'
import { input, primaryButton } from '../ui'

type Props = PageProps<
  Extract<KcContext, { pageId: 'login-recovery-authn-code-input.ftl' }>,
  I18n
>

// One box for the recovery code that Keycloak asks for.
export default function LoginRecoveryAuthnCodeInput(props: Props) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props
  const { url, messagesPerField, recoveryAuthnCodesInputBean } = kcContext

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode='Use a recovery code'
      displayMessage={!messagesPerField.existsError('recoveryCodeInput')}
    >
      <form
        id='kc-recovery-code-login-form'
        action={url.loginAction}
        method='post'
        className='flex flex-col gap-4'
      >
        <div className='flex flex-col gap-1.5'>
          <label htmlFor='recoveryCodeInput' className='text-sm font-medium'>
            Recovery code number {recoveryAuthnCodesInputBean.codeNumber}
          </label>
          <input
            id='recoveryCodeInput'
            name='recoveryCodeInput'
            type='text'
            autoComplete='off'
            autoCapitalize='characters'
            spellCheck={false}
            placeholder='XXXX-XXXX-XXXX'
            autoFocus
            required
            className={`${input} font-mono tracking-wider`}
            aria-invalid={messagesPerField.existsError('recoveryCodeInput')}
          />
          {messagesPerField.existsError('recoveryCodeInput') && (
            <span
              id='input-error'
              className='text-sm text-destructive'
              aria-live='polite'
              dangerouslySetInnerHTML={{
                __html: kcSanitize(messagesPerField.get('recoveryCodeInput')),
              }}
            />
          )}
        </div>
        <button type='submit' id='kc-login' name='login' className={primaryButton}>
          Sign in
        </button>
      </form>
    </Template>
  )
}
