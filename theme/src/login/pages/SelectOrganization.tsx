import { useRef, useState } from 'react'
import type { PageProps } from 'keycloakify/login/pages/PageProps'
import type { KcContext } from '../KcContext'
import type { I18n } from '../i18n'
import { secondaryButton } from '../ui'

type Props = PageProps<
  Extract<KcContext, { pageId: 'select-organization.ftl' }>,
  I18n
>

// One list, one tap per organisation.
export default function SelectOrganization(props: Props) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props
  const { url, user } = kcContext
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const orgRef = useRef<HTMLInputElement>(null)

  function choose(alias: string) {
    if (!formRef.current || !orgRef.current) return
    orgRef.current.value = alias
    setIsSubmitting(true)
    formRef.current.requestSubmit()
  }

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode='Choose an organisation'
    >
      <form ref={formRef} action={url.loginAction} method='post'>
        <ul id='kc-user-organizations' className='flex flex-col gap-2'>
          {(user.organizations ?? []).map(({ alias, name }) => (
            <li key={alias}>
              <button
                id={`organization-${alias}`}
                type='button'
                onClick={() => choose(alias)}
                disabled={isSubmitting}
                className={`${secondaryButton} justify-start`}
              >
                {name ?? alias}
              </button>
            </li>
          ))}
        </ul>
        <input ref={orgRef} type='hidden' name='kc.org' />
      </form>
    </Template>
  )
}
