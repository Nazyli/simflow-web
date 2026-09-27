import { cn } from '@/lib/utils'

type NodeStatusIndicatorProps = {
  children: React.ReactNode
  status?: 'active' | 'idle' | string | null
  className?: string
}

/**
 * Border variant inspired by reactflow.dev/ui/components/node-status-indicator
 * Renders a conic-gradient spinner clipped to rounded border.
 * Only shows when status === 'active' (waiting/running). Otherwise passthrough.
 */
export function NodeStatusIndicator({ children, status, className }: NodeStatusIndicatorProps) {
  const isActive = status === 'active'
  if (!isActive) return <>{children}</>

  return (
    <div
      className={cn(
        'node-status-indicator relative overflow-hidden rounded-md p-[2.5px]',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="node-status-indicator__spinner pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[140%]"
      />
      <div className="bg-card relative overflow-hidden rounded-[calc(var(--radius)-2px)]">
        {children}
      </div>
    </div>
  )
}
