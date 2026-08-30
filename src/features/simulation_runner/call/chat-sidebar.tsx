import { Send } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { getCallHistory } from '../../../shared/api/agent-call'

interface ChatMessage {
  id: string
  sender: string
  text: string
}

export function ChatSidebar({
  callSessionId,
  participantId,
}: {
  callSessionId: string
  participantId: string
}) {
  const room = useRoomContext()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')

  useEffect(() => {
    if (!callSessionId) return
    let active = true
    void getCallHistory(callSessionId, participantId)
      .then((history) => {
        if (!active) return
        const ordered = [...history].sort((a, b) => {
          if (a.spokenAt === b.spokenAt) {
            return a.callMessageId < b.callMessageId
              ? -1
              : a.callMessageId > b.callMessageId
                ? 1
                : 0
          }
          return a.spokenAt < b.spokenAt ? -1 : 1
        })
        setMessages(
          ordered.map((item) => ({
            id: item.callMessageId,
            sender: item.senderName,
            text: item.content,
          })),
        )
      })
      .catch(() => {
        if (active) setMessages([])
      })
    return () => {
      active = false
    }
  }, [callSessionId, participantId])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = text.trim()
    if (!message) return
    await room.localParticipant.sendText(message, { topic: 'lk.chat' })
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-${message}`, sender: 'You', text: message },
    ])
    setText('')
  }

  return (
    <aside className="flex h-full w-full flex-col bg-[#1e1e36]">
      <header className="border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">In-call messages</h2>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages.length
          ? messages.map((message) => (
              <div key={message.id} className="rounded-lg bg-white/5 px-3 py-2">
                <span className="text-xs font-medium text-blue-300">{message.sender}</span>
                <p className="mt-0.5 text-white/80">{message.text}</p>
              </div>
            ))
          : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-white/30">
              <p className="text-xs">No messages yet</p>
            </div>
          )}
      </div>
      <form className="flex gap-2 border-t border-white/10 p-3" onSubmit={submit}>
        <Input
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a message…"
          value={text}
          className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
        />
        <Button
          aria-label="Send message"
          size="icon"
          type="submit"
          className="shrink-0 rounded-lg bg-blue-600 hover:bg-blue-500"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </aside>
  )
}
