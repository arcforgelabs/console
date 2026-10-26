import { useState } from 'react'
import { kcSanitize } from 'keycloakify/lib/kcSanitize'
import type { PageProps } from 'keycloakify/login/pages/PageProps'
import type { KcContext } from '../KcContext'
import type { I18n } from '../i18n'

type Props = PageProps<
  Extract<KcContext, { pageId: 'login-config-totp.ftl' }>,
  I18n
>

const input =
  'h-10 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm'

// One instruction, the QR code and the code box. The setup key stays behind
// "Can't scan?". Same form fields as Keycloak's page (totp, totpSecret,
// userLabel), so the server side does not change.
export default function LoginConfigTotp(props: Props) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props
  const { url, isAppInitiatedAction, totp, mode, message, messagesPerField } =
    kcContext
  const { msgStr } = i18n
  const [copied, setCopied] = useState(false)
  // Keycloak needs a name only when the account already has a code app.
  const nameRequired = totp.otpCredentials.length >= 1

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(
        totp.totpSecretEncoded.replace(/\s/g, '')
      )
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode='Set up two-step sign-in'
      displayMessage={
        message?.type === 'error' &&
        !messagesPerField.existsError('totp', 'userLabel')
      }
    >
      <p className='text-center'>
        Scan this code with your authenticator app.
      </p>

      <img
        id='kc-totp-secret-qr-code'
        src={`data:image/png;base64, ${totp.totpSecretQrCode}`}
        alt='QR code to add Arc Forge to your authenticator app'
        className='mx-auto! my-4! size-48 rounded-lg bg-white p-2'
      />

      <details
        className='group mb-6 text-sm'
        open={mode === 'manual' || undefined}
      >
        <summary className='cursor-pointer text-center text-muted-foreground hover:text-foreground'>
          Can&apos;t scan? Use a setup key
        </summary>
        <div className='mt-3 flex items-center gap-2 rounded-md border bg-muted/50 p-2'>
          <code
            id='kc-totp-secret-key'
            className='min-w-0 flex-1 text-center tracking-wider'
          >
            {totp.totpSecretEncoded}
          </code>
          <button
            type='button'
            onClick={copyKey}
            className='shrink-0 rounded border bg-background px-2 py-1 text-xs hover:bg-accent'
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </details>

      <form
        action={url.loginAction}
        id='kc-totp-settings-form'
        method='post'
        className='flex flex-col gap-4'
      >
        <div className='flex flex-col gap-1.5'>
          <label htmlFor='totp' className='text-sm font-medium'>
            Code from the app
          </label>
          <input
            type='text'
            id='totp'
            name='totp'
            inputMode='numeric'
            autoComplete='one-time-code'
            pattern='[0-9]*'
            maxLength={totp.policy.digits}
            placeholder='123456'
            required
            autoFocus
            className={`${input} h-12 text-center font-mono text-xl! tracking-[0.4em]`}
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
          <input
            type='hidden'
            id='totpSecret'
            name='totpSecret'
            value={totp.totpSecret}
          />
          {mode && <input type='hidden' id='mode' value={mode} />}
        </div>

        {nameRequired && (
          <div className='flex flex-col gap-1.5'>
            <label htmlFor='userLabel' className='text-sm font-medium'>
              Name this device
            </label>
            <input
              type='text'
              id='userLabel'
              name='userLabel'
              autoComplete='off'
              placeholder='For example: My phone'
              required
              className={input}
              aria-invalid={messagesPerField.existsError('userLabel')}
            />
            {messagesPerField.existsError('userLabel') && (
              <span
                id='input-error-otp-label'
                className='text-sm text-destructive'
                aria-live='polite'
                dangerouslySetInnerHTML={{
                  __html: kcSanitize(messagesPerField.get('userLabel')),
                }}
              />
            )}
          </div>
        )}

        <div className='flex flex-col gap-2'>
          <button
            type='submit'
            id='saveTOTPBtn'
            className='inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90'
          >
            Verify
          </button>
          {isAppInitiatedAction && (
            <button
              type='submit'
              id='cancelTOTPBtn'
              name='cancel-aia'
              value='true'
              className='inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-md border bg-background px-4 text-sm font-medium hover:bg-accent'
            >
              {msgStr('doCancel')}
            </button>
          )}
        </div>
      </form>
    </Template>
  )
}
