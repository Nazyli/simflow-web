import { MessageSquare, PhoneOff } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { requestParticipantEnd } from '../../../shared/api/agent-call'

interface AiAgentHeaderProps {
  agentName: string
  agentTier: string
  participantCallSessionId?: string
  participantId?: string
  onLeave: () => void
  chatOpen?: boolean
  onToggleChat?: () => void
  showChatToggle?: boolean
}

export function AiAgentHeader({
  agentTier,
  agentName,
  participantCallSessionId,
  participantId,
  onLeave,
  chatOpen,
  onToggleChat,
  showChatToggle,
}: AiAgentHeaderProps) {
  const level = agentTier
  async function endCall() {
    if (participantCallSessionId && participantId) {
      const eventId = crypto.randomUUID()
      const occurredAt = new Date().toISOString()
      try {
        await requestParticipantEnd(participantCallSessionId, participantId, eventId, occurredAt)
      } catch {
        // Best-effort: the call session is resolved on the backend when the room closes.
      }
    }
    onLeave()
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="brand-gradient grid size-9 place-items-center rounded-full text-sm font-bold text-white shadow-lg">
          {agentName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{agentName}</p>
          {level ? <p className="text-xs text-slate-500">{level}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showChatToggle && onToggleChat ? (
          <Button
            onClick={onToggleChat}
            size="sm"
            variant="ghost"
            className={`rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 ${
              chatOpen ? 'bg-slate-100 text-slate-800' : ''
            }`}
          >
            <MessageSquare className="size-4" />
          </Button>
        ) : null}
        <Button
          onClick={() => void endCall()}
          size="sm"
          className="gap-2 rounded-full bg-red-500 px-4 text-white shadow-lg transition hover:bg-red-600 hover:shadow-red-500/25"
        >
          <PhoneOff className="size-4" />
          <span className="hidden sm:inline">End call</span>
        </Button>
      </div>
    </header>
  )
}
