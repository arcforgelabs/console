import { useState } from 'react'
import { demo } from '@/lib/api'
import {
  type ModelPayer,
  type ModelSettings as Settings,
  useModelSettings,
  usePreviewModelSettings,
} from '@/lib/model-settings-api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { More } from '@/components/more'
import { QueryView } from '@/components/page'

const choices: { value: ModelPayer; label: string; detail: string }[] = [
  {
    value: 'included',
    label: 'Included plan',
    detail: 'Preview model use paid from the Arc Forge plan.',
  },
  {
    value: 'own',
    label: 'Own subscription',
    detail: 'Preview model use paid from your own model account.',
  },
  {
    value: 'both',
    label: 'Both',
    detail: 'Proposed order: included plan first, then your own subscription.',
  },
]
export function ModelSettings() {
  const query = useModelSettings()
  return (
    <QueryView query={query} what='Model settings'>
      {(data) => <Choices settings={data} />}
    </QueryView>
  )
}
function Choices({ settings }: { settings: Settings }) {
  const [payer, setPayer] = useState(settings.payer)
  const preview = usePreviewModelSettings()
  const [saved, setSaved] = useState(false)
  return (
    <form
      className='space-y-4'
      onSubmit={async (e) => {
        e.preventDefault()
        try {
          await preview.mutateAsync(payer)
          setSaved(true)
        } catch {
          /* Shown below. */
        }
      }}
    >
      <fieldset className='space-y-2'>
        <legend className='mb-3 font-medium'>Who pays for model use?</legend>
        {choices.map((c) => (
          <label
            key={c.value}
            className={cn(
              'flex cursor-pointer gap-3 rounded-lg border p-3',
              payer === c.value && 'border-ring ring-1 ring-ring'
            )}
          >
            <input
              type='radio'
              name='model-payer'
              value={c.value}
              checked={payer === c.value}
              onChange={() => {
                setPayer(c.value)
                setSaved(false)
              }}
              className='mt-1 shrink-0'
            />
            <span>
              <span className='block text-sm font-medium'>{c.label}</span>
              <span className='block text-xs text-muted-foreground'>
                {c.detail}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      {payer !== 'included' && !settings.ownConnected && (
        <p role='status' className='text-sm'>
          No own subscription is connected. This preview does not connect an
          account or route any request.
        </p>
      )}
      <More label='More options'>
        <p className='text-sm text-muted-foreground'>
          Spend caps, prices and per-claw choices are not decided. No limit or
          routing rule is set here. Connection credentials do not belong in the
          console.
        </p>
      </More>
      <p className='text-xs text-muted-foreground'>
        Demo only. A preview changes no bill or routing. Reload resets it.
      </p>
      {preview.error && <p role='alert'>{preview.error.message}</p>}
      {saved && (
        <p role='status'>Demo choice saved for this page session only.</p>
      )}
      <Button type='submit' disabled={!demo || preview.isPending}>
        {preview.isPending ? 'Please wait' : 'Preview choice'}
      </Button>
    </form>
  )
}
