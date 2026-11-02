import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { demo, getJson } from './api'

// A subset of the stock session:report schema. No HTML, actions or remote reads.
export type NativeReport = {
  blocks: (
    | { type: 'text'; title?: string; text: string }
    | {
        type: 'metrics'
        items: { label: string; value: string; detail?: string }[]
      }
    | { type: 'table'; title?: string; columns: string[]; rows: string[][] }
  )[]
}
export type Report = { period: string; title: string; payload: NativeReport }
export const demoReports: Report[] = [
  {
    period: '2026-11-01',
    title: 'Demo weekly report · 1 November 2026',
    payload: {
      blocks: [
        {
          type: 'text',
          title: 'A short update',
          text: 'Synthetic preview only. Three small improvements and one fix are ready for review. No patient or customer data.',
        },
        {
          type: 'metrics',
          items: [
            { label: 'Improvements', value: '3' },
            { label: 'Fixes', value: '1' },
          ],
        },
        {
          type: 'table',
          title: 'What changed',
          columns: ['Area', 'Update'],
          rows: [
            ['Exports', 'Clearer empty-state message'],
            ['Help', 'Shorter setup instructions'],
          ],
        },
      ],
    },
  },
]
export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () =>
      demo ? Promise.resolve(demoReports) : getJson<Report[]>('/api/reports'),
  })
}
export type ReportPreferences = { enabled: boolean }
export function useReportPreferences() {
  return useQuery({
    queryKey: ['report-preferences'],
    queryFn: () =>
      demo
        ? Promise.resolve({ enabled: false })
        : getJson<ReportPreferences>('/api/report-preferences'),
  })
}
export function usePreviewReportPreferences() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!demo)
        throw new Error(
          'Report delivery is not connected. Try again after the service is connected.'
        )
      const next: ReportPreferences = { enabled }
      client.setQueryData(['report-preferences'], next)
      return next
    },
  })
}
