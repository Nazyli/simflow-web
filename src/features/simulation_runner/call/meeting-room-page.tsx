import '@livekit/components-styles'

import { LiveKitRoom, StartAudio } from '@livekit/components-react'
import { VideoPresets, type RoomOptions } from 'livekit-client'
import { PhoneOff } from 'lucide-react'
import { useEffect, useMemo, useReducer, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import type { CallConnection } from '../../../shared/api/agent-call'
import { getCallConnection } from '../../../shared/api/agent-call'
import { useSimulationRun } from '../simulation-run-context'
import {
  CALL_CONNECTION_STORAGE_KEY,
  CALL_PREJOIN_STORAGE_KEY,
  readStoredValue,
  type CallPrejoinChoices,
} from './types'
import { initialCallRunnerState, reduceCallRunnerState } from './call-lifecycle'
import { AiAgentHeader } from './ai-agent-header'
import { CallMediaController } from './call-media-controller'
import { ChatSidebar } from './chat-sidebar'
import { NetworkStatus } from './network-status'
import { RoomParticipant } from './room-participant'
import { TranscriptionViewer } from './transcription-viewer'

export function CallMeetingRoomPage() {
  const { participantId } = useSimulationRun()
  const { roomId } = useParams()
  const navigate = useNavigate()
  const storedConnection = readStoredValue<CallConnection>(CALL_CONNECTION_STORAGE_KEY)
  const storedChoices = readStoredValue<CallPrejoinChoices>(CALL_PREJOIN_STORAGE_KEY)
  const [connection, setConnection] = useState<CallConnection | null>(storedConnection)
  const [choices, setChoices] = useState(storedChoices)
  const [state, dispatch] = useReducer(reduceCallRunnerState, initialCallRunnerState)

  const simulationPath = `/simulation/${encodeURIComponent(participantId)}`

  function clearCallStorage() {
    localStorage.removeItem(CALL_CONNECTION_STORAGE_KEY)
    localStorage.removeItem(CALL_PREJOIN_STORAGE_KEY)
  }

  function exitToSimulation() {
    clearCallStorage()
    navigate(simulationPath)
  }

  useEffect(() => {
    if (storedConnection) {
      dispatch({ type: 'connection-resolved', connection: storedConnection })
    } else {
      dispatch({ type: 'connection-absent' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (state.navigateTo === 'simulation') exitToSimulation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.navigateTo])

  useEffect(() => {
    if (choices) localStorage.setItem(CALL_PREJOIN_STORAGE_KEY, JSON.stringify(choices))
  }, [choices])

  // Room options are memoized once: LiveKitRoom recreates the Room whenever
  // the serialized options change, so device changes are applied through
  // switchActiveDevice in CallMediaController instead.
  const roomOptions = useMemo<RoomOptions>(
    () => ({
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      publishDefaults: {
        dtx: false,
        red: true,
        videoCodec: 'vp9',
        videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
      },
      audioCaptureDefaults: {
        deviceId: choices?.audioDeviceId ?? undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      videoCaptureDefaults: {
        deviceId: choices?.videoDeviceId ?? undefined,
        resolution: VideoPresets.h720,
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  async function handleDisconnected() {
    try {
      const recheck = await getCallConnection(participantId)
      dispatch({ type: 'disconnected', recheck })
    } catch {
      dispatch({ type: 'disconnected', recheck: null })
    }
  }

  function reconnect() {
    if (!state.reconnectToken) return
    setConnection((current) =>
      current ? { ...current, participantToken: state.reconnectToken as string } : current,
    )
    dispatch({ type: 'reconnect-accepted', token: state.reconnectToken as string })
  }

  if (state.phase === 'unavailable') {
    return <CallUnavailableState onBack={exitToSimulation} />
  }

  if (!roomId || !connection?.serverUrl || !connection.participantToken || !choices) {
    return <CallUnavailableState onBack={exitToSimulation} />
  }

  return (
    <div className="border-border bg-card flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl border shadow-sm">
      <AiAgentHeader
        agentTier={connection.actorLevel}
        agentName={connection.actorName}
        callSessionId={connection.callSessionId}
        participantId={participantId}
        onLeave={exitToSimulation}
      />
      {state.phase === 'awaiting-reconnect' ? (
        <div className="border-border flex items-center justify-between gap-3 border-b bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>The call connection dropped. Rejoin the same room when ready.</span>
          <Button size="sm" variant="outline" onClick={reconnect}>
            Reconnect
          </Button>
        </div>
      ) : null}
      <LiveKitRoom
        key={connection.participantToken}
        connect
        data-lk-theme="default"
        onDisconnected={handleDisconnected}
        options={roomOptions}
        serverUrl={connection.serverUrl}
        token={connection.participantToken}
      >
        <CallMediaController choices={choices} />
        <div className="bg-muted flex min-h-0 flex-1 flex-col gap-4 p-4 lg:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs">Room: {connection.roomName}</p>
              <div className="flex items-center gap-2">
                <StartAudio
                  className="text-primary text-xs font-medium underline underline-offset-2"
                  label="Enable call audio"
                />
                <NetworkStatus />
              </div>
            </div>
            <RoomParticipant
              choices={choices}
              localParticipantIdentity={connection.participantIdentity}
              onChoicesChange={(partial) =>
                setChoices((current) => (current ? { ...current, ...partial } : current))
              }
            />
            <TranscriptionViewer
              actorName={connection.actorName}
              participantName={connection.participantName}
            />
          </div>
          <ChatSidebar callSessionId={connection.callSessionId} participantId={participantId} />
        </div>
      </LiveKitRoom>
    </div>
  )
}

function CallUnavailableState({ onBack }: { onBack: () => void }) {
  return (
    <div className="border-border bg-card flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-xl border px-6 text-center shadow-sm">
      <span className="bg-muted text-muted-foreground grid size-12 place-items-center rounded-full">
        <PhoneOff className="size-5" />
      </span>
      <div>
        <h2 className="text-foreground text-sm font-semibold">Calling is not configured</h2>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          LiveKit credentials are not available for this simulation yet.
        </p>
      </div>
      <Button onClick={onBack} variant="outline">
        Back to simulation
      </Button>
    </div>
  )
}
