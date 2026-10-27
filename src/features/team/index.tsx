import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import {
  type Team as TeamData,
  type TeamMember,
  useTeam,
} from '@/lib/console-api'
import { initials, since } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'
import { Page, QueryView } from '@/components/page'

const roleLabel = { owner: 'Owner', admin: 'Admin', member: '' }

export function Team() {
  const query = useTeam()
  const team = query.data
  return (
    <Page
      title='Team'
      description={
        team && `${team.members.length} of ${team.seatsIncluded} seats used.`
      }
      actions={
        <Button onClick={() => toast('Invites come with the sign-in service.')}>
          <UserPlus /> Invite
        </Button>
      }
    >
      <QueryView query={query} what='The team list'>
        {(data) => <People team={data} />}
      </QueryView>
    </Page>
  )
}

// One line per person. A tap shows which claws they can open.
function People({ team }: { team: TeamData }) {
  const [members, setMembers] = useState(team.members)

  function toggle(member: TeamMember, claw: string, on: boolean) {
    setMembers((all) =>
      all.map((m) =>
        m.email !== member.email
          ? m
          : {
              ...m,
              claws: on
                ? [...m.claws, claw]
                : m.claws.filter((c) => c !== claw),
            }
      )
    )
    toast(`${member.name}: access ${on ? 'added' : 'removed'} (not saved yet)`)
  }

  return (
    <ul className='max-w-3xl divide-y rounded-xl border'>
      {members.map((m) => (
        <li key={m.email}>
          <Collapsible>
            <CollapsibleTrigger className='flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-start outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50'>
              <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold'>
                {initials(m.name)}
              </div>
              <div className='min-w-0 flex-1'>
                <div className='truncate font-medium'>{m.name}</div>
                <div className='truncate text-xs text-muted-foreground'>
                  {m.invited ? 'Invited' : m.email}
                </div>
              </div>
              {roleLabel[m.role] && (
                <Badge variant='secondary' className='shrink-0'>
                  {roleLabel[m.role]}
                </Badge>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className='space-y-2 px-4 ps-15 pb-4'>
              {team.claws.map((c) => (
                <label
                  key={c.name}
                  className='flex items-center justify-between gap-3 text-sm'
                >
                  {c.label}
                  <Switch
                    aria-label={`${m.name} can open ${c.label}`}
                    checked={m.claws.includes(c.name)}
                    disabled={m.role === 'owner'}
                    onCheckedChange={(v) => toggle(m, c.name, v)}
                  />
                </label>
              ))}
              {m.lastSignIn && (
                <p className='text-xs text-muted-foreground'>
                  Last sign-in {since(m.lastSignIn)}
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </li>
      ))}
    </ul>
  )
}
