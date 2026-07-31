import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock3, UserRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { getExecution, startExecution, submitExecutionAction } from '../../shared/api/executions'
import { getMasterData } from '../../shared/api/master-data'
import { getSession, type SessionChannelEvent } from '../../shared/api/sessions'
import { getPublishedVersions } from '../../shared/api/workflows'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import { StatusBadge } from '../../shared/components/status-badge'
import type { Execution } from '../../shared/types/workflow'
import { CallWorkspace, DocumentWorkspace, EmailWorkspace } from './channel-workspaces'
import type { Channel, ChannelWorkspaceProps } from './channel-workspaces'
import { ChatWorkspace } from './chat/chat-workspace'

const channels: Channel[] = ['chat', 'email', 'call', 'document']
const eventLists: Record<Channel, keyof Pick<Awaited<ReturnType<typeof getSession>>, 'chat_inbox' | 'email_inbox' | 'call_state' | 'document_state'>> = { chat: 'chat_inbox', email: 'email_inbox', call: 'call_state', document: 'document_state' }

export function SimulationRunnerPage() {
  const client = useQueryClient()
  const [participantId, setParticipantId] = useState('')
  const [actorId, setActorId] = useState('')
  const [versionId, setVersionId] = useState('')
  const [execution, setExecution] = useState<Execution | null>(null)
  const versions = useQuery({ queryKey: ['published-versions'], queryFn: getPublishedVersions })
  const actors = useQuery({ queryKey: ['master', 'actors'], queryFn: () => getMasterData('actors') })
  const documents = useQuery({ queryKey: ['master', 'documents'], queryFn: () => getMasterData('documents') })
  const executionState = useQuery({ queryKey: ['execution', execution?.execution_id], queryFn: () => getExecution(execution!.execution_id), enabled: Boolean(execution), refetchInterval: execution?.status === 'waiting' || execution?.status === 'running' ? 2_000 : false })
  const session = useQuery({ queryKey: ['session', execution?.session_id], queryFn: () => getSession(execution!.session_id!), enabled: Boolean(execution?.session_id), refetchInterval: execution?.status === 'waiting' || execution?.status === 'running' ? 2_000 : false })
  useEffect(() => { if (executionState.data) setExecution(executionState.data) }, [executionState.data])
  const start = useMutation({ mutationFn: startExecution, onSuccess: (result) => { setExecution(result); setVersionId(result.workflow_version_id); client.invalidateQueries({ queryKey: ['session', result.session_id] }); toast.success(result.status === 'waiting' ? 'Active simulation resumed.' : 'Simulation started.') }, onError: () => toast.error('Unable to start or resume the simulation.') })
  const action = useMutation({ mutationFn: ({ channel, target, content, actionType, waitInstanceId, conversationId }: { channel: Channel; target: string; content: string; actionType: string; waitInstanceId: string; conversationId: string }) => submitExecutionAction(execution!.execution_id, { action_type: actionType, actor_id: actorId, wait_instance_id: waitInstanceId, conversation_id: conversationId, payload: { channel, content, to: target, document_id: channel === 'document' ? target : undefined } }), onSuccess: (result) => { setExecution(result); client.invalidateQueries({ queryKey: ['session', result.session_id] }); toast.success('Workflow action submitted.') }, onError: () => toast.error('Action was rejected. Check the requested channel and target.') })
  const workflow = versions.data?.find((item) => item.workflow_version_id === versionId)
  const elapsed = execution ? new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' }).format(new Date()) : '—'
  function begin(event: FormEvent) { event.preventDefault(); start.mutate({ workflow_version_id: versionId, participant_id: participantId.trim(), context: { actor_id: actorId } }) }
  function send(channel: Channel, event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const wait = execution?.context.active_wait; if (!wait || typeof wait !== 'object' || typeof (wait as Record<string, unknown>).wait_instance_id !== 'string' || typeof (wait as Record<string, unknown>).conversation_id !== 'string') { toast.error('No active Wait for Reply is available.'); return }; const actionType = channel === 'chat' || channel === 'email' ? 'message' : channel === 'call' ? 'finish_call' : 'close_document'; action.mutate({ channel, target: String(data.get('target') ?? ''), content: String(data.get('content') ?? ''), actionType, waitInstanceId: (wait as Record<string, string>).wait_instance_id, conversationId: (wait as Record<string, string>).conversation_id }); event.currentTarget.reset() }

  if (!execution) return <main className="runner-page"><header><div><p className="eyebrow">Simulation cockpit</p><h1>Start a guided run</h1><p>Select a participant actor and workflow, then enter the participant ID to start or resume a simulation.</p></div></header><form className="runner-start" onSubmit={begin}><label>Participant actor<select required value={actorId} onChange={(event) => setActorId(event.target.value)}><option value="">Select actor</option>{actors.data?.map((actor) => <option key={String(actor.actor_id)} value={String(actor.actor_id)}>{String(actor.actor_name)}</option>)}</select></label><label>Participant ID<input required value={participantId} placeholder="e.g. participant-123" onChange={(event) => setParticipantId(event.target.value)} /></label><label>Workflow version<select required value={versionId} onChange={(event) => setVersionId(event.target.value)}><option value="">Select workflow</option>{versions.data?.map((item) => <option key={item.workflow_version_id} value={item.workflow_version_id}>{item.workflow_name} · v{item.version_number}</option>)}</select></label><button disabled={!actorId || !participantId.trim() || !versionId || start.isPending}>{start.isPending ? 'Checking simulation…' : 'Start or resume simulation'}</button>{start.isError && <ErrorState message="Unable to start or resume the simulation." />}</form>{versions.isPending && <LoadingState />}</main>

  return <main className="runner-page cockpit"><header className="cockpit-header"><div><p className="eyebrow">Simulation cockpit</p><h1>{workflow?.workflow_name ?? 'Active simulation'}</h1><span>Version {workflow?.version_number ?? '—'} · Session {execution.session_id}</span></div><div className="cockpit-metrics"><div><UserRound size={15} /><small>Participant</small><strong>{participantId}</strong></div><div><Clock3 size={15} /><small>Elapsed</small><strong>{elapsed}</strong></div><div><small>Execution</small><StatusBadge status={execution.status} /></div></div></header>{execution.status === 'waiting' && <section className="waiting-banner"><Clock3 size={20} /><div><strong>Participant action required</strong><span>Reply on the requested channel with the selected target. Previous actions that do not match the workflow transition will be rejected.</span></div><StatusBadge status="waiting" /></section>}<section className="channel-workspace">{channels.map((channel) => <ChannelWorkspace key={channel} channel={channel} participantId={execution.participant_id ?? participantId} events={(session.data?.[eventLists[channel]] ?? []) as SessionChannelEvent[]} actors={actors.data ?? []} documents={documents.data ?? []} disabled={action.isPending || execution.status !== 'waiting'} onSubmit={(event) => send(channel, event)} />)}</section></main>
}

function ChannelWorkspace({ channel, ...props }: ChannelWorkspaceProps & { channel: Channel }) {
  if (channel === 'chat') return <ChatWorkspace {...props} />
  if (channel === 'email') return <EmailWorkspace {...props} />
  if (channel === 'call') return <CallWorkspace {...props} />
  return <DocumentWorkspace {...props} />
}
