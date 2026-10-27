import { useState } from 'react'
import type { PageProps } from 'keycloakify/login/pages/PageProps'
import type { KcContext } from '../KcContext'
import type { I18n } from '../i18n'
import { primaryButton, quietLink, secondaryButton } from '../ui'

type Props = PageProps<
  Extract<KcContext, { pageId: 'login-recovery-authn-code-config.ftl' }>,
  I18n
>

// One line, the codes and one button. "Continue" works only after the
// person says they saved the codes, as on Keycloak's own page.
export default function LoginRecoveryAuthnCodeConfig(props: Props) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props
  const { url, isAppInitiatedAction, message, recoveryAuthnCodesConfigBean } =
    kcContext
  const { msgStr } = i18n
  const codes = recoveryAuthnCodesConfigBean.generatedRecoveryAuthnCodesList.map(
    (c) => `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`
  )
  const text = codes.map((c, i) => `${i + 1}. ${c}`).join('\n')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
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
      headerNode='Save your recovery codes'
      displayMessage={message?.type === 'error'}
    >
      <p className='mb-4 text-muted-foreground'>
        Each code signs you in once if you lose your phone. You see them only
        now.
      </p>

      <ol
        id='kc-recovery-codes-list'
        className='m-0! mb-3! grid list-none! grid-cols-2 gap-x-3 gap-y-1 space-y-0! rounded-md border bg-muted/50 p-3 ps-3! font-mono'
      >
        {codes.map((c, i) => (
          <li key={c} className='m-0! flex gap-2 text-xs! whitespace-nowrap text-foreground!'>
            <span aria-hidden className='w-4 text-end text-muted-foreground'>
              {i + 1}
            </span>
            <code>{c}</code>
          </li>
        ))}
      </ol>

      <div className='mb-6 flex gap-2'>
        <button
          type='button'
          id='copyRecoveryCodes'
          onClick={copy}
          className={`${secondaryButton} h-8! text-xs`}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        <a
          id='downloadRecoveryCodes'
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(`Arc Forge recovery codes\n\n${text}\n`)}`}
          download='arc-forge-recovery-codes.txt'
          className={`${secondaryButton} h-8! text-xs`}
        >
          Download
        </a>
      </div>

      <form
        action={url.loginAction}
        id='kc-recovery-codes-settings-form'
        method='post'
        className='flex flex-col gap-4'
      >
        <input
          type='hidden'
          name='generatedRecoveryAuthnCodes'
          value={recoveryAuthnCodesConfigBean.generatedRecoveryAuthnCodesAsString}
        />
        <input
          type='hidden'
          name='generatedAt'
          value={recoveryAuthnCodesConfigBean.generatedAt}
        />
        <input
          type='hidden'
          id='userLabel'
          name='userLabel'
          value={msgStr('recovery-codes-label-default')}
        />
        <label className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            id='kcRecoveryCodesConfirmationCheck'
            checked={saved}
            onChange={(e) => setSaved(e.target.checked)}
            className='size-4 accent-primary'
          />
          I saved these codes
        </label>
        <button
          type='submit'
          id='saveRecoveryAuthnCodesBtn'
          disabled={!saved}
          className={primaryButton}
        >
          Continue
        </button>
        {isAppInitiatedAction && (
          <button
            type='submit'
            id='cancelRecoveryAuthnCodesBtn'
            name='cancel-aia'
            value='true'
            className={quietLink}
          >
            Not now
          </button>
        )}
      </form>
    </Template>
  )
}
