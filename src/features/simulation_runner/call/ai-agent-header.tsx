import { MessageSquare, PhoneOff } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { requestParticipantEnd } from '../../../shared/api/agent-call'

interface AiAgentHeaderProps {
  agentName: string
  agentTier: string
  callSessionId?: string
  participantId?: string
  onLeave: () => void
  chatOpen?: boolean
  onToggleChat?: () => void
  showChatToggle?: boolean
}

export function AiAgentHeader({
  agentTier,
  agentName,
  callSessionId,
  participantId,
  onLeave,
  chatOpen,
  onToggleChat,
  showChatToggle,
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
    <header className="flex items-center justify-between bg-[#1a1a2e] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white shadow-lg">
          {agentName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{agentName}</p>
          {level ? <p className="text-xs text-white/50">{level}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showChatToggle && onToggleChat ? (
          <Button
            onClick={onToggleChat}
            size="sm"
            variant="ghost"
            className={`rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white ${
              chatOpen ? 'bg-white/10 text-white' : ''
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
