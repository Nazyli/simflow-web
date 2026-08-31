import '@livekit/components-styles'

import { LiveKitRoom, StartAudio } from '@livekit/components-react'
import { DisconnectReason, VideoPresets, type RoomOptions } from 'livekit-client'
import { MonitorSmartphone, PhoneOff } from 'lucide-react'
import { useEffect, useMemo, useReducer, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import type { CallConnection } from '../../../shared/api/agent-call'
import { getCallConnection, getCallRoomConnection } from '../../../shared/api/agent-call'
import { useSimulationRun } from '../simulation-run-context'
import {
  CALL_CONNECTION_STORAGE_KEY,
  CALL_PREJOIN_STORAGE_KEY,
  defaultCallChoices,
  readStoredValue,
  type CallPrejoinChoices,
} from './types'
import { initialCallRunnerState, reduceCallRunnerState } from './call-lifecycle'
import { AiAgentHeader } from './ai-agent-header'
import { CallMediaController } from './call-media-controller'
import { ChatSidebar } from './chat-sidebar'
import { NetworkStatus } from './network-status'
import { ParticipantGrid } from './room-participant'
import { MediaControlBar } from './media-control-bar'
import { TranscriptionViewer } from './transcription-viewer'

const REPLACED_EXIT_DELAY_MS = 4000
const AGENT_POLL_INTERVAL_MS = 2000

export function CallMeetingRoomPage() {
  const { participantId } = useSimulationRun()
  const { roomId } = useParams()
  const navigate = useNavigate()
  const storedConnection = readStoredValue<CallConnection>(CALL_CONNECTION_STORAGE_KEY)
  const storedChoices = readStoredValue<CallPrejoinChoices>(CALL_PREJOIN_STORAGE_KEY)
  const [connection, setConnection] = useState<CallConnection | null>(storedConnection)
  const [choices, setChoices] = useState<CallPrejoinChoices | null>(
    storedChoices ?? (roomId ? defaultCallChoices(roomId) : null),
  )
  const [state, dispatch] = useReducer(reduceCallRunnerState, initialCallRunnerState)
  const [chatOpen, setChatOpen] = useState(false)

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
    if (!roomId) {
      if (storedConnection) {
        dispatch({ type: 'connection-resolved', connection: storedConnection })
      } else {
        dispatch({ type: 'connection-absent' })
      }
      return
    }
    let active = true
    getCallRoomConnection(roomId)
      .then((resolved) => {
        if (active) dispatch({ type: 'connection-resolved', connection: resolved })
      })
      .catch(() => {
        if (!active) return
        if (storedConnection) {
          dispatch({ type: 'connection-resolved', connection: storedConnection })
        } else {
          dispatch({ type: 'waiting-for-agent' })
        }
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (state.navigateTo === 'simulation') exitToSimulation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.navigateTo])

  useEffect(() => {
    if (state.phase !== 'replaced') return
    const timer = setTimeout(exitToSimulation, REPLACED_EXIT_DELAY_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  useEffect(() => {
    if (state.phase !== 'waiting-for-agent' || !roomId) return
    let active = true
    const poll = setInterval(() => {
      if (!active) return
      getCallRoomConnection(roomId)
        .then((resolved) => {
          if (active) dispatch({ type: 'connection-resolved', connection: resolved })
        })
        .catch(() => {
          // Still waiting; keep polling.
        })
    }, AGENT_POLL_INTERVAL_MS)
    return () => {
      active = false
      clearInterval(poll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, roomId])

  useEffect(() => {
    if (choices) localStorage.setItem(CALL_PREJOIN_STORAGE_KEY, JSON.stringify(choices))
  }, [choices])

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

  async function handleDisconnected(reason?: DisconnectReason) {
    if (reason === DisconnectReason.DUPLICATE_IDENTITY) {
      dispatch({ type: 'disconnected-replaced' })
      return
    }
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

  if (state.phase === 'waiting-for-agent') {
    return <CallWaitingForAgentState onBack={exitToSimulation} />
  }

  if (state.phase === 'replaced') {
    return <CallReplacedState onBack={exitToSimulation} />
  }

  const activeConnection = state.connection ?? connection
  const effectiveChoices = choices ?? (roomId ? defaultCallChoices(roomId) : null)

  if (!roomId || !activeConnection?.serverUrl || !activeConnection.participantToken || !effectiveChoices) {
    return <CallUnavailableState onBack={exitToSimulation} />
  }

  return (
    <div className="bg-background relative flex h-full min-h-[420px] flex-col overflow-hidden">
      <AiAgentHeader
        agentTier={activeConnection.actorLevel}
        agentName={activeConnection.actorName}
        callSessionId={activeConnection.callSessionId}
        participantId={participantId}
        onLeave={exitToSimulation}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((v) => !v)}
        showChatToggle
      />

      {state.phase === 'awaiting-reconnect' ? (
        <div className="flex items-center justify-between gap-3 bg-amber-500/90 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm">
          <span>The call connection dropped. Rejoin the same room when ready.</span>
          <Button size="sm" variant="secondary" onClick={reconnect}>
            Reconnect
          </Button>
        </div>
      ) : null}

      <LiveKitRoom
        key={activeConnection.participantToken}
        connect
        className="flex min-h-0 flex-1 flex-col"
        data-lk-theme="default"
        style={{ '--lk-bg': 'transparent', backgroundColor: 'transparent' } as CSSProperties}
        onDisconnected={handleDisconnected}
        options={roomOptions}
        serverUrl={activeConnection.serverUrl}
        token={activeConnection.participantToken}
      >
        <CallMediaController choices={effectiveChoices} />
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col p-3 md:p-4 lg:p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-400">{activeConnection.roomName}</p>
                <div className="flex items-center gap-3">
                  <StartAudio
                    className="text-xs font-medium text-indigo-600 underline underline-offset-2 transition hover:text-indigo-500"
                    label="Enable audio"
                  />
                  <NetworkStatus />
                </div>
              </div>

              <ParticipantGrid
                choices={effectiveChoices}
                localParticipantIdentity={activeConnection.participantIdentity}
              />

              <div className="pointer-events-none absolute inset-x-3 bottom-6 z-10 md:inset-x-6 md:bottom-8">
                <TranscriptionViewer
                  actorName={activeConnection.actorName}
                  participantName={activeConnection.participantName}
                />
              </div>
            </div>

            {chatOpen && (
              <div className="border-l border-slate-200 lg:w-80">
                <ChatSidebar
                  callSessionId={activeConnection.callSessionId}
                  participantId={participantId}
                  actorName={activeConnection.actorName}
                  participantName={activeConnection.participantName}
                />
              </div>
            )}
          </div>

          {/* Bottom control bar - always visible */}
          <div className="border-t border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-center">
              <MediaControlBar choices={effectiveChoices} onChoicesChange={(partial) =>
                setChoices((current) => (current ? { ...current, ...partial } : current))
              } />
            </div>
          </div>
        </div>
      </LiveKitRoom>
    </div>
  )
}

function CallUnavailableState({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-background flex h-full min-h-[420px] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-slate-100 text-slate-400">
        <PhoneOff className="size-7" />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Calling is not configured</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          LiveKit credentials are not available for this simulation yet.
        </p>
      </div>
      <Button onClick={onBack} variant="outline" className="mt-2">
        Back to simulation
      </Button>
    </div>
  )
}

function CallReplacedState({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-background flex h-full min-h-[420px] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-slate-100 text-slate-400">
        <MonitorSmartphone className="size-7" />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Call joined elsewhere</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          This call was opened in another device or browser, so this session was closed. Returning
          to the simulation…
        </p>
      </div>
      <Button onClick={onBack} variant="outline" className="mt-2">
        Back to simulation
      </Button>
    </div>
  )
}

function CallWaitingForAgentState({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-background flex h-full min-h-[420px] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-slate-100 text-slate-400 animate-pulse">
        <PhoneOff className="size-7" />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Waiting for the call to start…</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          The voice agent is joining the room. This page will connect automatically once it is
          ready.
        </p>
      </div>
      <Button onClick={onBack} variant="outline" className="mt-2">
        Back to simulation
      </Button>
    </div>
  )
}
