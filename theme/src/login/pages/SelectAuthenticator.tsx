import type { PageProps } from 'keycloakify/login/pages/PageProps'
import type { KcContext } from '../KcContext'
import type { I18n } from '../i18n'

type Props = PageProps<
  Extract<KcContext, { pageId: 'select-authenticator.ftl' }>,
  I18n
>

// Keycloak names some options in its own words ("Recovery Authentication
// Code"), so the page names each kind of option itself.
const named: Record<string, [string, string]> = {
  kcAuthenticatorOTPClass: [
    'Authenticator app',
    'A code from the app on your phone.',
  ],
  kcAuthenticatorWebAuthnClass: [
    'Passkey',
    'Your fingerprint, face or screen lock.',
  ],
  kcAuthenticatorWebAuthnPasswordlessClass: [
    'Passkey',
    'Your fingerprint, face or screen lock.',
  ],
  kcAuthenticatorPasswordClass: ['Password', 'The password for your account.'],
  recovery: ['Recovery code', 'One of the codes you saved at set-up.'],
}

// One list: one tap per way to sign in.
export default function SelectAuthenticator(props: Props) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props
  const { url, auth } = kcContext
  const { advancedMsgStr } = i18n

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode='Choose how to sign in'
    >
      <form
        id='kc-select-credential-form'
        action={url.loginAction}
        method='post'
        className='flex flex-col gap-2'
      >
        {auth.authenticationSelections.map((s) => {
          const shown = advancedMsgStr(s.displayName)
          const kind = /recovery/i.test(`${s.displayName} ${shown}`)
            ? 'recovery'
            : (s.iconCssClass ?? '')
          const [title, help] = named[kind] ?? [
            shown,
            advancedMsgStr(s.helpText),
          ]
          return (
            <button
              key={s.authExecId}
              type='submit'
              name='authenticationExecution'
              value={s.authExecId}
              className='flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-lg border p-3 text-start hover:bg-accent'
            >
              <span className='text-sm font-medium'>{title}</span>
              <span className='text-xs text-muted-foreground'>{help}</span>
            </button>
          )
        })}
      </form>
    </Template>
  )
}
