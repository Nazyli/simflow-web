import { Send } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import {
  useLocalParticipant,
  useRoomContext,
  useTrackTranscription,
  useVoiceAssistant,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { getCallHistory } from '../../../shared/api/agent-call'

interface ChatMessage {
  id: string
  sender: string
  text: string
}

const BR_SPLIT_PATTERN = /<br\s*\/?>/gi

export function ChatSidebar({
  participantCallSessionId,
  participantId,
  actorName,
  participantName,
}: {
  participantCallSessionId: string
  participantId: string
  actorName: string
  participantName: string
}) {
  const room = useRoomContext()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!participantCallSessionId) return
    let active = true
    getCallHistory(participantCallSessionId, participantId)
      .then((history) => {
        if (!active) return
        const ordered = [...history].sort((a, b) => {
          if (a.spokenAt === b.spokenAt) {
            return a.participantCallId < b.participantCallId
              ? -1
              : a.participantCallId > b.participantCallId
                ? 1
                : 0
          }
          return a.spokenAt < b.spokenAt ? -1 : 1
        })
        const baseline: ChatMessage[] = ordered.map((item) => ({
          id: item.participantCallId,
          sender: item.senderName,
          text: item.content,
        }))
        setMessages((current) => {
          const liveTexts = new Set(current.map((message) => message.text))
          return [...baseline.filter((item) => !liveTexts.has(item.text)), ...current]
        })
      })
      .catch(() => {
        // No baseline available; live transcription still renders.
      })
    return () => {
      active = false
    }
  }, [participantCallSessionId, participantId])

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

  useEffect(() => {
    function upsert(segments: { id: string; text: string }[] | undefined, sender: string) {
      for (const segment of segments ?? []) {
        const parts = segment.text
          .split(BR_SPLIT_PATTERN)
          .map((part) => part.trim())
          .filter(Boolean)
        if (!parts.length) continue
        const entries =
          parts.length === 1
            ? [{ id: segment.id, text: parts[0] }]
            : parts.map((part, index) => ({ id: `${segment.id}#${index}`, text: part }))
        setMessages((current) => {
          let changed = false
          const next = [...current]
          for (const entry of entries) {
            const existingIndex = next.findIndex((message) => message.id === entry.id)
            if (existingIndex === -1) {
              next.push({ id: entry.id, sender, text: entry.text })
              changed = true
            } else if (next[existingIndex].text !== entry.text) {
              next[existingIndex] = { ...next[existingIndex], text: entry.text }
              changed = true
            }
          }
          return changed ? next : current
        })
      }
    }

    upsert(agentMessages?.segments, actorName)
    upsert(localMessages?.segments, participantName)
  }, [agentMessages?.segments, localMessages?.segments, actorName, participantName])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages.length])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = text.trim()
    if (!message) return
    await room.localParticipant.sendText(message, { topic: 'lk.chat' })
    setMessages((current) => [
      ...current,
      { id: `local-${Date.now()}`, sender: participantName, text: message },
    ])
    setText('')
  }

  return (
    <aside className="flex h-full w-full flex-col bg-white">
      <header className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">In-call messages</h2>
      </header>
      <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages.length ? (
          messages.map((message) => (
          <div key={message.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs font-medium text-indigo-600">{message.sender}</span>
              <p className="mt-0.5 text-slate-700">{message.text}</p>
            </div>
          ))
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
            <p className="text-xs">No messages yet</p>
          </div>
        )}
      </div>
      <form className="flex gap-2 border-t border-slate-200 p-3" onSubmit={submit}>
        <Input
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a message…"
          value={text}
          className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20"
        />
        <Button
          aria-label="Send message"
          size="icon"
          type="submit"
          className="shrink-0 rounded-md bg-indigo-600 hover:bg-indigo-500"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </aside>
  )
}
