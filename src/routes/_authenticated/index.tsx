import { createFileRoute } from '@tanstack/react-router'
import { Claws } from '@/features/claws'

export const Route = createFileRoute('/_authenticated/')({
  component: Claws,
})
