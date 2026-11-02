import { createFileRoute } from '@tanstack/react-router'
import { Addresses } from '@/features/addresses'

export const Route = createFileRoute('/_authenticated/addresses')({
  component: Addresses,
})
