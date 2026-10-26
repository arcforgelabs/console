import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  type SupportRequest,
  type SupportState,
  useSupport,
} from '@/lib/console-api'
import { ago } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
      description='Every request from your apps, your claws or this page, in one list.'
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
        {(requests) =>
          requests.length === 0 ? (
            <div className='rounded-xl border border-dashed p-8 text-center text-muted-foreground'>
              No support requests yet.
            </div>
          ) : (
            <SupportView requests={requests} />
          )
        }
      </QueryView>
    </Page>
  )
}

function SupportView({ requests }: { requests: SupportRequest[] }) {
  const [openId, setOpenId] = useState(requests[0].id)
  const open = requests.find((r) => r.id === openId) ?? requests[0]

  return (
    <div className='grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
      <div className='overflow-x-auto rounded-xl border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request</TableHead>
              <TableHead>App</TableHead>
              <TableHead>State</TableHead>
              <TableHead className='text-end'>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => (
              <TableRow
                key={r.id}
                data-state={r.id === open.id ? 'selected' : undefined}
                className='cursor-pointer'
                onClick={() => setOpenId(r.id)}
              >
                <TableCell>
                  <button
                    type='button'
                    className='text-start font-medium hover:underline'
                    aria-pressed={r.id === open.id}
                  >
                    {r.title}
                  </button>
                </TableCell>
                <TableCell className='text-muted-foreground'>{r.app}</TableCell>
                <TableCell>
                  <StateBadge request={r} />
                </TableCell>
                <TableCell className='text-end text-muted-foreground tabular-nums'>
                  {ago(r.updated)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <RequestDetail request={open} />
    </div>
  )
}

function StateBadge({ request }: { request: SupportRequest }) {
  const label =
    request.state === 'closed' && request.rating
      ? `Closed · ${request.rating}`
      : stateLabel[request.state]
  return (
    <Badge
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

function RequestDetail({ request }: { request: SupportRequest }) {
  const current = request.steps.findIndex((s) => !s.at)
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>{request.title}</CardTitle>
        <CardDescription>
          {request.app} · reported by {request.reporter}
          {request.inCarePlan ? ' · in your care plan' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              <div className='text-xs text-muted-foreground'>
                {[
                  s.at &&
                    new Date(s.at).toLocaleString('en-AU', {
                      weekday: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    }),
                  s.note,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </li>
          ))}
        </ol>
        <div className='mt-4 flex justify-end'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => toast('Notes come with the support connection.')}
          >
            Add a note
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
