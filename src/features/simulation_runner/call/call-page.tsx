import { Video } from 'lucide-react'
import { useEffect, useReducer, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { ApiError } from '../../../shared/api/client'
import { getCallConnection, requestCallJoin } from '../../../shared/api/agent-call'
import { useSimulationRun } from '../simulation-run-context'
import { initialCallInviteState, parseInviteToken, reduceCallInviteState } from './call-invite'
import { defaultCallChoices, storeCallConnection, type CallPrejoinChoices } from './types'

const INVITE_POLL_INTERVAL_MS = 1500
const INVITE_POLL_LIMIT = 14

export function CallPrejoinPage() {
  const { participantId } = useSimulationRun()
  const navigate = useNavigate()
  const location = useLocation()
  const inviteToken = parseInviteToken(location.search)
  const [message, setMessage] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [invite, dispatchInvite] = useReducer(reduceCallInviteState, initialCallInviteState)
  const started = useRef(false)
  const active = useRef(true)

  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])

  function enterRoom(details: Awaited<ReturnType<typeof getCallConnection>>) {
    const choices: CallPrejoinChoices = defaultCallChoices(details.roomName)
    storeCallConnection(details, choices)
    navigate(
      `/simulation/${encodeURIComponent(participantId)}/call/${encodeURIComponent(details.roomName)}`,
    )
  }

  async function connect() {
    setMessage(null)
    try {
      const details = await getCallConnection(participantId)
      if (!details.serverUrl || !details.participantToken || !details.roomName) {
        setMessage('There is no active call for this participant yet.')
        return
      }
      enterRoom(details)
    } catch {
      setMessage('Calling is not configured yet. LiveKit credentials are unavailable.')
    }
  }

  async function waitForCall() {
    for (let attempt = 0; attempt < INVITE_POLL_LIMIT; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, INVITE_POLL_INTERVAL_MS))
      if (!active.current) return
      try {
        const details = await getCallConnection(participantId)
        if (details.serverUrl && details.participantToken && details.roomName) {
          if (!active.current) return
          dispatchInvite({ type: 'connection-resolved', connection: details })
          enterRoom(details)
          return
        }
      } catch {
        // The call is still being prepared; keep polling until the limit.
      }
    }
    if (active.current) {
      dispatchInvite({
        type: 'join-failed',
        message: 'The call is not ready yet. Please try joining again.',
      })
    }
  }

  async function joinInvitedCall() {
    if (!inviteToken) return
    const eventId = invite.eventId ?? crypto.randomUUID()
    const occurredAt = new Date().toISOString()
    dispatchInvite({ type: 'join-requested', eventId, occurredAt })
    try {
      await requestCallJoin(participantId, inviteToken, eventId, occurredAt)
      if (!active.current) return
      dispatchInvite({ type: 'join-succeeded' })
      await waitForCall()
    } catch (error) {
      if (!active.current) return
      const expired = error instanceof ApiError && error.status === 404
      dispatchInvite({
        type: 'join-failed',
        expired,
        message: expired ? undefined : 'Could not join the call. Please try again.',
      })
    }
  }

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (inviteToken) {
      dispatchInvite({ type: 'invitation-loaded', invitationId: inviteToken })
      return
    }
    void connect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId, inviteToken])

  if (inviteToken) {
    const phase = invite.phase
    return (
      <div className="border-border bg-card flex h-full min-h-[420px] items-center justify-center rounded-xl border p-6 shadow-sm">
        <div className="w-full max-w-lg space-y-6">
          <header className="space-y-1">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <Video className="size-5" />
            </div>
            <h2 className="text-foreground pt-2 text-lg font-semibold">Call invitation</h2>
            <p className="text-muted-foreground text-sm">
              You are invited to join a live call with the simulation actor.
            </p>
          </header>
          {phase === 'expired' ? (
            <p className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm">
              This invitation has expired or is no longer active.
            </p>
          ) : null}
          {invite.errorMessage ? (
            <p className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm">
              {invite.errorMessage}
            </p>
          ) : null}
          {phase === 'waiting-for-call' ? (
            <p className="text-muted-foreground text-sm">Preparing the call room…</p>
          ) : null}
          {phase === 'joining' ? (
            <Button className="w-full" disabled>
              Joining…
            </Button>
          ) : phase === 'waiting-for-call' ? (
            <Button className="w-full" disabled>
              Waiting for the call…
            </Button>
          ) : phase === 'expired' ? null : (
            <Button className="w-full" onClick={() => void joinInvitedCall()}>
              Join call
            </Button>
          )}
        </div>
      </div>
    )
  }

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
