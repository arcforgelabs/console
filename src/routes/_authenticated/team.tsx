import { createFileRoute } from '@tanstack/react-router'
import { Team } from '@/features/team'

export const Route = createFileRoute('/_authenticated/team')({
  component: Team,
})
