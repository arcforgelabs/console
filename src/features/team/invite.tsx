import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { demo } from '@/lib/api'
import { type Team, useInvite } from '@/lib/team-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { More } from '@/components/more'

export function Invite({ team }: { team: Team }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>Invite</Button>
      </SheetTrigger>
      <SheetContent className='w-full overflow-y-auto sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Invite a person</SheetTitle>
          <SheetDescription>
            Demo only. No email is sent. No access is granted. Changes reset on
            reload.
          </SheetDescription>
        </SheetHeader>
        {open && <InviteForm team={team} done={() => setOpen(false)} />}
      </SheetContent>
    </Sheet>
  )
}

function InviteForm({ team, done }: { team: Team; done: () => void }) {
  const invite = useInvite()
  const [email, setEmail] = useState('')
  const [claws, setClaws] = useState(team.claws.map((c) => c.name))
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [search, setSearch] = useState('')
  const full = team.members.length >= team.seatsIncluded
  return (
    <form
      className='space-y-5 px-4 pb-4'
      onSubmit={async (e) => {
        e.preventDefault()
        try {
          await invite.mutateAsync({ email, claws, role })
          done()
        } catch {
          /* Error is shown below. */
        }
      }}
    >
      <div className='space-y-2'>
        <Label htmlFor='invite-email'>Email</Label>
        <Input
          id='invite-email'
          type='email'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <fieldset className='space-y-2'>
        <legend className='mb-2 text-sm font-medium'>
          Can open these claws
        </legend>
        {team.claws.length > 8 && (
          <Input
            aria-label='Find a claw'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
        {team.claws
          .filter((c) => c.label.toLowerCase().includes(search.toLowerCase()))
          .map((c) => (
            <label key={c.name} className='flex items-center gap-3 text-sm'>
              <input
                type='checkbox'
                checked={claws.includes(c.name)}
                onChange={(e) =>
                  setClaws((all) =>
                    e.target.checked
                      ? [...all, c.name]
                      : all.filter((name) => name !== c.name)
                  )
                }
              />
              {c.label}
            </label>
          ))}
      </fieldset>
      <More label='More options'>
        <Label htmlFor='invite-role'>Role</Label>
        <select
          id='invite-role'
          className='mt-2 block w-full rounded-md border bg-background p-2'
          value={role}
          onChange={(e) =>
            setRole(e.target.value === 'admin' ? 'admin' : 'member')
          }
        >
          <option value='member'>Member</option>
          <option value='admin'>Admin</option>
        </select>
      </More>
      {full && (
        <p role='alert'>
          No seats are free.{' '}
          <Link to='/billing' className='underline'>
            View billing
          </Link>
          . Demo seat counts are examples, not plan limits.
        </p>
      )}
      {invite.error && (
        <p role='alert' className='text-sm text-destructive'>
          {invite.error.message}
        </p>
      )}
      {!demo && (
        <p>
          The invite service is not connected. Try again after it is connected.
        </p>
      )}
      <Button
        className='w-full'
        disabled={
          !demo ||
          full ||
          !email.trim() ||
          claws.length === 0 ||
          invite.isPending
        }
        type='submit'
      >
        {invite.isPending ? 'Please wait' : 'Preview invite'}
      </Button>
    </form>
  )
}
