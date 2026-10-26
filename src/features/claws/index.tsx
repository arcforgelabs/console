import { demo, useClaws } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { ClawCard } from './claw-card'

export function Claws() {
  const { data: claws, isPending, isError } = useClaws()

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6'>
          <h1 className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
            Claws
            {demo && <Badge variant='outline'>Demo data</Badge>}
          </h1>
          <p className='text-muted-foreground'>
            Each claw is your own OpenClaw. Open signs you in with no new
            password.
          </p>
        </div>

        {isPending && (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[0, 1].map((i) => (
              <Skeleton key={i} className='h-44 rounded-xl' />
            ))}
          </div>
        )}

        {isError && (
          <p role='alert' className='text-destructive'>
            The claw list did not load. Reload the page to try again.
          </p>
        )}

        {claws && claws.length === 0 && (
          <div className='rounded-xl border border-dashed p-8 text-center text-muted-foreground'>
            No claws are linked to your email yet. Ask your Arc Forge contact to
            add you.
          </div>
        )}

        {claws && claws.length > 0 && (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {claws.map((claw) => (
              <ClawCard key={claw.name} claw={claw} />
            ))}
          </div>
        )}
      </Main>
    </>
  )
}
