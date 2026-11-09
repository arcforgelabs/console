import { createFileRoute } from '@tanstack/react-router'
import { Buy } from '@/features/checkout/checkout'

export const Route = createFileRoute('/buy/')({ component: Buy })
