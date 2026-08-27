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
    <section className="relative min-h-0 flex-1 rounded-xl bg-muted p-4">
      <RoomAudioRenderer />
      <TrackLoop tracks={tracks}>
        <TrackRefContext.Consumer>
          {(trackRef) => {
            if (!trackRef) return null
            const isLocal = trackRef.participant.identity === localParticipantIdentity
            if (!trackRef.publication) {
              return (
                <article className="grid aspect-video place-items-center rounded-lg border border-border bg-background text-sm text-muted-foreground shadow-sm">
                  <ParticipantName />
                </article>
              )
            }
            return (
              <article className="relative aspect-video overflow-hidden rounded-lg border border-border bg-background shadow-sm">
                {trackRef.publication.isMuted ? (
                  <div className="grid size-full place-items-center text-sm text-muted-foreground">
                    <ParticipantName />
                  </div>
                ) : (
                  <VideoTrack className="size-full object-cover" trackRef={trackRef} />
                )}
                <span className="absolute top-3 left-3 rounded-md bg-background/85 px-2 py-1 text-xs font-medium text-foreground">
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
        <div className="grid h-full place-items-center text-sm text-muted-foreground">Waiting for participants…</div>
      ) : null}
    </section>
  )
}
