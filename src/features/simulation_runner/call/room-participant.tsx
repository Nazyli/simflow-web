import {
  BarVisualizer,
  ParticipantName,
  RoomAudioRenderer,
  TrackLoop,
  TrackRefContext,
  useTracks,
  VideoTrack,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import { Camera, CameraOff, Mic, MicOff } from 'lucide-react'
import type { CallPrejoinChoices } from './types'
import { MediaControlBar } from './media-control-bar'

function getInitials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? '?').toUpperCase()
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase() || '?'
}

export function RoomParticipant({
  choices,
  localParticipantIdentity,
  onChoicesChange,
}: {
  choices: CallPrejoinChoices
  localParticipantIdentity: string
  onChoicesChange: (choices: Partial<CallPrejoinChoices>) => void
}) {
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

  const participantCount = cameraTracks.length

  return (
    <section className="relative min-h-0 flex-1 overflow-hidden rounded-xl">
      <RoomAudioRenderer />
      <div
        className={`grid h-full gap-2 md:gap-3 ${
          participantCount <= 1
            ? 'grid-cols-1'
            : participantCount === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : participantCount <= 4
                ? 'grid-cols-2'
                : 'grid-cols-2 lg:grid-cols-3'
        }`}
      >
        <TrackLoop tracks={cameraTracks}>
          <TrackRefContext.Consumer>
            {(trackRef) => {
              if (!trackRef) return null
              const participant = trackRef.participant
              const isLocal = participant.identity === localParticipantIdentity
              const micTrack = microphoneTracks.find(
                (track) => track.participant.identity === participant.identity,
              )
              const isMicMuted = isLocal
                ? !choices.audioEnabled
                : (micTrack?.publication?.isMuted ?? true)
              const isCameraMuted = isLocal
                ? !choices.videoEnabled
                : (trackRef.publication?.isMuted ?? true)

              return (
                <article className="bg-[#2d2d44] relative overflow-hidden rounded-xl shadow-inner transition-all duration-200">
                  {!isCameraMuted && trackRef.publication ? (
                    <VideoTrack
                      className="absolute inset-0 size-full object-cover"
                      trackRef={trackRef}
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#2d2d44] to-[#1a1a2e]">
                      <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 text-2xl font-bold text-white shadow-lg ring-2 ring-white/10 md:size-24 md:text-3xl">
                        {getInitials(participant.name || participant.identity)}
                      </div>
                      <span className="text-sm font-medium text-white/60">
                        {participant.name || participant.identity}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1.5 text-xs text-white backdrop-blur-md md:top-3 md:left-3">
                    {isMicMuted ? (
                      <MicOff className="size-3.5 text-red-400" />
                    ) : (
                      <Mic className="size-3.5 text-green-400" />
                    )}
                    {isCameraMuted ? (
                      <CameraOff className="size-3.5 text-red-400" />
                    ) : (
                      <Camera className="size-3.5 text-green-400" />
                    )}
                    {micTrack && !isMicMuted ? (
                      <BarVisualizer barCount={5} className="h-3.5 w-12" track={micTrack} />
                    ) : null}
                    <ParticipantName className="ml-1 max-w-[80px] truncate md:max-w-[120px]" />
                  </div>

                  {isLocal ? (
                    <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center md:bottom-4">
                      <MediaControlBar choices={choices} onChoicesChange={onChoicesChange} />
                    </div>
                  ) : null}
                </article>
              )
            }}
          </TrackRefContext.Consumer>
        </TrackLoop>
      </div>
      {!cameraTracks.length ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-white/40">
          <div className="grid size-16 place-items-center rounded-full bg-white/5">
            <Camera className="size-7" />
          </div>
          <p className="text-sm font-medium">Waiting for participants…</p>
        </div>
      ) : null}
    </section>
  )
}
