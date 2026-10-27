import { Link } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { type CareApp, useApps } from '@/lib/console-api'
import { day, initials } from '@/lib/format'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { More } from '@/components/more'
import { Page, QueryView } from '@/components/page'

export function Apps() {
  const query = useApps()
  return (
    <Page title='Apps' description='Apps Arc Forge built or runs for you.'>
      <QueryView query={query} what='The app list'>
        {(apps) =>
          apps.length === 0 ? (
            <div className='rounded-xl border border-dashed p-8 text-center text-muted-foreground'>
              You have no apps from Arc Forge yet.
            </div>
          ) : (
            <div className='grid items-start gap-4 md:grid-cols-2'>
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

// Name, one plan line and "Open app". Plan facts and other actions stay
// under "Details".
function AppCard({ app }: { app: CareApp }) {
  const soon = () => toast('Care plan checkout comes with billing.')
  const facts: [string, string][] = app.plan
    ? [
        ['Version', app.version],
        ['Requests this month', `${app.plan.requestsThisMonth}`],
        ['Uptime, 30 days', `${app.plan.uptime30d}%`],
      ]
    : [
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
          <CardDescription className='truncate'>
            {app.plan
              ? `${app.plan.name} · renews ${day(app.plan.renews)}`
              : 'No care plan'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <More label='Details'>
          <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm'>
            {facts.map(([k, v]) => (
              <div key={k} className='contents'>
                <dt className='text-muted-foreground'>{k}</dt>
                <dd className='text-end tabular-nums'>{v}</dd>
              </div>
            ))}
          </dl>
          <div className='mt-3 flex flex-wrap gap-2'>
            <Button variant='outline' size='sm' onClick={soon}>
              {app.plan ? 'Change plan' : 'Start a care plan'}
            </Button>
            <Button variant='outline' size='sm' asChild>
              <Link to='/support'>Report a problem</Link>
            </Button>
          </div>
        </More>
      </CardContent>
      <CardFooter className='mt-auto'>
        <Button asChild className='w-full'>
          <a href={app.url} target='_blank' rel='noopener noreferrer'>
            Open app <ExternalLink />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
