import { BookOpen, Clock3, Database, Layers, Play, Settings, Users } from 'lucide-react'

export const masterDataNavigation = {
  label: 'Master Data',
  path: '/master-data',
  icon: Database,
  children: [{ label: 'Actors', path: '/master-data/actors' }],
}

export const navigation = [
  { label: 'Studio', path: '/studio', icon: Layers },
  { label: 'Runner', path: '/simulation', icon: Play },
  { label: 'Participant History', path: '/history', icon: Users },
  { label: 'Timers', path: '/timers', icon: Clock3 },
  { label: 'Documentation', path: '/documentation', icon: BookOpen },
  masterDataNavigation,
  { label: 'Settings', path: '/settings', icon: Settings },
]

export const pageNames: Record<string, string> = Object.fromEntries([
  ...navigation.map(({ path, label }) => [path, label] as const),
  ['/master-data/actors', 'Actors'] as const,
])
