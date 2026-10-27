import { useState } from 'react'
import { kcSanitize } from 'keycloakify/lib/kcSanitize'
import type { PageProps } from 'keycloakify/login/pages/PageProps'
import type { KcContext } from '../KcContext'
import type { I18n } from '../i18n'
import { codeInput, primaryButton, summary } from '../ui'

type Props = PageProps<Extract<KcContext, { pageId: 'login-otp.ftl' }>, I18n>

// One code box. A person with more than one code app picks it under
// "Use a different device".
export default function LoginOtp(props: Props) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props
  const { otpLogin, url, messagesPerField } = kcContext
  const [isSubmitting, setIsSubmitting] = useState(false)
  const devices = otpLogin.userOtpCredentials

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      displayMessage={!messagesPerField.existsError('totp')}
      headerNode='Enter your code'
    >
      <form
        id='kc-otp-login-form'
        action={url.loginAction}
        method='post'
        onSubmit={() => setIsSubmitting(true)}
        className='flex flex-col gap-4'
      >
        <div className='flex flex-col gap-1.5'>
          <label htmlFor='otp' className='text-sm font-medium'>
            Code from your authenticator app
          </label>
          <input
            id='otp'
            name='otp'
            type='text'
            inputMode='numeric'
            autoComplete='one-time-code'
            pattern='[0-9]*'
            placeholder='123456'
            autoFocus
            required
            className={codeInput}
            aria-invalid={messagesPerField.existsError('totp')}
          />
          {messagesPerField.existsError('totp') && (
            <span
              id='input-error-otp-code'
              className='text-sm text-destructive'
              aria-live='polite'
              dangerouslySetInnerHTML={{
                __html: kcSanitize(messagesPerField.get('totp')),
              }}
            />
          )}
        </div>

        {devices.length > 1 && (
          <details className='text-sm'>
            <summary className={summary}>Use a different device</summary>
            <fieldset className='mt-3 flex flex-col gap-2'>
              <legend className='sr-only'>Device</legend>
              {devices.map((d, i) => (
                <label
                  key={d.id}
                  htmlFor={`kc-otp-credential-${i}`}
                  className='flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 has-checked:border-primary'
                >
                  <input
                    id={`kc-otp-credential-${i}`}
                    type='radio'
                    name='selectedCredentialId'
                    value={d.id}
                    defaultChecked={d.id === otpLogin.selectedCredentialId}
                    className='accent-primary'
                  />
                  {d.userLabel}
                </label>
              ))}
            </fieldset>
          </details>
        )}

        <button
          type='submit'
          id='kc-login'
          name='login'
          disabled={isSubmitting}
          className={primaryButton}
        >
          Sign in
        </button>
      </form>
    </Template>
  )
}
