import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  type Usage as UsageData,
  type UsageRow,
  useUsage,
} from '@/lib/console-api'
import { compact, day, money } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { More } from '@/components/more'
import { Page, QueryView } from '@/components/page'

export function Usage() {
  const query = useUsage()
  const d = query.data
  return (
    <Page
      title='Usage'
      description={d && `${day(d.periodStart)} – ${day(d.periodEnd)}`}
    >
      <QueryView query={query} what='Usage'>
        {(usage) => <UsageView usage={usage} />}
      </QueryView>
    </Page>
  )
}

// One number first: how much of the included plan is used. The chart sits
// under it, and the breakdown stays behind "Breakdown".
function UsageView({ usage }: { usage: UsageData }) {
  const cur = (n: number) => money(n, usage.currency)
  const { used, limit } = usage.included
  const days = usage.daily.length || 1
  const perDay = usage.daily.reduce((s, x) => s + x.cost, 0) / days
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const own = usage.ownSubscription

  return (
    <Card className='max-w-3xl'>
      <CardHeader>
        <CardTitle className='text-3xl tabular-nums'>
          {cur(used)}{' '}
          <span className='text-base font-normal text-muted-foreground'>
            of {cur(limit)} used
          </span>
        </CardTitle>
        <div
          className='mt-2 h-2 overflow-hidden rounded-full bg-muted'
          role='meter'
          aria-label='Included plan used'
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className='h-full bg-primary' style={{ width: `${pct}%` }} />
        </div>
        <p className='mt-2 text-sm text-muted-foreground'>
          About {cur(perDay * 31)} by the end of the month.
        </p>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='h-48'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={usage.daily}>
              <XAxis
                dataKey='date'
                tickFormatter={(v: string) => String(Number(v.slice(8)))}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                stroke='var(--muted-foreground)'
              />
              <YAxis
                tickFormatter={(v: number) => cur(v)}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={56}
                stroke='var(--muted-foreground)'
              />
              <Tooltip
                cursor={{ fill: 'var(--muted)' }}
                formatter={(v) => cur(Number(v))}
                labelFormatter={(v) => day(String(v))}
                contentStyle={{
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              <Bar
                dataKey='cost'
                name='Cost'
                fill='var(--primary)'
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <More label='Breakdown'>
          <Tabs defaultValue='person'>
            <TabsList>
              <TabsTrigger value='person'>Person</TabsTrigger>
              <TabsTrigger value='claw'>Claw</TabsTrigger>
              <TabsTrigger value='model'>Model</TabsTrigger>
            </TabsList>
            <TabsContent value='person'>
              <Breakdown head='Person' rows={usage.byPerson} cur={cur} />
            </TabsContent>
            <TabsContent value='claw'>
              <Breakdown head='Claw' rows={usage.byClaw} cur={cur} />
            </TabsContent>
            <TabsContent value='model'>
              <Breakdown head='Model' rows={usage.byModel} cur={cur} />
            </TabsContent>
          </Tabs>
          {own.connected && (
            <p className='mt-3 text-xs text-muted-foreground'>
              {own.claws.join(', ')} also use your own model subscription. That
              cost is not shown here.
            </p>
          )}
        </More>
      </CardContent>
    </Card>
  )
}

function Breakdown(props: {
  head: string
  rows: UsageRow[]
  cur: (n: number) => string
}) {
  return (
    <div className='overflow-x-auto rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{props.head}</TableHead>
            <TableHead className='text-end'>Requests</TableHead>
            <TableHead className='text-end'>Tokens</TableHead>
            <TableHead className='text-end'>Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.rows.map((r) => (
            <TableRow key={r.key}>
              <TableCell className='font-medium'>{r.key}</TableCell>
              <TableCell className='text-end tabular-nums'>
                {r.requests}
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {compact(r.tokens)}
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {props.cur(r.cost)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
