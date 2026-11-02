import { useState } from 'react'
import { demo, useClaws } from '@/lib/api'
import { useCreateSupport } from '@/lib/support-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { More } from '@/components/more'
import { QueryView } from '@/components/page'

export function NewRequest() {
  const [open, setOpen] = useState(false)
  const claws = useClaws()
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>New request</Button>
      </SheetTrigger>
      <SheetContent className='w-full overflow-y-auto sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>New support request</SheetTitle>
          <SheetDescription>
            Demo only. Nothing is sent to support. Changes reset on reload. Do
            not enter secrets or personal data.
          </SheetDescription>
        </SheetHeader>
        <div className='px-4 pb-4'>
          <QueryView query={claws} what='The claw list'>
            {(items) =>
              open && <RequestForm claws={items} done={() => setOpen(false)} />
            }
          </QueryView>
        </div>
      </SheetContent>
    </Sheet>
  )
}
function RequestForm({
  claws,
  done,
}: {
  claws: { name: string; label: string }[]
  done: () => void
}) {
  const create = useCreateSupport()
  const [claw, setClaw] = useState(claws[0]?.name ?? '')
  const [details, setDetails] = useState('')
  const [app, setApp] = useState('')
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal')
  return (
    <form
      className='space-y-5'
      onSubmit={async (e) => {
        e.preventDefault()
        try {
          await create.mutateAsync({ claw, details, app, priority })
          done()
        } catch {
          /* Shown below. */
        }
      }}
    >
      <p className='text-sm'>
        Claw: {claws.find((c) => c.name === claw)?.label ?? 'No claw available'}
      </p>
      <div className='space-y-2'>
        <Label htmlFor='support-details'>What went wrong?</Label>
        <Textarea
          id='support-details'
          required
          maxLength={4000}
          rows={6}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </div>
      <More label='More options'>
        <div className='space-y-3'>
          <div>
            <Label htmlFor='support-claw'>Claw</Label>
            <select
              id='support-claw'
              className='mt-2 block w-full rounded-md border bg-background p-2'
              value={claw}
              onChange={(e) => setClaw(e.target.value)}
            >
              {claws.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor='support-app'>App name (optional)</Label>
            <Input
              id='support-app'
              maxLength={100}
              value={app}
              onChange={(e) => setApp(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor='support-priority'>Requested priority</Label>
            <select
              id='support-priority'
              className='mt-2 block w-full rounded-md border bg-background p-2'
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value === 'urgent' ? 'urgent' : 'normal')
              }
            >
              <option value='normal'>Normal</option>
              <option value='urgent'>Urgent</option>
            </select>
          </div>
          <p className='text-xs text-muted-foreground'>
            Priority is a preference only. File attachments need the support
            connection and are not available in this demo.
          </p>
        </div>
      </More>
      {create.error && (
        <p role='alert' className='text-sm text-destructive'>
          {create.error.message}
        </p>
      )}
      {!demo && (
        <p>
          The support service is not connected. Try again after it is connected.
        </p>
      )}
      <Button
        type='submit'
        className='w-full'
        disabled={!demo || !claw || !details.trim() || create.isPending}
      >
        {create.isPending ? 'Please wait' : 'Preview request'}
      </Button>
    </form>
  )
}
