import '@livekit/components-styles'

import { LiveKitRoom } from '@livekit/components-react'
import { PhoneOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import type { AgentCallConnectionDetails } from '../../../shared/api/agent-call'
import { useSimulationRun } from '../simulation-run-context'
import {
  CALL_CONNECTION_STORAGE_KEY,
  CALL_PREJOIN_STORAGE_KEY,
  readStoredValue,
  type CallPrejoinChoices,
} from './types'
import { AiAgentHeader } from './ai-agent-header'
import { ChatSidebar } from './chat-sidebar'
import { NetworkStatus } from './network-status'
import { RoomParticipant } from './room-participant'
import { TranscriptionViewer } from './transcription-viewer'

export function CallMeetingRoomPage() {
  const { participantId } = useSimulationRun()
  const { roomId } = useParams()
  const navigate = useNavigate()
  const connection = readStoredValue<AgentCallConnectionDetails>(CALL_CONNECTION_STORAGE_KEY)
  const storedChoices = readStoredValue<CallPrejoinChoices>(CALL_PREJOIN_STORAGE_KEY)
  const [choices, setChoices] = useState(storedChoices)
  const callPath = `/simulation/${encodeURIComponent(participantId)}/call`

  function leaveCall() {
    localStorage.removeItem(CALL_CONNECTION_STORAGE_KEY)
    localStorage.removeItem(CALL_PREJOIN_STORAGE_KEY)
    navigate(callPath)
  }

  useEffect(() => {
    if (choices) localStorage.setItem(CALL_PREJOIN_STORAGE_KEY, JSON.stringify(choices))
  }, [choices])

  if (!roomId || !connection?.serverUrl || !connection.participantToken || !choices) {
    return <CallUnavailableState onBack={leaveCall} />
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <AiAgentHeader agentLevel={connection.actorLevel} agentName={connection.actorName} onLeave={leaveCall} />
      <LiveKitRoom
        audio={choices.audioEnabled}
        connect
        data-lk-theme="default"
        onDisconnected={leaveCall}
        serverUrl={connection.serverUrl}
        token={connection.participantToken}
        video={choices.videoEnabled}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 bg-muted p-4 lg:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Room: {connection.roomName}</p>
              <NetworkStatus />
            </div>
            <RoomParticipant
              choices={choices}
              localParticipantIdentity={connection.participantIdentity}
              onChoicesChange={(partial) => setChoices((current) => (current ? { ...current, ...partial } : current))}
            />
            <TranscriptionViewer actorName={connection.actorName} />
          </div>
          <ChatSidebar />
        </div>
      </LiveKitRoom>
    </div>
  )
}

function CallUnavailableState({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 text-center shadow-sm">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <PhoneOff className="size-5" />
      </span>
      <div>
        <h2 className="text-sm font-semibold text-foreground">Calling is not configured</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          LiveKit credentials are not available for this simulation yet.
        </p>
      </div>
      <Button onClick={onBack} variant="outline">
        Back to call setup
      </Button>
    </div>
  )
}
