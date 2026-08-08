import { useQuery } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { getMasterData } from '../../shared/api/master-data'
import { CallWorkspace, DocumentWorkspace, EmailWorkspace } from './channel-workspaces'
import { useSimulationRun } from './simulation-run-context'

type FeedChannel = 'email' | 'call' | 'document'

function FeedChannelPage({ channel }: { channel: FeedChannel }) {
  const { runnerParticipantId, waitingRuns, waitingForRead, isChannelActionPending, submitChannelAction } = useSimulationRun()
  const actors = useQuery({ queryKey: ['master', 'actors'], queryFn: () => getMasterData('actors'), enabled: channel !== 'document' })
  const documents = useQuery({ queryKey: ['master', 'documents'], queryFn: () => getMasterData('documents'), enabled: channel === 'document' })
  const disabled = isChannelActionPending || !waitingRuns.length || waitingForRead

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    submitChannelAction({ channel, target: String(data.get('target') ?? ''), content: String(data.get('content') ?? '') })
    event.currentTarget.reset()
  }

  if (channel === 'email') {
    return <EmailWorkspace participantId={runnerParticipantId} events={[]} actors={actors.data ?? []} documents={[]} disabled={disabled} onSubmit={submit} />
  }
  if (channel === 'call') {
    return <CallWorkspace participantId={runnerParticipantId} events={[]} actors={actors.data ?? []} documents={[]} disabled={disabled} onSubmit={submit} />
  }
  return <DocumentWorkspace participantId={runnerParticipantId} events={[]} actors={[]} documents={documents.data ?? []} disabled={disabled} onSubmit={submit} />
}

export function EmailChannelPage() {
  return <FeedChannelPage channel="email" />
}

export function CallChannelPage() {
  return <FeedChannelPage channel="call" />
}

export function DocumentChannelPage() {
  return <FeedChannelPage channel="document" />
}
