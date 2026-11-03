import { ExternalLink, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { type Billing as BillingData, useBilling } from '@/lib/console-api'
import { day } from '@/lib/format'
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
import { ModelSettings } from './model-settings'

const soon = () =>
  toast('Billing opens the Stripe customer portal when it is connected.')

export function Billing() {
  const query = useBilling()
  return (
    <Page title='Billing' description='One bill for everything.'>
      <QueryView query={query} what='Billing'>
        {(billing) => <BillingView billing={billing} />}
      </QueryView>
    </Page>
  )
}

// The plan and one button. Invoices and model settings stay closed.
function BillingView({ billing }: { billing: BillingData }) {
  return (
    <Card className='max-w-xl'>
      <CardHeader>
        <CardTitle className='text-xl'>{billing.plan}</CardTitle>
        <CardDescription>
          Renews {day(billing.renews)} ·{' '}
          {billing.items.map((it) => it.name).join(', ')}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <More label='Invoices'>
          <ul className='divide-y text-sm'>
            {billing.invoices.map((inv) => (
              <li
                key={inv.id}
                className='flex items-center justify-between gap-3 py-1.5'
              >
                <span className='whitespace-nowrap'>{day(inv.date)}</span>
                <span className='min-w-0 flex-1 truncate text-muted-foreground'>
                  {inv.items}
                </span>
                <Button variant='ghost' size='sm' onClick={soon}>
                  <FileText /> PDF
                </Button>
              </li>
            ))}
          </ul>
        </More>
        <More label='Model settings'>
          <ModelSettings />
        </More>
      </CardContent>
      <CardFooter>
        <Button className='w-full' onClick={soon}>
          Manage billing <ExternalLink />
        </Button>
      </CardFooter>
    </Card>
  )
}
