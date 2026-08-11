import {
  LayoutDashboard,
  Trophy,
  Tags,
  Users,
  Waypoints,
  Swords,
  Tv,
  GitBranch,
  Shield,
  GraduationCap,
} from 'lucide-vue-next'

export const adminNavigation = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Tournaments',
    to: '/tournaments',
    icon: Trophy,
  },
  {
    label: 'Categories',
    to: '/categories',
    icon: Tags,
  },
  {
    label: 'Athletes',
    to: '/athletes',
    icon: Users,
  },
  {
    label: 'Referees',
    to: '/referees',
    icon: Shield,
  },
  {
    label: 'Coaches',
    to: '/coaches',
    icon: GraduationCap,
  },
  {
    label: 'Tatamis',
    to: '/tatamis',
    icon: Waypoints,
  },
  {
    label: 'Matches',
    to: '/admin/matches',
    icon: Swords,
  },
  {
    label: 'Live Scoring',
    to: '/live',
    icon: Tv,
  },
  {
    label: 'Brackets',
    to: '/brackets',
    icon: GitBranch,
  },
]