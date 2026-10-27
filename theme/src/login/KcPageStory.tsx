import { createGetKcContextMock } from 'keycloakify/login/KcContext'
import { kcEnvDefaults, themeNames } from '../kc.gen'
import type {
  KcContextExtension,
  KcContextExtensionPerPage,
} from './KcContext'

const kcContextExtension: KcContextExtension = {
  themeName: themeNames[0],
  properties: { ...kcEnvDefaults },
}
const kcContextExtensionPerPage: KcContextExtensionPerPage = {}

const noSignUp = {
  registrationAllowed: false,
  resetPasswordAllowed: true,
  rememberMe: true,
}

// Mock data for `pnpm dev` and screenshots. Matches our realm: no sign-up,
// passkeys on, reset password on.
export const { getKcContextMock } = createGetKcContextMock({
  kcContextExtension,
  kcContextExtensionPerPage,
  overrides: {
    realm: {
      name: 'arcforge',
      displayName: 'Arc Forge',
      internationalizationEnabled: false,
    },
    locale: undefined,
  },
  overridesPerPage: {
    'login.ftl': { realm: noSignUp },
    'login-username.ftl': { realm: noSignUp },
    'login-password.ftl': { realm: noSignUp },
  },
})
