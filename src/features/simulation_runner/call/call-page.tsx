import { Video } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { getCallConnection } from '../../../shared/api/agent-call'
import { useSimulationRun } from '../simulation-run-context'
import { defaultCallChoices, storeCallConnection, type CallPrejoinChoices } from './types'

export function CallPrejoinPage() {
  const { participantId } = useSimulationRun()
  const navigate = useNavigate()
  const [message, setMessage] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const started = useRef(false)

  async function connect() {
    setMessage(null)
    try {
      const details = await getCallConnection(participantId)
      if (!details.serverUrl || !details.participantToken || !details.roomName) {
        setMessage('There is no active call for this participant yet.')
        return
      }
      const choices: CallPrejoinChoices = defaultCallChoices(details.roomName)
      storeCallConnection(details, choices)
      navigate(
        `/simulation/${encodeURIComponent(participantId)}/call/${encodeURIComponent(details.roomName)}`,
      )
    } catch {
      setMessage('Calling is not configured yet. LiveKit credentials are unavailable.')
    }
  }

  useEffect(() => {
    if (started.current) return
    started.current = true
    void connect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId])

  return (
    <div className="border-border bg-card flex h-full min-h-[420px] items-center justify-center rounded-xl border p-6 shadow-sm">
      <div className="w-full max-w-lg space-y-6">
        <header className="space-y-1">
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
            <Video className="size-5" />
          </div>
          <h2 className="text-foreground pt-2 text-lg font-semibold">Live call</h2>
          <p className="text-muted-foreground text-sm">
            Joining the active simulation call for this participant.
          </p>
        </header>
        {message ? (
          <p className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm">{message}</p>
        ) : (
          <p className="text-muted-foreground text-sm">Connecting to the call room…</p>
        )}
        {message ? (
          <Button
            className="w-full"
            disabled={retrying}
            onClick={() => {
              setRetrying(true)
              void connect().finally(() => setRetrying(false))
            }}
          >
            {retrying ? 'Checking again…' : 'Check again'}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
