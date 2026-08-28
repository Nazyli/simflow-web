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
    <aside className="border-border bg-card flex min-h-0 w-full flex-col rounded-xl border lg:w-72">
      <header className="border-border border-b px-4 py-3">
        <h2 className="text-foreground text-sm font-semibold">Call chat</h2>
      </header>
      <div className="text-muted-foreground min-h-0 flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages.length
          ? messages.map((message) => (
              <p key={message.id}>
                <span className="text-foreground font-medium">{message.sender}: </span>
                {message.text}
              </p>
            ))
          : 'No messages yet.'}
      </div>
      <form className="border-border flex gap-2 border-t p-3" onSubmit={submit}>
        <Input
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a message"
          value={text}
        />
        <Button aria-label="Send message" size="icon" type="submit">
          <Send />
        </Button>
      </form>
    </aside>
  )
}
