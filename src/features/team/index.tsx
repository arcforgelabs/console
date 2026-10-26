import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import {
  type Team as TeamData,
  type TeamMember,
  useTeam,
} from '@/lib/console-api'
import { ago } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Page, QueryView } from '@/components/page'

const roleLabel = { owner: 'Owner', admin: 'Admin', member: 'Member' }

export function Team() {
  const query = useTeam()
  const used = query.data?.members.length
  return (
    <Page
      title='Team and seats'
      description={
        used === undefined
          ? 'Who can open each claw.'
          : `${used} of ${query.data?.seatsIncluded} seats used. A tick lets that person open that claw.`
      }
      actions={
        <Button onClick={() => toast('Invites come with the sign-in service.')}>
          <UserPlus /> Invite people
        </Button>
      }
    >
      <QueryView query={query} what='The team list'>
        {(team) => <SeatTable team={team} />}
      </QueryView>
    </Page>
  )
}

function SeatTable({ team }: { team: TeamData }) {
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
    <div className='overflow-x-auto rounded-xl border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Person</TableHead>
            <TableHead>Role</TableHead>
            {team.claws.map((c) => (
              <TableHead key={c.name} className='text-center'>
                {c.label}
              </TableHead>
            ))}
            <TableHead className='text-end'>Last sign-in</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m.email}>
              <TableCell>
                <div className='font-medium'>{m.name}</div>
                <div className='text-xs text-muted-foreground'>
                  {m.invited ? 'Invited' : m.email}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={m.role === 'member' ? 'outline' : 'secondary'}>
                  {roleLabel[m.role]}
                </Badge>
              </TableCell>
              {team.claws.map((c) => (
                <TableCell key={c.name} className='text-center'>
                  <Checkbox
                    aria-label={`${m.name} can open ${c.label}`}
                    checked={m.claws.includes(c.name)}
                    disabled={m.role === 'owner'}
                    onCheckedChange={(v) => toggle(m, c.name, v === true)}
                  />
                </TableCell>
              ))}
              <TableCell className='text-end text-muted-foreground tabular-nums'>
                {m.lastSignIn ? ago(m.lastSignIn) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
