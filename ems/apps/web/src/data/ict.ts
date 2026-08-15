import {
  LayoutDashboard, Users, ShieldCheck, UserX, ScrollText,
  Settings, Plug, BarChart2, Bell, Megaphone,
} from 'lucide-react'

export const ICT_NAV = [
  { label: 'Dashboard',         to: '/ict/dashboard',      icon: LayoutDashboard },
  { label: 'User Management',   to: '/ict/users',          icon: Users           },
  { label: 'Access Levels',     to: '/ict/access-levels',  icon: ShieldCheck     },
  { label: 'Access Revocation', to: '/ict/revocation',     icon: UserX           },
  { label: 'Audit Log',         to: '/ict/audit-log',      icon: ScrollText      },
  { label: 'System Settings',   to: '/ict/settings',       icon: Settings        },
  { label: 'Integrations',      to: '/ict/integrations',   icon: Plug            },
  { label: 'Analytics',         to: '/ict/analytics',      icon: BarChart2       },
  { label: 'Notifications',     to: '/ict/notifications',  icon: Bell            },
  { label: 'Announcements',     to: '/ict/announcements',  icon: Megaphone       },
]
