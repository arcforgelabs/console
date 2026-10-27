import type { PageProps } from 'keycloakify/login/pages/PageProps'
import type { KcContext } from '../KcContext'
import type { I18n } from '../i18n'
import { primaryButton, quietLink } from '../ui'

type Props = PageProps<
  Extract<KcContext, { pageId: 'webauthn-register.ftl' }>,
  I18n
>

const authButtonId = 'authenticateWebAuthnButton'

// A name no other passkey of this person has: Keycloak refuses a second
// passkey with the same name.
function passkeyName(now = new Date()) {
  return `Passkey ${now.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}`
}

// Keycloak's own registerByWebAuthn (as Keycloakify's useScript calls it),
// but with a unique name. Its script asks for the name with window.prompt;
// this page answers with that name, so the person sees only the passkey
// prompt from the browser. One attempt per page: a second click while the
// first runs would make Keycloak's script post an error and leave the page.
let started = false
async function register(kcContext: Props['kcContext'], errmsg: string) {
  if (started) return
  started = true
  const src = `${kcContext.url.resourcesPath}/js/webauthnRegister.js`
  const { registerByWebAuthn } = await import(/* @vite-ignore */ src)
  const label = passkeyName()
  window.prompt = () => label
  registerByWebAuthn({
    challenge: kcContext.challenge,
    userid: kcContext.userid,
    username: kcContext.username,
    signatureAlgorithms: kcContext.signatureAlgorithms,
    rpEntityName: kcContext.rpEntityName,
    rpId: kcContext.rpId,
    attestationConveyancePreference: kcContext.attestationConveyancePreference,
    authenticatorAttachment: kcContext.authenticatorAttachment,
    requireResidentKey: kcContext.requireResidentKey,
    residentKey: kcContext.residentKey,
    userVerificationRequirement: kcContext.userVerificationRequirement,
    createTimeout: kcContext.createTimeout,
    excludeCredentialIds: kcContext.excludeCredentialIds,
    initLabel: label,
    initLabelPrompt: '',
    errmsg,
  })
}

// One line and one button. The browser shows the passkey prompt.
export default function WebauthnRegister(props: Props) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props
  const { url, isSetRetry, isAppInitiatedAction } = kcContext
  const { msgStr } = i18n

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={msgStr('webauthn-registration-title')}
    >
      <p className='mb-6 text-muted-foreground'>
        Your device asks for your fingerprint, face or screen lock.
      </p>
      <form id='register' action={url.loginAction} method='post'>
        <input type='hidden' id='clientDataJSON' name='clientDataJSON' />
        <input type='hidden' id='attestationObject' name='attestationObject' />
        <input
          type='hidden'
          id='publicKeyCredentialId'
          name='publicKeyCredentialId'
        />
        <input
          type='hidden'
          id='authenticatorLabel'
          name='authenticatorLabel'
        />
        <input type='hidden' id='transports' name='transports' />
        <input
          type='hidden'
          id='authenticatorAttachment'
          name='authenticatorAttachment'
        />
        <input type='hidden' id='error' name='error' />
      </form>
      <button
        type='button'
        id={authButtonId}
        className={primaryButton}
        onClick={() =>
          register(kcContext, msgStr('webauthn-unsupported-browser-text'))
        }
      >
        Add a passkey
      </button>

      {!isSetRetry && isAppInitiatedAction && (
        <form
          action={url.loginAction}
          id='kc-webauthn-settings-form'
          method='post'
          className='mt-4 text-center'
        >
          <button
            type='submit'
            id='cancelWebAuthnAIA'
            name='cancel-aia'
            value='true'
            className={quietLink}
          >
            Not now
          </button>
        </form>
      )}
    </Template>
  )
}
