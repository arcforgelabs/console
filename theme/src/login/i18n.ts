import { i18nBuilder } from 'keycloakify/login'
import type { ThemeName } from '../kc.gen'

// Our wording overrides Keycloak's default English messages.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- ofTypeI18n is only read as a type
const { useI18n, ofTypeI18n } = i18nBuilder
  .withThemeName<ThemeName>()
  .withCustomTranslations({
    en: {
      loginAccountTitle: 'Sign in to Arc Forge',
      loginTitle: 'Arc Forge sign-in',
      loginTitleHtml: 'Arc Forge',
      doLogIn: 'Sign in',
      'identity-provider-login-label': 'Or sign in with',
      loginTotpTitle: 'Set up two-step verification',
      'webauthn-passwordless-login-title': 'Sign in with a passkey',
      'webauthn-registration-title': 'Add a passkey',
      doForgotPassword: 'Forgot password?',
      doTryAnotherWay: 'Try another way',
      configureTotpMessage:
        'Your account needs two-step sign-in. It takes about a minute.',
    },
  })
  .build()

type I18n = typeof ofTypeI18n

export { useI18n, type I18n }
