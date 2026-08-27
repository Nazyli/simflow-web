import { Send } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'

interface ChatMessage {
  id: string
  text: string
}

export function ChatSidebar() {
  const room = useRoomContext()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = text.trim()
    if (!message) return
    await room.localParticipant.sendText(message, { topic: 'lk.chat' })
    setMessages((current) => [...current, { id: `${Date.now()}-${message}`, text: message }])
    setText('')
  }

  return (
    <aside className="flex min-h-0 w-full flex-col rounded-xl border border-border bg-card lg:w-72">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Call chat</h2>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 text-sm text-muted-foreground">
        {messages.length ? messages.map((message) => <p key={message.id}>{message.text}</p>) : 'No messages yet.'}
      </div>
      <form className="flex gap-2 border-t border-border p-3" onSubmit={submit}>
        <Input onChange={(event) => setText(event.target.value)} placeholder="Type a message" value={text} />
        <Button aria-label="Send message" size="icon" type="submit">
          <Send />
        </Button>
      </form>
    </aside>
  )
}
