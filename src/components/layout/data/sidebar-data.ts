import { Boxes, Palette } from 'lucide-react'
import { type SidebarData } from '../types'

// Later pages (apps and care, support, team, usage, billing) join here as
// they are built. Design: arcforgelabs/platform#172.
export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'Run',
      items: [{ title: 'Claws', url: '/', icon: Boxes }],
    },
    {
      title: 'Manage',
      items: [
        { title: 'Appearance', url: '/settings/appearance', icon: Palette },
      ],
    },
  ],
}
