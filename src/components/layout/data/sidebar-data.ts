import {
  AppWindow,
  BarChart3,
  Boxes,
  CreditCard,
  LifeBuoy,
  Palette,
  Users,
} from 'lucide-react'
import { type SidebarData } from '../types'

// Design: arcforgelabs/platform#172.
export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'Run',
      items: [
        { title: 'Claws', url: '/', icon: Boxes },
        { title: 'Apps and care', url: '/apps', icon: AppWindow },
        { title: 'Support', url: '/support', icon: LifeBuoy },
      ],
    },
    {
      title: 'Manage',
      items: [
        { title: 'Team and seats', url: '/team', icon: Users },
        { title: 'Usage', url: '/usage', icon: BarChart3 },
        { title: 'Billing and plan', url: '/billing', icon: CreditCard },
        { title: 'Appearance', url: '/settings/appearance', icon: Palette },
      ],
    },
  ],
}
