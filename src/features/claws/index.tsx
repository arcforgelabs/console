import { useClaws } from '@/lib/api'
import { Page, QueryView } from '@/components/page'
import { ClawCard } from './claw-card'

export function Claws() {
  const query = useClaws()

  return (
    <Page title='Claws' description='Open a claw to start. No new password.'>
      <QueryView query={query} what='The claw list'>
        {(claws) =>
          claws.length === 0 ? (
            <div className='rounded-xl border border-dashed p-8 text-center text-muted-foreground'>
              No claws yet. Your Arc Forge contact adds you.
            </div>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {claws.map((claw) => (
                <ClawCard key={claw.name} claw={claw} />
              ))}
            </div>
          )
        }
      </QueryView>
    </Page>
  )
}
