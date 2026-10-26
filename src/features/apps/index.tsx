import { Link } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { type CareApp, useApps } from '@/lib/console-api'
import { day, initials } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Page, QueryView } from '@/components/page'

export function Apps() {
  const query = useApps()
  return (
    <Page
      title='Apps and care plans'
      description='Apps Arc Forge built or runs for you. A care plan keeps each one fixed, updated and supported.'
    >
      <QueryView query={query} what='The app list'>
        {(apps) =>
          apps.length === 0 ? (
            <div className='rounded-xl border border-dashed p-8 text-center text-muted-foreground'>
              You have no apps from Arc Forge yet.
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2'>
              {apps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          )
        }
      </QueryView>
    </Page>
  )
}

function AppCard({ app }: { app: CareApp }) {
  const soon = () => toast('Care plan checkout comes with billing.')
  const rows: [string, string][] = app.plan
    ? [
        ['Plan', app.plan.name],
        ['Renews', day(app.plan.renews)],
        ['Version', app.version],
        ['Requests this month', `${app.plan.requestsThisMonth}`],
        ['Uptime, 30 days', `${app.plan.uptime30d}%`],
      ]
    : [
        ['Plan', 'None'],
        ['Version', app.version],
        ['Support', 'Pay per request'],
      ]

  return (
    <Card className='gap-4'>
      <CardHeader className='flex flex-row items-center gap-3'>
        <div className='flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground'>
          {initials(app.name)}
        </div>
        <div className='min-w-0'>
          <CardTitle className='truncate'>{app.name}</CardTitle>
          <CardDescription className='truncate font-mono text-xs'>
            {new URL(app.url).host}
          </CardDescription>
        </div>
        <Badge className='ms-auto' variant={app.plan ? 'default' : 'outline'}>
          {app.plan ? 'Care plan active' : 'No care plan'}
        </Badge>
      </CardHeader>
      <CardContent className='space-y-3'>
        <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm'>
          {rows.map(([k, v]) => (
            <div key={k} className='contents'>
              <dt className='text-muted-foreground'>{k}</dt>
              <dd className='text-end tabular-nums'>{v}</dd>
            </div>
          ))}
        </dl>
        {!app.plan && (
          <p className='rounded-md border border-primary/40 bg-primary/5 p-3 text-sm'>
            A care plan includes fixes, updates and support requests.
          </p>
        )}
      </CardContent>
      <CardFooter className='mt-auto flex flex-wrap justify-end gap-2'>
        <Button variant='outline' size='sm' onClick={soon}>
          {app.plan ? 'Change plan' : 'Start care plan'}
        </Button>
        <Button variant='outline' size='sm' asChild>
          <Link to='/support'>Report a problem</Link>
        </Button>
        <Button size='sm' asChild>
          <a href={app.url} target='_blank' rel='noopener noreferrer'>
            Open app <ExternalLink />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
