import { PhoneOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { DocumentChannelPage as DocumentChannelPageImpl } from './document-channel-page'
import { EmailChannelPage as EmailChannelPageImpl } from './email-channel-page'
import { useSimulationRun } from './simulation-run-context'

export function EmailChannelPage() {
  return <EmailChannelPageImpl />
}

export function CallChannelPage() {
  const { participantId } = useSimulationRun()
  const navigate = useNavigate()

  return (
    <div className="border-border bg-card flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-xl border px-6 text-center shadow-sm">
      <span className="bg-muted text-muted-foreground grid size-12 place-items-center rounded-full">
        <PhoneOff className="size-5" />
      </span>
      <div>
        <h2 className="text-foreground text-sm font-semibold">No active call</h2>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          Join a call by clicking the invitation link sent by an actor in the Conversations channel.
        </p>
      </div>
      <Button
        onClick={() => navigate(`/simulation/${encodeURIComponent(participantId)}/chat`)}
        variant="outline"
      >
        Go to Conversations
      </Button>
    </div>
  )
}

export function DocumentChannelPage() {
  return <DocumentChannelPageImpl />
}
