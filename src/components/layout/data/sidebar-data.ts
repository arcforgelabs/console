import {
  AppWindow,
  BarChart3,
  Boxes,
  CreditCard,
  LifeBuoy,
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
        { title: 'Apps', url: '/apps', icon: AppWindow },
        { title: 'Support', url: '/support', icon: LifeBuoy },
      ],
    },
    {
      title: 'Manage',
      items: [
        { title: 'Team', url: '/team', icon: Users },
        { title: 'Usage', url: '/usage', icon: BarChart3 },
        { title: 'Billing', url: '/billing', icon: CreditCard },
      ],
    },
  ],
}
