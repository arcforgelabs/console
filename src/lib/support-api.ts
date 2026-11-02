import { useMutation, useQueryClient } from '@tanstack/react-query'
import { demo, type Claw, type Me } from './api'
import { type SupportRequest } from './console-api'

export type SupportInput = {
  claw: string
  details: string
  app: string
  priority: 'normal' | 'urgent'
}
export function useCreateSupport() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: SupportInput) => {
      if (!demo)
        throw new Error(
          'Support is not connected. Try again after the service is connected.'
        )
      const details = input.details.trim()
      if (!details || details.length > 4000)
        throw new Error('Describe the problem in 1 to 4000 characters.')
      const claw = client
        .getQueryData<Claw[]>(['claws'])
        ?.find((c) => c.name === input.claw)
      if (!claw)
        throw new Error(
          'Choose an available claw. Reload if the list is empty.'
        )
      const now = new Date().toISOString()
      const request: SupportRequest = {
        id: 'demo-' + crypto.randomUUID(),
        title: details.split('\n')[0].slice(0, 100),
        app: input.app.trim() || claw.label,
        state: 'new',
        reporter: client.getQueryData<Me>(['me'])?.email ?? 'demo@acme.example',
        inCarePlan: false,
        updated: now,
        steps: [
          { label: 'Opened', at: now, note: details },
          { label: 'Agent took it' },
          { label: 'Fix shipped' },
          { label: 'Closed and rated' },
        ],
        demoDetails: { claw: claw.label, priority: input.priority },
      }
      client.setQueryData<SupportRequest[]>(['support'], (all) => [
        request,
        ...(all ?? []),
      ])
      return request
    },
  })
}
