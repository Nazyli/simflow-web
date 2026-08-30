import {
  useLocalParticipant,
  useTrackTranscription,
  useVoiceAssistant,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import { useEffect, useRef, useState } from 'react'

interface TranscriptSegment {
  text: string
  lastReceivedTime?: number
  sender?: string
}

const TRANSCRIPT_CLEAR_DELAY_MS = 5000

export function TranscriptionViewer({
  actorName,
  participantName,
}: {
  actorName: string
  participantName: string
}) {
  const { audioTrack: agentAudioTrack } = useVoiceAssistant()
  const agentMessages = useTrackTranscription(agentAudioTrack)

  const { localParticipant, microphoneTrack } = useLocalParticipant()
  const localTrackRef = microphoneTrack
    ? {
        participant: localParticipant,
        publication: microphoneTrack,
        source: Track.Source.Microphone,
      }
    : undefined
  const localMessages = useTrackTranscription(localTrackRef)

  const [latestSegment, setLatestSegment] = useState<TranscriptSegment | null>(null)
  const lastTextRef = useRef('')

  useEffect(() => {
    const agentSegment = agentMessages?.segments?.at(-1)
    const localSegment = localMessages?.segments?.at(-1)

    let latest: TranscriptSegment | null = null
    if (agentSegment && localSegment) {
      latest =
        (agentSegment.lastReceivedTime ?? 0) > (localSegment.lastReceivedTime ?? 0)
          ? { ...agentSegment, sender: actorName }
          : { ...localSegment, sender: participantName }
    } else if (agentSegment) {
      latest = { ...agentSegment, sender: actorName }
    } else if (localSegment) {
      latest = { ...localSegment, sender: participantName }
    }

    if (!latest || latest.text === lastTextRef.current) return

    let text = latest.text
    const brPattern = /<br\s*\/?>+/gi
    if (brPattern.test(text)) {
      const parts = text.split(brPattern).filter((part) => part.trim() !== '')
      text = parts.at(-1)?.trim() || ''
      lastTextRef.current = ''
    }

    setLatestSegment({ ...latest, text })
    lastTextRef.current = latest.text
  }, [agentMessages?.segments, localMessages?.segments, actorName, participantName])

  useEffect(() => {
    if (!latestSegment) return
    const timer = setTimeout(() => {
      setLatestSegment(null)
      lastTextRef.current = ''
    }, TRANSCRIPT_CLEAR_DELAY_MS)
    return () => clearTimeout(timer)
  }, [latestSegment])

  if (!latestSegment) return null

  const isParticipant = latestSegment.sender === participantName
  return (
    <div className="mx-auto max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p
        className={`rounded-xl px-4 py-2.5 text-sm shadow-lg backdrop-blur-md ${
          isParticipant
            ? 'bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-500/30'
            : 'bg-violet-500/20 text-violet-100 ring-1 ring-violet-500/30'
        }`}
      >
        <span className="mr-1.5 font-semibold opacity-80">{latestSegment.sender}:</span>
        {latestSegment.text}
      </p>
    </div>
  )
}
