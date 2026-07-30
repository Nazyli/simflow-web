type WorkflowStatus = 'draft' | 'published' | 'active' | 'waiting' | 'running' | 'failed' | 'completed'

const knownStatuses = new Set<WorkflowStatus>(['draft', 'published', 'active', 'waiting', 'running', 'failed', 'completed'])

export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase() as WorkflowStatus
  const statusClass = knownStatuses.has(normalizedStatus) ? normalizedStatus : 'default'
  return <span className={`status-badge status-${statusClass}`}>{status.replaceAll('_', ' ')}</span>
}
