import { initialsOf, useMe } from '@/lib/api'
import useDialogState from '@/hooks/use-dialog-state'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutDialog } from '@/components/sign-out-dialog'
import { UserMenuItems } from '@/components/user-menu-items'

export function ProfileDropdown() {
  const [open, setOpen] = useDialogState()
  const { data: me } = useMe()

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='relative h-8 w-8 rounded-full'
            aria-label='Your account'
          >
            <Avatar className='h-8 w-8'>
              <AvatarFallback>{initialsOf(me)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <p className='truncate text-xs text-muted-foreground'>
              {me?.email}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <UserMenuItems me={me} onSignOut={() => setOpen(true)} />
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
