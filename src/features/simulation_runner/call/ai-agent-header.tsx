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
    <header className="flex min-w-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-md bg-violet-50 text-sm font-bold text-violet-700">
          {agentName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{agentName}</p>
          {level ? <p className="text-xs text-slate-500">{level}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showChatToggle && onToggleChat ? (
          <Button
            onClick={onToggleChat}
            size="sm"
            variant="ghost"
            aria-label={chatOpen ? 'Hide in-call messages' : 'Show in-call messages'}
            aria-pressed={chatOpen}
            className={`rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 ${
              chatOpen ? 'bg-slate-100 text-slate-800' : ''
            }`}
          >
            <MessageSquare className="size-4" />
          </Button>
        ) : null}
        <Button
          onClick={() => void endCall()}
          size="sm"
          className="gap-2 rounded-md bg-red-600 px-3.5 text-white shadow-sm transition hover:bg-red-700"
        >
          <PhoneOff className="size-4" />
          <span className="hidden sm:inline">End call</span>
        </Button>
      </div>
    </header>
  )
}
