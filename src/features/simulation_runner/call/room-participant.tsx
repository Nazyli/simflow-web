import {
  ParticipantName,
  RoomAudioRenderer,
  TrackLoop,
  TrackRefContext,
  useTracks,
  VideoTrack,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import type { CallPrejoinChoices } from './types'
import { MediaControlBar } from './media-control-bar'

export function RoomParticipant({
  choices,
  localParticipantIdentity,
  onChoicesChange,
}: {
  choices: CallPrejoinChoices
  localParticipantIdentity: string
  onChoicesChange: (choices: Partial<CallPrejoinChoices>) => void
}) {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: false,
  })

  return (
    <section className="bg-muted relative min-h-0 flex-1 rounded-xl p-4">
      <RoomAudioRenderer />
      <TrackLoop tracks={tracks}>
        <TrackRefContext.Consumer>
          {(trackRef) => {
            if (!trackRef) return null
            const isLocal = trackRef.participant.identity === localParticipantIdentity
            if (!trackRef.publication) {
              return (
                <article className="border-border bg-background text-muted-foreground grid aspect-video place-items-center rounded-lg border text-sm shadow-sm">
                  <ParticipantName />
                </article>
              )
            }
            return (
              <article className="border-border bg-background relative aspect-video overflow-hidden rounded-lg border shadow-sm">
                {trackRef.publication.isMuted ? (
                  <div className="text-muted-foreground grid size-full place-items-center text-sm">
                    <ParticipantName />
                  </div>
                ) : (
                  <VideoTrack className="size-full object-cover" trackRef={trackRef} />
                )}
                <span className="bg-background/85 text-foreground absolute top-3 left-3 rounded-md px-2 py-1 text-xs font-medium">
                  <ParticipantName />
                </span>
                {isLocal ? (
                  <div className="absolute right-3 bottom-3">
                    <MediaControlBar choices={choices} onChoicesChange={onChoicesChange} />
                  </div>
                ) : null}
              </article>
            )
          }}
        </TrackRefContext.Consumer>
      </TrackLoop>
      {!tracks.length ? (
        <div className="text-muted-foreground grid h-full place-items-center text-sm">
          Waiting for participants…
        </div>
      ) : null}
    </section>
  )
}
