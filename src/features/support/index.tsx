import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  type SupportRequest,
  type SupportState,
  useSupport,
} from '@/lib/console-api'
import { since } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { More } from '@/components/more'
import { Page, QueryView } from '@/components/page'

const stateLabel: Record<SupportState, string> = {
  new: 'New',
  fixing: 'Fixing',
  waiting: 'Your reply',
  live: 'Live · rate it',
  closed: 'Closed',
}

export function Support() {
  const query = useSupport()
  return (
    <Page
      title='Support'
      actions={
        <Button
          onClick={() =>
            toast('New requests come with the support connection.')
          }
        >
          <Plus /> New request
        </Button>
      }
    >
      <QueryView query={query} what='The support list'>
        {(requests) => <SupportView requests={requests} />}
      </QueryView>
    </Page>
  )
}

// Open requests first, one line each. A tap shows the progress. Closed
// requests stay behind "Closed".
function SupportView({ requests }: { requests: SupportRequest[] }) {
  const open = requests.filter((r) => r.state !== 'closed')
  const closed = requests.filter((r) => r.state === 'closed')

  return (
    <div className='max-w-3xl space-y-6'>
      {open.length === 0 ? (
        <div className='rounded-xl border border-dashed p-8 text-center text-muted-foreground'>
          No open requests.
        </div>
      ) : (
        <RequestList requests={open} />
      )}
      {closed.length > 0 && (
        <More label={`Closed (${closed.length})`}>
          <RequestList requests={closed} />
        </More>
      )}
    </div>
  )
}

function RequestList({ requests }: { requests: SupportRequest[] }) {
  return (
    <ul className='divide-y rounded-xl border'>
      {requests.map((r) => (
        <li key={r.id}>
          <RequestRow request={r} />
        </li>
      ))}
    </ul>
  )
}

function RequestRow({ request }: { request: SupportRequest }) {
  const current = request.steps.findIndex((s) => !s.at)
  return (
    <Collapsible>
      <CollapsibleTrigger className='flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-start outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50'>
        <div className='min-w-0 flex-1'>
          <div className='truncate font-medium'>{request.title}</div>
          <div className='truncate text-xs text-muted-foreground'>
            {request.app} · {since(request.updated)}
          </div>
        </div>
        <StateBadge request={request} />
      </CollapsibleTrigger>
      <CollapsibleContent className='px-4 pb-4'>
        <ol className='space-y-3 border-s ps-4'>
          {request.steps.map((s, i) => (
            <li key={s.label} className='relative'>
              <span
                aria-hidden
                className={cn(
                  'absolute -start-[21px] top-1.5 size-2.5 rounded-full border bg-background',
                  s.at && 'border-primary bg-primary',
                  i === current && 'border-primary ring-2 ring-primary/30'
                )}
              />
              <div
                className={cn(
                  'text-sm font-medium',
                  !s.at && i !== current && 'text-muted-foreground'
                )}
              >
                {s.label}
              </div>
              {s.note && (
                <div className='text-xs text-muted-foreground'>{s.note}</div>
              )}
            </li>
          ))}
        </ol>
        <Button
          variant='outline'
          size='sm'
          className='mt-4'
          onClick={() => toast('Notes come with the support connection.')}
        >
          Add a note
        </Button>
      </CollapsibleContent>
    </Collapsible>
  )
}

function StateBadge({ request }: { request: SupportRequest }) {
  const label =
    request.state === 'closed' && request.rating
      ? `Closed · ${request.rating}`
      : stateLabel[request.state]
  return (
    <Badge
      className='shrink-0'
      variant={
        request.state === 'closed'
          ? 'outline'
          : request.state === 'waiting'
            ? 'default'
            : 'secondary'
      }
    >
      {label}
    </Badge>
  )
}
