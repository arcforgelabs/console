import { Link, useParams } from '@tanstack/react-router'
import { demo } from '@/lib/api'
import {
  type NativeReport,
  useReports,
  useReportPreferences,
  usePreviewReportPreferences,
} from '@/lib/reports-api'
import { Switch } from '@/components/ui/switch'
import { More } from '@/components/more'
import { Page, QueryView } from '@/components/page'

export function Reports() {
  const query = useReports()
  return (
    <Page title='Reports' description='A short update, where you use OpenClaw.'>
      <div className='max-w-3xl space-y-6'>
        <DeliveryPreview />
        <QueryView query={query} what='Reports'>
          {(reports) =>
            reports.length ? (
              <ul className='divide-y rounded-xl border'>
                {reports.map((r) => (
                  <li key={r.period} className='p-4'>
                    <Link
                      className='font-medium underline'
                      to='/reports/$period'
                      params={{ period: r.period }}
                    >
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No reports yet.</p>
            )
          }
        </QueryView>
      </div>
    </Page>
  )
}
function DeliveryPreview() {
  const query = useReportPreferences()
  const preview = usePreviewReportPreferences()
  return (
    <QueryView query={query} what='Report preferences'>
      {(preferences) => (
        <section className='space-y-3 rounded-xl border p-4'>
          <label className='flex items-center justify-between gap-4'>
            <span>Receive reports in OpenClaw (demo)</span>
            <Switch
              checked={preferences.enabled}
              disabled={!demo || preview.isPending}
              onCheckedChange={(enabled) => preview.mutate(enabled)}
            />
          </label>
          <p role='status' className='text-sm text-muted-foreground'>
            {preferences.enabled
              ? 'Opt-in preview is on. No reports are sent.'
              : 'Off by default. No reports are sent.'}{' '}
            Reload clears this choice.
          </p>
          <p className='text-xs text-muted-foreground'>
            This mock does not choose a customer Gateway or create a delivery
            schedule. Real consent and account checks remain required.
          </p>
          {preview.error && <p role='alert'>{preview.error.message}</p>}
        </section>
      )}
    </QueryView>
  )
}
export function PeriodReport() {
  const { period } = useParams({ from: '/_authenticated/reports/$period' })
  return <ReportDetail period={period} />
}

function ReportDetail({ period }: { period: string }) {
  const query = useReports()
  return (
    <Page
      title='Report preview'
      description='Synthetic console preview, not a live Gateway report.'
    >
      <div className='max-w-3xl space-y-5'>
        <Link to='/reports' className='underline'>
          All reports
        </Link>
        <QueryView query={query} what='Reports'>
          {(reports) => {
            const report = reports.find((r) => r.period === period)
            return report ? (
              <article className='space-y-5'>
                <h2 className='text-xl font-semibold'>{report.title}</h2>
                <NativePreview payload={report.payload} />
                <More label='Native report payload'>
                  <p className='mb-3 text-sm'>
                    Candidate session:report data only. This console view does
                    not prove rendering inside a customer Gateway.
                  </p>
                  <pre className='max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs'>
                    {JSON.stringify(report.payload, null, 2)}
                  </pre>
                </More>
              </article>
            ) : (
              <p role='alert'>
                Report not found. Choose a period from All reports.
              </p>
            )
          }}
        </QueryView>
      </div>
    </Page>
  )
}
function NativePreview({ payload }: { payload: NativeReport }) {
  return (
    <div className='space-y-5'>
      {payload.blocks.map((block, i) => {
        if (block.type === 'text')
          return (
            <section key={i} className='space-y-2'>
              {block.title && <h3 className='font-medium'>{block.title}</h3>}
              <p className='text-sm text-muted-foreground'>{block.text}</p>
            </section>
          )
        if (block.type === 'metrics')
          return (
            <dl key={i} className='grid grid-cols-2 gap-4'>
              {block.items.map((item) => (
                <div key={item.label} className='rounded-lg border p-4'>
                  <dt className='text-sm text-muted-foreground'>
                    {item.label}
                  </dt>
                  <dd className='text-2xl font-semibold'>{item.value}</dd>
                </div>
              ))}
            </dl>
          )
        return (
          <section key={i} className='space-y-2'>
            {block.title && <h3 className='font-medium'>{block.title}</h3>}
            <table className='w-full table-fixed text-left text-sm'>
              <thead>
                <tr>
                  {block.columns.map((column) => (
                    <th key={column} className='border-b p-2 break-words'>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, j) => (
                  <tr key={j}>
                    {row.map((cell, k) => (
                      <td key={k} className='border-b p-2 break-words'>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )
      })}
    </div>
  )
}
