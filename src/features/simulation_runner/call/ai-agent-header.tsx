import { PhoneOff } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { requestParticipantEnd } from '../../../shared/api/agent-call'

interface AiAgentHeaderProps {
  agentName: string
  agentTier: string
  callSessionId?: string
  participantId?: string
  onLeave: () => void
}

export function AiAgentHeader({
  agentTier,
  agentName,
  callSessionId,
  participantId,
  onLeave,
}: AiAgentHeaderProps) {
  const level = agentTier
  async function endCall() {
    if (callSessionId && participantId) {
      const eventId = crypto.randomUUID()
      const occurredAt = new Date().toISOString()
      try {
        await requestParticipantEnd(callSessionId, participantId, eventId, occurredAt)
      } catch {
        // Best-effort: the call session is resolved on the backend when the room closes.
      }
    }
    onLeave()
  }

  return (
    <header className="border-border bg-card flex items-center justify-between border-b px-4 py-3">
      <div>
        <p className="text-foreground text-sm font-semibold">{agentName}</p>
        {level ? <p className="text-muted-foreground text-xs">{level}</p> : null}
      </div>
      <Button onClick={() => void endCall()} size="sm" variant="destructive">
        <PhoneOff />
        End call
      </Button>
    </header>
  )
}
