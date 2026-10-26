import { Link } from '@tanstack/react-router'
import { ExternalLink, LogOut, Palette } from 'lucide-react'
import { type Me } from '@/lib/api'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// The account pages live with the sign-in provider, not in the console.
export function UserMenuItems({
  me,
  onSignOut,
}: {
  me: Me | undefined
  onSignOut: () => void
}) {
  return (
    <>
      <DropdownMenuGroup>
        {me?.accountsUrl && (
          <DropdownMenuItem asChild>
            <a href={me.accountsUrl} target='_blank' rel='noopener noreferrer'>
              <ExternalLink />
              Account
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to='/settings/appearance'>
            <Palette />
            Appearance
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant='destructive' onClick={onSignOut}>
        <LogOut />
        Sign out
      </DropdownMenuItem>
    </>
  )
}
