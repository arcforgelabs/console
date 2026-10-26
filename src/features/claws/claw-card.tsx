import { ExternalLink } from 'lucide-react'
import { type Claw } from '@/lib/api'
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

function initials(label: string) {
  return label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function ClawCard({ claw }: { claw: Claw }) {
  const host = new URL(claw.url).host
  return (
    <Card className='gap-4'>
      <CardHeader className='flex flex-row items-center gap-3'>
        <div className='flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground'>
          {initials(claw.label)}
        </div>
        <div className='min-w-0'>
          <CardTitle className='truncate'>{claw.label}</CardTitle>
          <CardDescription className='truncate font-mono text-xs'>
            {host}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='flex flex-wrap items-center gap-2 text-sm'>
        <Badge variant='secondary' className='capitalize'>
          {claw.status ?? 'status not reported'}
        </Badge>
        {claw.version && (
          <span className='text-muted-foreground'>Version {claw.version}</span>
        )}
      </CardContent>
      <CardFooter className='mt-auto justify-end'>
        <Button asChild size='sm'>
          <a href={claw.url} target='_blank' rel='noopener noreferrer'>
            Open <ExternalLink />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
