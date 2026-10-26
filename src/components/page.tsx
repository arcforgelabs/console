import { ApiError, demo } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

type PageProps = {
  title: string
  description: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}

export function Page({ title, description, actions, children }: PageProps) {
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
        <div className='mb-6 flex flex-wrap items-end justify-between gap-4'>
          <div className='min-w-0'>
            <h1 className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
              {title}
              {demo && <Badge variant='outline'>Demo data</Badge>}
            </h1>
            <p className='text-muted-foreground'>{description}</p>
          </div>
          {actions && <div className='flex gap-2'>{actions}</div>}
        </div>
        {children}
      </Main>
    </>
  )
}

type QueryViewProps<T> = {
  query: { data: T | undefined; isPending: boolean; error: Error | null }
  what: string
  children: (data: T) => React.ReactNode
}

// Shows the loading, not-connected and error states that every page shares.
export function QueryView<T>({ query, what, children }: QueryViewProps<T>) {
  if (query.isPending) return <Skeleton className='h-64 rounded-xl' />
  if (query.error instanceof ApiError && query.error.status === 404)
    return (
      <div className='rounded-xl border border-dashed p-8 text-center text-muted-foreground'>
        {what} is not connected yet. It comes in a later release.
      </div>
    )
  if (query.error || query.data === undefined)
    return (
      <p role='alert' className='text-destructive'>
        {what} did not load. Reload the page to try again.
      </p>
    )
  return <>{children(query.data)}</>
}
