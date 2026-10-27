import type { ExtendKcContext } from 'keycloakify/login'
import type { KcEnvName, ThemeName } from '../kc.gen'

export type KcContextExtension = {
  themeName: ThemeName
  properties: Record<KcEnvName, string>
}

export type KcContextExtensionPerPage = {
  // Keycloak sets it once the email is sent (login-verify-email.ftl).
  'login-verify-email.ftl': { verifyEmail?: string }
}

export type KcContext = ExtendKcContext<
  KcContextExtension,
  KcContextExtensionPerPage
>
