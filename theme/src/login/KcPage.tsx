import { Suspense, lazy } from 'react'
import type { ClassKey } from 'keycloakify/login'
import DefaultPage from 'keycloakify/login/DefaultPage'
import type { KcContext } from './KcContext'
import Template from './Template'
import { useI18n } from './i18n'

const LoginConfigTotp = lazy(() => import('./pages/LoginConfigTotp'))
const LoginOtp = lazy(() => import('./pages/LoginOtp'))
const LoginResetPassword = lazy(() => import('./pages/LoginResetPassword'))
const LoginVerifyEmail = lazy(() => import('./pages/LoginVerifyEmail'))
const SelectOrganization = lazy(() => import('./pages/SelectOrganization'))
const WebauthnRegister = lazy(() => import('./pages/WebauthnRegister'))
const UserProfileFormFields = lazy(
  () => import('keycloakify/login/UserProfileFormFields')
)

// Pages use Keycloakify's own page logic (passkeys, organisations and so
// on) with our Template and these classes. Pages in pages/ replace
// Keycloakify's page for the same pageId: one instruction, one action,
// extras behind a tap. Keycloak's default CSS is off.
export default function KcPage({ kcContext }: { kcContext: KcContext }) {
  const { i18n } = useI18n({ kcContext })
  const common = {
    i18n,
    classes,
    Template,
    doUseDefaultCss: false,
  }
  return (
    <Suspense>
      {(() => {
        switch (kcContext.pageId) {
          case 'login-config-totp.ftl':
            return <LoginConfigTotp kcContext={kcContext} {...common} />
          case 'login-otp.ftl':
            return <LoginOtp kcContext={kcContext} {...common} />
          case 'login-reset-password.ftl':
            return <LoginResetPassword kcContext={kcContext} {...common} />
          case 'login-verify-email.ftl':
            return <LoginVerifyEmail kcContext={kcContext} {...common} />
          case 'select-organization.ftl':
            return <SelectOrganization kcContext={kcContext} {...common} />
          case 'webauthn-register.ftl':
            return <WebauthnRegister kcContext={kcContext} {...common} />
          default:
            return (
              <DefaultPage
                kcContext={kcContext}
                {...common}
                UserProfileFormFields={UserProfileFormFields}
                doMakeUserConfirmPassword
              />
            )
        }
      })()}
    </Suspense>
  )
}

const input =
  'h-10 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm'
const button =
  'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer'

const classes = {
  kcFormGroupClass: 'mb-4 flex flex-col gap-2',
  kcLabelWrapperClass: '',
  kcLabelClass: 'text-sm font-medium',
  kcInputWrapperClass: 'flex flex-col gap-1.5',
  kcInputClass: input,
  kcInputGroup: 'relative flex items-center',
  kcInputErrorMessageClass: 'text-sm text-destructive',
  kcInputHelperTextBeforeClass: 'text-xs text-muted-foreground',
  kcInputHelperTextAfterClass: 'text-xs text-muted-foreground',
  kcFormPasswordVisibilityButtonClass:
    'absolute end-1 flex size-8 items-center justify-center rounded text-muted-foreground hover:text-foreground cursor-pointer',
  kcFormPasswordVisibilityIconShow: 'af-icon af-eye',
  kcFormPasswordVisibilityIconHide: 'af-icon af-eye-off',
  kcFormSettingClass:
    'mb-4 flex flex-wrap items-center justify-between gap-2 text-sm',
  kcFormOptionsClass: '',
  kcFormOptionsWrapperClass: 'text-sm',
  kcFormButtonsClass: 'mt-2 flex flex-col gap-2',
  kcFormButtonsWrapperClass: 'flex flex-col gap-2',
  kcCheckboxInputClass: 'size-4 accent-primary',
  kcButtonClass: button,
  kcButtonPrimaryClass:
    'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
  kcButtonSecondaryClass:
    'border bg-background text-foreground shadow-xs hover:bg-accent',
  kcButtonDefaultClass:
    'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
  kcButtonBlockClass: 'w-full',
  kcButtonLargeClass: '',
  kcAlertClass: '',
  kcSignUpClass: 'mt-6 text-center text-sm text-muted-foreground',
  kcInfoAreaWrapperClass: '',
  kcFormSocialAccountSectionClass: 'mt-6',
  kcFormSocialAccountListClass: 'flex flex-col gap-2',
  kcFormSocialAccountListGridClass: 'grid grid-cols-2 gap-2',
  kcFormSocialAccountListButtonClass: `${button} w-full border bg-background hover:bg-accent`,
  kcFormSocialAccountGridItem: '',
  kcFormSocialAccountNameClass: '',
  kcCommonLogoIdP: 'hidden',
  kcSelectAuthListClass: 'flex flex-col gap-2',
  kcSelectAuthListItemClass:
    'flex w-full items-center gap-3 rounded-lg border p-3 text-start hover:bg-accent cursor-pointer',
  kcSelectAuthListItemTitle: 'text-sm font-medium',
  kcSelectAuthListItemDescriptionClass: 'text-xs text-muted-foreground',
  kcSelectAuthListItemFillClass: 'hidden',
  kcSelectAuthListItemArrowClass: 'hidden',
  kcSelectAuthListItemArrowIconClass: 'hidden',
  kcSelectAuthListItemIconClass: 'hidden',
  kcSelectAuthListItemIconPropertyClass: 'hidden',
  kcSelectAuthListItemBodyClass: 'flex-1',
  kcWebAuthnKeyIcon: 'hidden',
  kcWebAuthnDefaultIcon: 'hidden',
  kcFormClass: '',
  kcFormHeaderClass: '',
  kcContentWrapperClass: '',
  kcTextareaClass: `${input} h-auto min-h-24 py-2`,
} satisfies { [key in ClassKey]?: string }
