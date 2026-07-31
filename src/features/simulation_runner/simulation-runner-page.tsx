import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock3, Play, UserRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { getExecution, getExecutions, startExecution, submitExecutionAction } from '../../shared/api/executions'
import { getMasterData } from '../../shared/api/master-data'
import { getSession, getSessionsForParticipant, type SessionChannelEvent } from '../../shared/api/sessions'
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
  const [actorId, setActorId] = useState('participant-001-ambj-01-platform')
  const [versionId, setVersionId] = useState('')
  const [execution, setExecution] = useState<Execution | null>(null)
  const versions = useQuery({ queryKey: ['published-versions'], queryFn: getPublishedVersions })
  const actors = useQuery({ queryKey: ['master', 'actors'], queryFn: () => getMasterData('actors') })
  const documents = useQuery({ queryKey: ['master', 'documents'], queryFn: () => getMasterData('documents') })
  const existingSessions = useQuery({ queryKey: ['participant-sessions', participantId.trim()], queryFn: () => getSessionsForParticipant(participantId.trim()), enabled: Boolean(participantId.trim()) })
  const latestSession = existingSessions.data?.[0]
  const latestSessionExecutions = useQuery({ queryKey: ['participant-session-executions', latestSession?.session_id, latestSession?.workflow_version_id], queryFn: () => getExecutions(latestSession!.workflow_version_id), enabled: Boolean(latestSession) })
  const existingExecution = latestSessionExecutions.data?.find((item) => item.session_id === latestSession?.session_id)
  const executionState = useQuery({ queryKey: ['execution', execution?.execution_id], queryFn: () => getExecution(execution!.execution_id), enabled: Boolean(execution), refetchInterval: execution?.status === 'waiting' || execution?.status === 'running' ? 2_000 : false })
  const session = useQuery({ queryKey: ['session', execution?.session_id], queryFn: () => getSession(execution!.session_id!), enabled: Boolean(execution?.session_id), refetchInterval: execution?.status === 'waiting' || execution?.status === 'running' ? 2_000 : false })
  useEffect(() => { if (executionState.data) setExecution(executionState.data) }, [executionState.data])
  useEffect(() => {
    if (existingExecution) {
      setExecution(existingExecution)
      setVersionId(existingExecution.workflow_version_id)
    }
  }, [existingExecution])
  const start = useMutation({ mutationFn: startExecution, onSuccess: (result) => { setExecution(result); setVersionId(result.workflow_version_id); client.invalidateQueries({ queryKey: ['session', result.session_id] }); toast.success(result.status === 'waiting' ? 'Active simulation resumed.' : 'Simulation started.') }, onError: () => toast.error('Unable to start or resume the simulation.') })
  const action = useMutation({ mutationFn: ({ channel, target, content, actionType, waitInstanceId, conversationId }: { channel: Channel; target: string; content: string; actionType: string; waitInstanceId: string; conversationId: string }) => submitExecutionAction(execution!.execution_id, { action_type: actionType, actor_id: actorId, wait_instance_id: waitInstanceId, conversation_id: conversationId, payload: { channel, content, to: target, document_id: channel === 'document' ? target : undefined } }), onSuccess: (result) => { setExecution(result); client.invalidateQueries({ queryKey: ['session', result.session_id] }); toast.success('Workflow action submitted.') }, onError: () => toast.error('Action was rejected. Check the requested channel and target.') })
  const workflow = versions.data?.find((item) => item.workflow_version_id === versionId)
  const elapsed = execution ? new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' }).format(new Date()) : '—'
  function begin(event: FormEvent) { event.preventDefault(); start.mutate({ workflow_version_id: versionId, participant_id: participantId.trim(), context: { actor_id: actorId } }) }
  function send(channel: Channel, event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const wait = execution?.context.active_wait; if (!wait || typeof wait !== 'object' || typeof (wait as Record<string, unknown>).wait_instance_id !== 'string' || typeof (wait as Record<string, unknown>).conversation_id !== 'string') { toast.error('No active Wait for Reply is available.'); return }; const actionType = channel === 'chat' || channel === 'email' ? 'message' : channel === 'call' ? 'finish_call' : 'close_document'; action.mutate({ channel, target: String(data.get('target') ?? ''), content: String(data.get('content') ?? ''), actionType, waitInstanceId: (wait as Record<string, string>).wait_instance_id, conversationId: (wait as Record<string, string>).conversation_id }); event.currentTarget.reset() }

  if (!execution) return (
    <main className="mx-auto max-w-[1500px] p-0">
      <header className="mb-6 items-start justify-start">
        <span className="text-xs font-bold uppercase tracking-wider text-purple-700 px-2 py-0.5 rounded bg-purple-50 border border-purple-200">Simulation cockpit</span>
        <p className="mt-1 text-sm text-slate-500">Enter the participant persona, select a workflow, then enter the participant ID to start or resume a simulation.</p>
      </header>
      <form className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4" onSubmit={begin}>
        <div className="form-group">
          <label className="form-label" htmlFor="runner-actor">Participant actor</label>
          <input id="runner-actor" className="form-input !m-0 !w-full !py-2 text-sm" required value={actorId} onChange={(event) => setActorId(event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="runner-participant">Participant ID</label>
          <input id="runner-participant" className="form-input !m-0 !w-full !py-2 text-sm" required value={participantId} placeholder="e.g. participant-123" onChange={(event) => setParticipantId(event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="runner-version">Workflow version</label>
          <select id="runner-version" className="form-select !m-0 !w-full !py-2 text-sm" required value={versionId} onChange={(event) => setVersionId(event.target.value)}>
            <option value="">Select workflow</option>
            {versions.data?.map((item) => <option key={item.workflow_version_id} value={item.workflow_version_id}>{item.workflow_name} · v{item.version_number}</option>)}
          </select>
        </div>
        <div className="form-group justify-end">
          <button type="submit" disabled={!actorId || !participantId.trim() || !versionId || start.isPending} className="!m-0 !inline-flex w-full items-center justify-center gap-1.5 rounded-lg !border-0 !bg-[#5b46c5] !px-3.5 !py-2 text-sm font-semibold !text-white shadow-sm transition hover:!bg-[#4b38ac] disabled:opacity-50">
            <Play size={15} /> {start.isPending ? 'Checking simulation…' : 'Start or resume simulation'}
          </button>
        </div>
        {start.isError && <div className="sm:col-span-2 lg:col-span-4"><ErrorState message="Unable to start or resume the simulation." /></div>}
      </form>
      {existingSessions.isPending && participantId.trim() && <p className="mt-3 text-sm text-slate-500">Checking existing simulations…</p>}
      {versions.isPending && <LoadingState />}
    </main>
  )

  return (
    <main className="mx-auto max-w-[1500px] p-0">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white shadow-sm">
            <Play size={18} />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Simulation cockpit</span>
            <h1 className="truncate text-lg font-bold text-slate-900">{workflow?.workflow_name ?? 'Active simulation'}</h1>
            <p className="truncate text-xs text-slate-500">Version {workflow?.version_number ?? '—'} · Session {execution.session_id}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <UserRound size={14} className="shrink-0 text-[#5b46c5]" />
            <div className="min-w-0">
              <small className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Participant</small>
              <strong className="block max-w-[160px] truncate text-xs text-slate-800">{participantId}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Clock3 size={14} className="shrink-0 text-[#5b46c5]" />
            <div>
              <small className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Elapsed</small>
              <strong className="block text-xs text-slate-800">{elapsed}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <small className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Execution</small>
            <StatusBadge status={execution.status} />
          </div>
        </div>
      </header>

      {execution.status === 'waiting' && (
        <section className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600"><Clock3 size={18} /></span>
          <div className="min-w-0 flex-1">
            <strong className="text-sm text-amber-900">Participant action required</strong>
            <p className="mt-0.5 text-xs text-amber-700">Reply on the requested channel with the selected target. Previous actions that do not match the workflow transition will be rejected.</p>
          </div>
          <StatusBadge status="waiting" />
        </section>
      )}

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {channels.map((channel) => <ChannelWorkspace key={channel} channel={channel} participantId={execution.participant_id ?? participantId} events={(session.data?.[eventLists[channel]] ?? []) as SessionChannelEvent[]} actors={actors.data ?? []} documents={documents.data ?? []} disabled={action.isPending || execution.status !== 'waiting'} onSubmit={(event) => send(channel, event)} />)}
      </section>
    </main>
  )
}

function ChannelWorkspace({ channel, ...props }: ChannelWorkspaceProps & { channel: Channel }) {
  if (channel === 'chat') return <ChatWorkspace {...props} />
  if (channel === 'email') return <EmailWorkspace {...props} />
  if (channel === 'call') return <CallWorkspace {...props} />
  return <DocumentWorkspace {...props} />
}
