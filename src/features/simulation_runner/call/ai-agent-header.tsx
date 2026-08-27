import { PhoneOff } from 'lucide-react'
import { Button } from '../../../components/ui/button'

export function AiAgentHeader({
  agentLevel,
  agentName,
  onLeave,
}: {
  agentLevel: string
  agentName: string
  onLeave: () => void
}) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{agentName}</p>
        {agentLevel ? <p className="text-xs text-muted-foreground">{agentLevel}</p> : null}
      </div>
      <Button onClick={onLeave} size="sm" variant="destructive">
        <PhoneOff />
        End call
      </Button>
    </header>
  )
}
