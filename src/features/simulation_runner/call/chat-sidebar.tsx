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
    <aside className="flex h-full w-full flex-col bg-white">
      <header className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">In-call messages</h2>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages.length
          ? messages.map((message) => (
              <div key={message.id} className="rounded-lg bg-slate-100 px-3 py-2">
                <span className="text-xs font-medium text-indigo-600">{message.sender}</span>
                <p className="mt-0.5 text-slate-700">{message.text}</p>
              </div>
            ))
          : (
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
          className="shrink-0 rounded-lg bg-indigo-600 hover:bg-indigo-500"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </aside>
  )
}
