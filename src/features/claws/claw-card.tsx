import { ExternalLink } from 'lucide-react'
import { type Claw } from '@/lib/api'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Name, address, a status dot and one button.
export function ClawCard({ claw }: { claw: Claw }) {
  const online = claw.status === 'online'
  return (
    <Card className='gap-4'>
      <CardHeader className='flex flex-row items-center gap-3'>
        <div className='flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground'>
          {initials(claw.label)}
        </div>
        <div className='min-w-0'>
          <CardTitle className='truncate'>{claw.label}</CardTitle>
          <CardDescription className='truncate font-mono text-xs'>
            {new URL(claw.url).host}
          </CardDescription>
        </div>
        {claw.status && (
          <span
            className='ms-auto flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground capitalize'
            title={claw.version ? `Version ${claw.version}` : undefined}
          >
            <span
              aria-hidden
              className={cn(
                'size-2 rounded-full',
                online ? 'bg-emerald-500' : 'bg-amber-500'
              )}
            />
            {claw.status}
          </span>
        )}
      </CardHeader>
      <CardFooter className='mt-auto'>
        <Button asChild className='w-full'>
          <a href={claw.url} target='_blank' rel='noopener noreferrer'>
            Open <ExternalLink />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
