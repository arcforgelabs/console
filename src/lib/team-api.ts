import { useMutation, useQueryClient } from '@tanstack/react-query'
import { demo } from './api'
import { type Team } from './console-api'

export type { Team } from './console-api'

export type InviteInput = {
  email: string
  role: 'member' | 'admin'
  claws: string[]
}

// The demo cache owns previews. A future authenticated service must recheck
// seats, organisation ownership and claw grants. Never POST a preview today.
export function useInvite() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: InviteInput) => {
      if (!demo)
        throw new Error(
          'Invites are not connected. Try again after the service is connected.'
        )
      const team = client.getQueryData<Team>(['team'])
      if (!team)
        throw new Error('The team list is unavailable. Reload and try again.')
      const email = input.email.trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error('Enter a valid email address.')
      if (team.members.some((m) => m.email.toLowerCase() === email))
        throw new Error(
          'This person is already on the team. Use another email.'
        )
      if (team.members.length >= team.seatsIncluded)
        throw new Error('No seats are free. View billing before you try again.')
      if (
        !input.claws.length ||
        input.claws.some((name) => !team.claws.some((c) => c.name === name))
      )
        throw new Error('Choose at least one available claw.')
      const next: Team = {
        ...team,
        members: [
          ...team.members,
          {
            email,
            name: email,
            role: input.role,
            claws: [...new Set(input.claws)],
            invited: true,
          },
        ],
      }
      client.setQueryData(['team'], next)
      return next
    },
  })
}
