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

  return (
    <section className="bg-muted relative min-h-0 flex-1 space-y-3 overflow-y-auto rounded-xl p-4">
      <RoomAudioRenderer />
      <TrackLoop tracks={cameraTracks}>
        <TrackRefContext.Consumer>
          {(trackRef) => {
            if (!trackRef) return null
            const participant = trackRef.participant
            const isLocal = participant.identity === localParticipantIdentity
            const micTrack = microphoneTracks.find(
              (track) => track.participant.identity === participant.identity,
            )
            // Local mute state follows the control bar choices; remote state
            // comes from the LiveKit publication.
            const isMicMuted = isLocal
              ? !choices.audioEnabled
              : (micTrack?.publication?.isMuted ?? true)
            const isCameraMuted = isLocal
              ? !choices.videoEnabled
              : (trackRef.publication?.isMuted ?? true)

            return (
              <article className="border-border bg-background relative aspect-video overflow-hidden rounded-lg border shadow-sm">
                {!isCameraMuted && trackRef.publication ? (
                  <VideoTrack
                    className="absolute inset-0 size-full object-cover"
                    trackRef={trackRef}
                  />
                ) : (
                  <div className="grid size-full place-items-center">
                    <div className="bg-primary/20 text-primary grid size-20 place-items-center rounded-full text-2xl font-bold">
                      {getInitials(participant.name || participant.identity)}
                    </div>
                  </div>
                )}

                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 text-xs text-white">
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
                    <BarVisualizer barCount={5} className="h-4" track={micTrack} />
                  ) : null}
                  <ParticipantName />
                </div>

                {isLocal ? (
                  <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center">
                    <MediaControlBar choices={choices} onChoicesChange={onChoicesChange} />
                  </div>
                ) : null}
              </article>
            )
          }}
        </TrackRefContext.Consumer>
      </TrackLoop>
      {!cameraTracks.length ? (
        <div className="text-muted-foreground grid h-full place-items-center text-sm">
          Waiting for participants…
        </div>
      ) : null}
    </section>
  )
}
