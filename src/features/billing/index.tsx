import { ExternalLink, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { type Billing as BillingData, useBilling } from '@/lib/console-api'
import { day } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Page, QueryView } from '@/components/page'

const soon = () =>
  toast('Billing opens the Stripe customer portal when it is connected.')

export function Billing() {
  const query = useBilling()
  return (
    <Page
      title='Billing and plan'
      description='One bill for claws, care plans and model use.'
      actions={
        <Button variant='outline' onClick={soon}>
          Manage billing <ExternalLink />
        </Button>
      }
    >
      <QueryView query={query} what='Billing'>
        {(billing) => <BillingView billing={billing} />}
      </QueryView>
    </Page>
  )
}

function BillingView({ billing }: { billing: BillingData }) {
  const models: [keyof BillingData['models'], string, string][] = [
    ['included', 'Included plan', 'Through ClawRouter. Nothing to set up.'],
    ['own', 'Own subscription', 'Sign in your own model account on a claw.'],
    ['ownFirst', 'Use own first', 'Fall back to the included plan at a limit.'],
  ]
  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardDescription>Current plan</CardDescription>
            <CardTitle className='text-xl'>{billing.plan}</CardTitle>
            <CardDescription>Renews {day(billing.renews)}</CardDescription>
          </CardHeader>
          <CardContent className='divide-y'>
            {billing.items.map((it) => (
              <div
                key={it.name}
                className='flex items-center justify-between gap-3 py-2.5'
              >
                <div className='min-w-0'>
                  <div className='text-sm font-medium'>{it.name}</div>
                  <div className='text-xs text-muted-foreground'>
                    {it.detail}
                  </div>
                </div>
                <Badge variant='outline'>
                  {it.kind === 'included' ? 'Included' : 'Add-on'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Models</CardDescription>
            <CardTitle className='text-base'>
              How your claws reach models
            </CardTitle>
          </CardHeader>
          <CardContent className='divide-y'>
            {models.map(([key, name, detail]) => (
              <div
                key={key}
                className='flex items-center justify-between gap-3 py-2.5'
              >
                <div className='min-w-0'>
                  <div className='text-sm font-medium'>{name}</div>
                  <div className='text-xs text-muted-foreground'>{detail}</div>
                </div>
                <Switch
                  aria-label={name}
                  defaultChecked={billing.models[key]}
                  onCheckedChange={() => toast(`${name}: not saved yet`)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className='mb-3 text-lg font-semibold'>Invoices</h2>
        <div className='overflow-x-auto rounded-xl border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className='text-end'>Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billing.invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className='whitespace-nowrap'>
                    {day(inv.date)}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {inv.items}
                  </TableCell>
                  <TableCell className='text-end'>
                    <Button variant='ghost' size='sm' onClick={soon}>
                      <FileText /> PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
