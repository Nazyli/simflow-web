import { useTrackTranscription, useVoiceAssistant } from '@livekit/components-react'

export function TranscriptionViewer({ actorName }: { actorName: string }) {
  const { audioTrack } = useVoiceAssistant()
  const transcript = useTrackTranscription(audioTrack)
  const latest = transcript.segments.at(-1)

  if (!latest?.text) return null
  return (
    <p className="border-border bg-card text-foreground rounded-lg border px-3 py-2 text-sm shadow-sm">
      <span className="font-medium">{actorName}: </span>
      {latest.text}
    </p>
  )
}
