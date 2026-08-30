import { AgentAudioVisualizerWave } from '@/components/agent-audio-visualizer-wave'
import { RoomAudioRenderer, useTracks, VideoTrack } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { Camera, CameraOff, Mic, MicOff } from 'lucide-react'
import type { CallPrejoinChoices } from './types'

type TrackRef = ReturnType<typeof useTracks>[number]

function getInitials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? '?').toUpperCase()
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase() || '?'
}

// Equal-size tiles: one row per participant count keeps sizes uniform.
const GRID_LAYOUT: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2',
}

interface ParticipantGridProps {
  choices: CallPrejoinChoices
  localParticipantIdentity: string
}

export function ParticipantGrid({ choices, localParticipantIdentity }: ParticipantGridProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Microphone, withPlaceholder: true },
    ],
    { onlySubscribed: false },
  )

  const microphoneTracks = tracks.filter((track) => track.source === Track.Source.Microphone)
  const cameraTracks = tracks
    .filter((track) => track.source === Track.Source.Camera)
    .sort((a, b) => {
      if (a.participant.identity === localParticipantIdentity) return 1
      if (b.participant.identity === localParticipantIdentity) return -1
      return 0
    })

  if (cameraTracks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-400">
        <div className="grid size-20 place-items-center rounded-full bg-slate-100">
          <Camera className="size-8" />
        </div>
        <p className="text-sm font-medium">Waiting for participants…</p>
      </div>
    )
  }

  const gridClass = GRID_LAYOUT[cameraTracks.length] ?? 'grid-cols-2 md:grid-cols-3'

  return (
    <section className="relative min-h-0 flex-1">
      <RoomAudioRenderer />
      <div className={`grid h-full auto-rows-fr gap-3 ${gridClass}`}>
        {cameraTracks.map((trackRef) => (
          <ParticipantTile
            key={trackRef.participant.identity}
            trackRef={trackRef}
            micTrack={microphoneTracks.find(
              (track) => track.participant.identity === trackRef.participant.identity,
            )}
            isLocal={trackRef.participant.identity === localParticipantIdentity}
            audioEnabled={choices.audioEnabled}
            videoEnabled={choices.videoEnabled}
          />
        ))}
      </div>
    </section>
  )
}

function ParticipantTile({
  trackRef,
  micTrack,
  isLocal,
  audioEnabled,
  videoEnabled,
}: {
  trackRef: TrackRef
  micTrack: TrackRef | undefined
  isLocal: boolean
  audioEnabled: boolean
  videoEnabled: boolean
}) {
  const participant = trackRef.participant
  const isMicMuted = isLocal ? !audioEnabled : (micTrack?.publication?.isMuted ?? true)
  const isCameraMuted = isLocal ? !videoEnabled : (trackRef.publication?.isMuted ?? true)

  return (
    <article
      className={`relative min-h-0 overflow-hidden rounded-2xl bg-slate-100 shadow-sm transition-all duration-200 ${
        isLocal ? 'ring-2 ring-indigo-300' : 'ring-1 ring-slate-200'
      }`}
    >
      {!isCameraMuted && trackRef.publication ? (
        <VideoTrack className="absolute inset-0 size-full object-cover" trackRef={trackRef} />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-100 to-slate-200">
          <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white shadow-lg md:size-24 md:text-3xl">
            {getInitials(participant.name || participant.identity)}
          </div>
          <span className="text-sm font-semibold text-slate-600">
            {participant.name || participant.identity}
          </span>
        </div>
      )}

      <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs text-slate-700 shadow-sm backdrop-blur-md md:top-3 md:left-3">
        {isMicMuted ? (
          <MicOff className="size-3.5 text-red-500" />
        ) : (
          <Mic className="size-3.5 text-green-500" />
        )}
        {isCameraMuted ? (
          <CameraOff className="size-3.5 text-red-500" />
        ) : (
          <Camera className="size-3.5 text-green-500" />
        )}

        {micTrack && !isMicMuted ? (
          <AgentAudioVisualizerWave
            size="icon"
            state={isLocal && audioEnabled ? 'speaking' : 'listening'}
            color="#6366f1"
            audioTrack={micTrack}
            className="h-5 w-7"
          />
        ) : null}

        <span className="ml-0.5 max-w-[90px] truncate font-medium md:max-w-[130px]">
          {participant.name || participant.identity}
        </span>
        {isLocal ? (
          <span className="rounded bg-indigo-100 px-1 py-0.5 text-[9px] font-semibold text-indigo-700">
            You
          </span>
        ) : null}
      </div>
    </article>
  )
}
