import { useState } from 'react'
import { Globe, KeyRound, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { type Claw, useClaws, useNameCheck } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Page, QueryView } from '@/components/page'

const zone = 'arcforge.space'

// Until the support connection exists, a request stops here and says so.
// Arc Forge support approves each request; the platform makes it real
// (platform#564).
const notConnected =
  'Requests go to Arc Forge support with the support connection.'

export function Addresses() {
  const query = useClaws()
  return (
    <Page
      title='Addresses'
      description='Each claw has a permanent address, an optional name you pick, and optional domains of your own.'
    >
      <QueryView query={query} what='The address list'>
        {(claws) => (
          <div className='grid max-w-3xl gap-4'>
            {claws.map((claw) => (
              <AddressCard key={claw.name} claw={claw} />
            ))}
          </div>
        )}
      </QueryView>
    </Page>
  )
}

function AddressCard({ claw }: { claw: Claw }) {
  const [renaming, setRenaming] = useState(false)
  const [adding, setAdding] = useState(false)
  const a = claw.addresses
  if (!a)
    return (
      <Card>
        <CardHeader>
          <CardTitle>{claw.label}</CardTitle>
          <CardDescription>
            Addresses for this claw come in a later release.
          </CardDescription>
        </CardHeader>
      </Card>
    )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{claw.label}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-5'>
        <Row
          icon={<KeyRound className='size-4' />}
          label='Permanent address'
          value={a.permanent}
          note='Never changes. Arc Forge support uses it.'
        />
        <Row
          icon={<Globe className='size-4' />}
          label='Your name'
          value={a.chosenName ? `${a.chosenName}.${zone}` : 'None yet'}
          mono={Boolean(a.chosenName)}
          note={
            a.chosenName
              ? 'Your main address. Old names keep working for 90 days after a rename.'
              : 'Pick one name that people can read.'
          }
          action={
            <Button
              variant='outline'
              size='sm'
              onClick={() => setRenaming(true)}
            >
              <Pencil /> {a.chosenName ? 'Rename' : 'Pick a name'}
            </Button>
          }
        />
        <div className='space-y-2'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <div className='text-sm font-medium'>Your own domains</div>
            <Button variant='outline' size='sm' onClick={() => setAdding(true)}>
              <Plus /> Add a domain
            </Button>
          </div>
          {a.domains.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              None. You can point a domain you own, such as
              chat.yourcompany.com, at this claw.
            </p>
          ) : (
            <ul className='divide-y rounded-lg border'>
              {a.domains.map((d) => (
                <li key={d.hostname} className='space-y-1 px-3 py-2'>
                  <div className='font-mono text-sm break-all'>
                    {d.hostname}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    At your DNS provider:{' '}
                    <span className='font-mono break-all'>
                      CNAME {d.hostname} → {d.cnameTarget}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
      <NameDialog claw={claw} open={renaming} onOpenChange={setRenaming} />
      <DomainDialog claw={claw} open={adding} onOpenChange={setAdding} />
    </Card>
  )
}

function Row(props: {
  icon: React.ReactNode
  label: string
  value: string
  note: string
  mono?: boolean
  action?: React.ReactNode
}) {
  return (
    <div className='flex flex-wrap items-start gap-3'>
      <div className='mt-0.5 text-muted-foreground'>{props.icon}</div>
      <div className='min-w-0 flex-1'>
        <div className='text-sm font-medium'>{props.label}</div>
        <div
          className={
            props.mono === false ? 'text-sm' : 'font-mono text-sm break-all'
          }
        >
          {props.value}
        </div>
        <div className='text-xs text-muted-foreground'>{props.note}</div>
      </div>
      {props.action}
    </div>
  )
}

function NameDialog({
  claw,
  open,
  onOpenChange,
}: {
  claw: Claw
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState('')
  const wanted = name.trim().toLowerCase()
  const check = useNameCheck(wanted)
  const status = !wanted
    ? ''
    : check.isPending
      ? 'Checking…'
      : check.data?.available
        ? `${wanted}.${zone} is free.`
        : check.data?.reason === 'shape'
          ? 'Use 3 to 32 letters, numbers or single hyphens, starting with a letter.'
          : check.data
            ? 'That name is taken. Try another.'
            : 'The check did not answer. Try again.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {claw.addresses?.chosenName ? 'Rename' : 'Pick a name'}
          </DialogTitle>
          <DialogDescription>
            Arc Forge support approves each name. After a rename, the old name
            sends people to the new one for 90 days.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          <Label htmlFor='chosen-name'>Name</Label>
          <div className='flex items-center gap-2'>
            <Input
              id='chosen-name'
              value={name}
              autoComplete='off'
              spellCheck={false}
              onChange={(e) => setName(e.target.value)}
            />
            <span className='shrink-0 font-mono text-sm text-muted-foreground'>
              .{zone}
            </span>
          </div>
          <p role='status' className='min-h-5 text-sm text-muted-foreground'>
            {status}
          </p>
        </div>
        <DialogFooter>
          <Button
            disabled={!check.data?.available}
            onClick={() => {
              toast(notConnected)
              onOpenChange(false)
            }}
          >
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const hostname = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.){2,8}[a-z]{2,63}$/

function DomainDialog({
  claw,
  open,
  onOpenChange,
}: {
  claw: Claw
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [domain, setDomain] = useState('')
  const d = domain.trim().toLowerCase()
  const ok = hostname.test(d) && !d.endsWith(`.${zone}`)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a domain</DialogTitle>
          <DialogDescription>
            Use a subdomain you own, such as chat.yourcompany.com. Arc Forge
            support approves it; then you add one DNS record.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          <Label htmlFor='own-domain'>Domain</Label>
          <Input
            id='own-domain'
            value={domain}
            autoComplete='off'
            spellCheck={false}
            onChange={(e) => setDomain(e.target.value)}
          />
          <p className='text-sm text-muted-foreground'>
            {d && !ok
              ? 'Use a full subdomain, such as chat.yourcompany.com.'
              : `The record: CNAME ${d || 'chat.yourcompany.com'} → ${claw.addresses?.permanent}`}
          </p>
        </div>
        <DialogFooter>
          <Button
            disabled={!ok}
            onClick={() => {
              toast(notConnected)
              onOpenChange(false)
            }}
          >
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
