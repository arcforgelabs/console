import { createFileRoute } from '@tanstack/react-router'
import { PeriodReport } from '@/features/reports'

export const Route = createFileRoute('/_authenticated/reports/$period')({
  component: PeriodReport,
})
