import { Button } from '@/components/ui/button'

// Shown when the API still answers 401 after one reload (src/lib/session.ts).
// A full page load of / goes through Cloudflare Access again.
export function UnauthorisedError() {
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2 px-4'>
        <h1 className='text-2xl font-bold'>You are signed out</h1>
        <p className='text-center text-muted-foreground'>
          Sign in again to open your claws.
        </p>
        <Button className='mt-6' asChild>
          <a href='/'>Sign in again</a>
        </Button>
      </div>
    </div>
  )
}
