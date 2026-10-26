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

// Two-step setup in three short steps: get an app, add the key, type the
// code. Same form fields as Keycloak's page (totp, totpSecret, userLabel,
// logout-sessions), so the server side does not change.
export default function LoginConfigTotp(props: Props) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props
  const { url, isAppInitiatedAction, totp, mode, messagesPerField } =
    kcContext
  const { msgStr, advancedMsgStr } = i18n
  const manual = mode === 'manual'
  const [copied, setCopied] = useState(false)
  const nameRequired = totp.otpCredentials.length >= 1
  const apps = totp.supportedApplications.map((a) => advancedMsgStr(a))

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
      displayMessage={!messagesPerField.existsError('totp', 'userLabel')}
    >
      <ol className='m-0! list-none! space-y-6 ps-0!'>
        <Step n={1} title='Open an authenticator app'>
          <p>Use the app you have, or install one: {apps.join(', ')}.</p>
        </Step>

        <Step
          n={2}
          title={manual ? 'Add this key to the app' : 'Scan this code'}
        >
          {manual ? (
            <>
              <div className='flex items-center gap-2 rounded-md border bg-muted/50 p-2'>
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
              <p className='mt-2'>
                {totp.policy.digits} digits,{' '}
                {totp.policy.type === 'totp'
                  ? `new code every ${totp.policy.period} seconds.`
                  : 'counter-based.'}{' '}
                <a href={totp.qrUrl} id='mode-barcode'>
                  Scan a code instead
                </a>
              </p>
            </>
          ) : (
            <>
              <img
                id='kc-totp-secret-qr-code'
                src={`data:image/png;base64, ${totp.totpSecretQrCode}`}
                alt='QR code to add Arc Forge to your authenticator app'
                className='mx-0! my-2! size-44 rounded-lg bg-white p-2'
              />
              <p>
                <a href={totp.manualUrl} id='mode-manual'>
                  Can&apos;t scan? Type a key instead
                </a>
              </p>
            </>
          )}
        </Step>

        <Step n={3} title='Type the 6-digit code from the app'>
          <form
            action={url.loginAction}
            id='kc-totp-settings-form'
            method='post'
            className='mt-2 flex flex-col gap-4'
          >
            <div className='flex flex-col gap-1.5'>
              <label htmlFor='totp' className='sr-only'>
                {msgStr('authenticatorCode')}
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

            <div className='flex flex-col gap-1.5'>
              <label htmlFor='userLabel' className='text-sm font-medium'>
                Name this device{' '}
                {!nameRequired && (
                  <span className='font-normal text-muted-foreground'>
                    (optional)
                  </span>
                )}
              </label>
              <input
                type='text'
                id='userLabel'
                name='userLabel'
                autoComplete='off'
                placeholder='For example: My phone'
                required={nameRequired}
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

            <label className='flex items-center gap-2 text-sm text-muted-foreground'>
              <input
                type='checkbox'
                id='logout-sessions'
                name='logout-sessions'
                value='on'
              />
              {msgStr('logoutOtherSessions')}
            </label>

            <div className='flex flex-col gap-2'>
              <button
                type='submit'
                id='saveTOTPBtn'
                className='inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90'
              >
                Verify and finish
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
        </Step>
      </ol>
    </Template>
  )
}

function Step(props: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className='grid grid-cols-[1.75rem_1fr] gap-x-3'>
      <span
        aria-hidden
        className='flex size-7 items-center justify-center rounded-full border text-xs font-semibold'
      >
        {props.n}
      </span>
      <div className='min-w-0'>
        <h2 className='pt-0.5 text-sm font-medium text-foreground'>
          {props.title}
        </h2>
        <div className='mt-1'>{props.children}</div>
      </div>
    </li>
  )
}
