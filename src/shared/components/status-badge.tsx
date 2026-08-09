import { Badge } from '@/components/ui/badge'

type WorkflowStatus =
  'draft' | 'published' | 'active' | 'waiting' | 'running' | 'failed' | 'completed'

const knownStatuses = new Set<WorkflowStatus>([
  'draft',
  'published',
  'active',
  'waiting',
  'running',
  'failed',
  'completed',
])

const statusStyles: Record<WorkflowStatus | 'default', { color: string; backgroundColor: string }> =
  {
    draft: { color: 'var(--status-draft)', backgroundColor: 'var(--status-draft-bg)' },
    published: { color: 'var(--status-published)', backgroundColor: 'var(--status-published-bg)' },
    active: { color: 'var(--status-active)', backgroundColor: 'var(--status-active-bg)' },
    waiting: { color: 'var(--status-waiting)', backgroundColor: 'var(--status-waiting-bg)' },
    running: { color: 'var(--status-running)', backgroundColor: 'var(--status-running-bg)' },
    failed: { color: 'var(--status-failed)', backgroundColor: 'var(--status-failed-bg)' },
    completed: { color: 'var(--status-completed)', backgroundColor: 'var(--status-completed-bg)' },
    default: { color: 'var(--color-text-muted)', backgroundColor: '#f1f5f9' },
  }

export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase() as WorkflowStatus
  const statusKey = knownStatuses.has(normalizedStatus) ? normalizedStatus : 'default'
  return (
    <Badge style={statusStyles[statusKey]} className="text-[0.66rem] font-bold capitalize">
      {status.replaceAll('_', ' ')}
    </Badge>
  )
}
