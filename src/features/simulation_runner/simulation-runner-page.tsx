import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock3, FileText, Mail, MessageCircle, Phone, Play, RefreshCw, UserRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { getExecutionState, markExecutionMessageRead, startExecutionBatch, submitExecutionAction, type BatchExecutionRun } from '../../shared/api/executions'
import { getMasterData } from '../../shared/api/master-data'
import { getChannelHistory, getSessionsForParticipant, markSessionChannelEventsRead, type SessionChannelEvent } from '../../shared/api/sessions'
import { getPublishedVersions } from '../../shared/api/workflows'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import { MultiSelect } from '../../shared/components/multi-select'
import { StatusBadge } from '../../shared/components/status-badge'
import { formGroupClass, formLabelClass, inputClass } from '../../shared/form-classes'
import type { Execution } from '../../shared/types/workflow'
import { CallWorkspace, DocumentWorkspace, EmailWorkspace } from './channel-workspaces'
import type { Channel, ChannelWorkspaceProps } from './channel-workspaces'
import { ChatWorkspace } from './chat/chat-workspace'
import type { ChatMessage } from './chat/types'

const channelNavigation: { channel: Channel; label: string; icon: typeof MessageCircle }[] = [
  { channel: 'chat', label: 'Conversations', icon: MessageCircle },
  { channel: 'email', label: 'Email', icon: Mail },
  { channel: 'call', label: 'Call', icon: Phone },
  { channel: 'document', label: 'Document', icon: FileText },
]
interface ChannelEventIdentity {
  event_id?: string
  message_id?: string
  workflow_version_id?: string
  conversation_id?: string
  actor?: string
  timestamp?: string
  content?: string
  from?: string
  session_id?: string
  is_read?: boolean
}

export function SimulationRunnerPage() {
  const client = useQueryClient()
  const [participantId, setParticipantId] = useState('')
  const [actorId, setActorId] = useState('participant-001-ambj-01-platform')
  const [versionId, setVersionId] = useState('')
  const [versionIds, setVersionIds] = useState<string[]>([])
  const [checked, setChecked] = useState(false)
  const [execution, setExecution] = useState<Execution | null>(null)
  const [runs, setRuns] = useState<BatchExecutionRun[]>([])
  const [quotedMessage, setQuotedMessage] = useState<ChatMessage | null>(null)
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const versions = useQuery({ queryKey: ['published-versions'], queryFn: getPublishedVersions })
  const actors = useQuery({ queryKey: ['master', 'actors'], queryFn: () => getMasterData('actors') })
  const documents = useQuery({ queryKey: ['master', 'documents'], queryFn: () => getMasterData('documents') })
  const existingSessions = useQuery({ queryKey: ['participant-sessions', participantId.trim()], queryFn: () => getSessionsForParticipant(participantId.trim()), enabled: checked && Boolean(participantId.trim()) })
  const executionState = useQuery({ queryKey: ['execution-state', execution?.execution_id], queryFn: () => getExecutionState(execution!.execution_id), enabled: Boolean(execution), refetchInterval: execution?.status === 'waiting' || execution?.status === 'running' ? 2_000 : false })
  useEffect(() => {
    if (!executionState.data) return
    setExecution((current) => {
      if (!current || current.execution_id !== executionState.data.execution_id) return current
      return { ...current, status: executionState.data.status, current_node_id: executionState.data.current_node_id, context: { ...current.context, active_wait: executionState.data.active_wait ?? undefined } }
    })
    setRuns((current) => current.map((run) => run.execution_id === executionState.data.execution_id ? { ...run, status: executionState.data.status, current_node_id: executionState.data.current_node_id, context: { ...run.context, active_wait: executionState.data.active_wait ?? undefined } } : run))
  }, [executionState.data])
  const start = useMutation({ mutationFn: startExecutionBatch, onSuccess: (result) => { const runs = result.runs.map((run) => ({ ...run, participant_id: participantId.trim(), current_node_id: null, context: {} })); setRuns(runs); const selected = runs.find((run) => run.status === 'waiting' || run.status === 'running') ?? runs[0]; setExecution(selected ?? null); setVersionId(selected?.workflow_version_id ?? ''); client.invalidateQueries({ queryKey: ['participant-sessions', participantId.trim()] }); toast.success(`${result.runs.length} workflow simulation(s) ready.`) }, onError: () => toast.error('Unable to start or resume the selected simulations.') })
  const action = useMutation({ mutationFn: ({ executionId, channel, target, content, actionType, conversationId }: { executionId: string; channel: Channel; target: string; content: string; actionType: string; conversationId: string }) => submitExecutionAction(executionId, { action_type: actionType, actor_id: actorId, conversation_id: conversationId, payload: { channel, content, to: target, document_id: channel === 'document' ? target : undefined } }), onSuccess: (result) => { setExecution(result); setRuns((current) => current.map((run) => run.execution_id === result.execution_id ? { ...run, ...result } : run)); client.invalidateQueries({ queryKey: ['participant-sessions', participantId.trim()] }); toast.success('Workflow action submitted.') }, onError: () => toast.error('Action was rejected. Check the requested channel and target.') })
  const messageRead = useMutation({ mutationFn: ({ waitInstanceId, messageId }: { waitInstanceId: string; messageId: string }) => markExecutionMessageRead(execution!.execution_id, { wait_instance_id: waitInstanceId, message_id: messageId }), onSuccess: (result) => { setExecution(result); setRuns((current) => current.map((run) => run.execution_id === result.execution_id ? { ...run, ...result } : run)); client.invalidateQueries({ queryKey: ['participant-sessions', participantId.trim()] }) } })
  const channelRead = useMutation({ mutationFn: async ({ channel, events }: { channel: Channel; events: ChannelEventIdentity[] }) => {
    const bySession = new Map<string, string[]>()
    events.filter((event) => event.is_read === false && event.session_id && event.message_id).forEach((event) => bySession.set(event.session_id!, [...(bySession.get(event.session_id!) ?? []), event.message_id!]))
    return Promise.all([...bySession].map(([sessionId, messageIds]) => markSessionChannelEventsRead(sessionId, channel, messageIds)))
  }, onSuccess: () => {
    client.invalidateQueries({ queryKey: ['participant-sessions', participantId.trim()] })
  } })
  const workflow = versions.data?.find((item) => item.workflow_version_id === versionId)
  const activeWait = execution?.context.active_wait
  const channelHistory = useQuery({ queryKey: ['channel-history', execution?.session_id, activeChannel], queryFn: () => getChannelHistory(execution!.session_id!, activeChannel!).then((page) => page.items.map((item) => ({ ...item.payload, event_id: item.event_id, channel: item.channel, is_read: item.is_read, timestamp: item.occurred_at, session_id: execution!.session_id! }))), enabled: Boolean(execution?.session_id && activeChannel), refetchInterval: execution?.status === 'waiting' || execution?.status === 'running' ? 2_000 : false })
  const waitingRuns = runs.filter((run) => run.status === 'waiting' && typeof run.context.active_wait === 'object')
  const waitingForRead = waitingRuns.some((run) => (run.context.active_wait as Record<string, unknown>).waits_for_read === true)
  const deferredReadWait = activeWait && typeof activeWait === 'object' && ((((activeWait as Record<string, unknown>).timeout_starts_after_read === true && typeof (activeWait as Record<string, unknown>).timer_id !== 'string') || (activeWait as Record<string, unknown>).waits_for_read === true)) && typeof (activeWait as Record<string, unknown>).wait_instance_id === 'string' && typeof (activeWait as Record<string, unknown>).message_id === 'string'
    ? { waitInstanceId: (activeWait as Record<string, string>).wait_instance_id, messageId: (activeWait as Record<string, string>).message_id }
    : null
  const runnerParticipantId = actorId || execution?.participant_id || participantId
  function channelEvents(_channel: Channel): SessionChannelEvent[] {
    return channelHistory.data ?? []
  }
  function eventsWithUnreadStatus(channel: Channel): SessionChannelEvent[] {
    return channelEvents(channel).map((event) => ({ ...event, is_unread: event.is_read === false }))
  }
  function markEventsRead(channel: Channel, events: ChannelEventIdentity[]) {
    channelRead.mutate({ channel, events })
  }
  const unreadByChannel = Object.fromEntries(channelNavigation.map(({ channel }) => [channel, eventsWithUnreadStatus(channel).filter((event) => event.is_unread).length])) as Record<Channel, number>
  const elapsed = execution ? new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' }).format(new Date()) : '—'
  function begin(event: FormEvent) { event.preventDefault(); setChecked(true); start.mutate({ participant_id: participantId.trim(), workflow_version_ids: versionIds, context: { actor_id: actorId } }) }
  function resolveRun(channel: Channel): Execution | null {
    if (waitingRuns.length === 1) return waitingRuns[0]
    if (channel !== 'chat') return execution
    const conversationId = quotedMessage?.conversation_id
    if (!conversationId) return null
    return waitingRuns.find((item) => typeof item.context.active_wait === 'object' && (item.context.active_wait as Record<string, unknown>).conversation_id === conversationId) ?? null
  }
  function send(channel: Channel, event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const run = resolveRun(channel); const wait = run?.context.active_wait; if (!run || !wait || typeof wait !== 'object' || typeof (wait as Record<string, unknown>).conversation_id !== 'string') { toast.error(channel === 'chat' ? 'Quote the message you want to reply to first.' : 'Choose the workflow that is waiting for this action.'); return }; const actionType = channel === 'chat' || channel === 'email' ? 'message' : channel === 'call' ? 'finish_call' : 'close_document'; action.mutate({ executionId: run.execution_id, channel, target: String(data.get('target') ?? ''), content: String(data.get('content') ?? ''), actionType, conversationId: (wait as Record<string, string>).conversation_id }); setQuotedMessage(null); event.currentTarget.reset() }

  if (!execution) return (
    <main className="simulation-runner-page min-h-[calc(100vh-64px)] w-full bg-slate-50 p-5">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white shadow-sm"><Play size={15} /></span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Simulation cockpit</p>
            <h1 className="truncate text-lg font-bold text-slate-900">Run a simulation</h1>
            <p className="truncate text-xs text-slate-500">Enter the participant persona, select a workflow, then enter the participant ID to start, resume, or review a simulation.</p>
          </div>
        </div>
      </header>
      <form className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4" onSubmit={begin}>
        <div className={formGroupClass}>
          <label className={formLabelClass} htmlFor="runner-actor">Participant actor</label>
          <input id="runner-actor" className={inputClass} required value={actorId} onChange={(event) => setActorId(event.target.value)} />
        </div>
        <div className={formGroupClass}>
          <label className={formLabelClass} htmlFor="runner-participant">Participant ID</label>
          <input id="runner-participant" className={inputClass} required value={participantId} placeholder="e.g. participant-123" onChange={(event) => setParticipantId(event.target.value)} />
        </div>
        <div className={formGroupClass}>
          <label className={formLabelClass} htmlFor="runner-version">Workflow versions</label>
          <MultiSelect
            id="runner-version"
            options={(versions.data ?? []).map((item) => ({ value: item.workflow_version_id, label: `${item.workflow_name} · v${item.version_number}` }))}
            value={versionIds}
            onValueChange={setVersionIds}
            placeholder="Select one or more workflows"
          />
        </div>
        <div className={`${formGroupClass} justify-end`}>
          <button type="submit" disabled={!actorId || !participantId.trim() || !versionIds.length || start.isPending} className="!m-0 !inline-flex w-full items-center justify-center gap-1.5 rounded-lg !border-0 !bg-[#5b46c5] !px-3.5 !py-2 text-sm font-semibold !text-white shadow-sm transition hover:!bg-[#4b38ac] disabled:opacity-50">
            <Play size={15} /> {start.isPending ? 'Checking simulations…' : 'Start selected simulations'}
          </button>
        </div>
        {start.isError && <div className="sm:col-span-2 lg:col-span-4"><ErrorState message="Unable to start or resume the simulation." /></div>}
      </form>
      {existingSessions.isPending && participantId.trim() && <p className="mt-3 text-sm text-slate-500">Checking existing simulations…</p>}
      {versions.isPending && <LoadingState />}
    </main>
  )

  return (
    <main className="simulation-runner-page min-h-[calc(100vh-64px)] w-full bg-slate-50 p-5">
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

      <section className="mt-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {runs.map((run) => { const item = versions.data?.find((version) => version.workflow_version_id === run.workflow_version_id); return <span key={run.execution_id} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${execution?.execution_id === run.execution_id ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-700'}`}><span>{item?.workflow_name ?? run.workflow_version_id} · v{item?.version_number ?? '—'}</span><StatusBadge status={run.status} /></span> })}
      </section>

      {execution.status === 'waiting' && (
        <section className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600"><Clock3 size={18} /></span>
          <div className="min-w-0 flex-1">
            <strong className="text-sm text-amber-900">Participant action required</strong>
            <p className="mt-0.5 text-xs text-amber-700">{waitingRuns.length > 1 ? 'Multiple workflows are waiting. Quote the message you are replying to so the reply targets the right workflow.' : 'Reply on the requested channel with the selected target. Previous actions that do not match the workflow transition will be rejected.'}</p>
          </div>
          <StatusBadge status="waiting" />
        </section>
      )}

      {(execution.status === 'completed' || execution.status === 'failed') && (
        <section className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-600"><RefreshCw size={18} /></span>
          <div className="min-w-0 flex-1">
            <strong className="text-sm text-sky-900">Previous simulation finished</strong>
            <p className="mt-0.5 text-xs text-sky-700">This participant already completed this simulation. Review the result above or start a new run.</p>
          </div>
          <StatusBadge status={execution.status} />
        </section>
      )}

      <section className="mt-4 flex min-h-[540px] flex-col gap-4 lg:flex-row">
        <nav aria-label="Simulation channels" className="flex shrink-0 gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:w-52 lg:flex-col lg:overflow-visible">
          {channelNavigation.map(({ channel, label, icon: Icon }) => {
            const isActive = activeChannel === channel
            return (
              <button
                key={channel}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  if (channel !== 'chat') markEventsRead(channel, channelEvents(channel))
                  setActiveChannel(channel)
                }}
                className={`!m-0 inline-flex min-w-max items-center gap-2 rounded-lg !border-0 px-3 py-2.5 text-left text-sm font-semibold transition lg:w-full ${isActive ? '!bg-violet-100 !text-violet-800 shadow-sm' : '!bg-transparent !text-slate-600 hover:!bg-slate-100 hover:!text-slate-900'}`}
              >
                <Icon size={17} />
                <span>{label}</span>
                {unreadByChannel[channel] > 0 && <span aria-label={`${unreadByChannel[channel]} unread item${unreadByChannel[channel] === 1 ? '' : 's'}`} className="ml-auto grid size-5 place-items-center rounded-full bg-violet-600 text-[10px] font-bold text-white">{unreadByChannel[channel]}</span>}
              </button>
            )
          })}
        </nav>
        <div className="min-w-0 flex-1">
          {activeChannel ? (
            <ChannelWorkspace channel={activeChannel} participantId={runnerParticipantId} events={eventsWithUnreadStatus(activeChannel)} actors={actors.data ?? []} documents={documents.data ?? []} disabled={action.isPending || !waitingRuns.length || waitingForRead || (activeChannel === 'chat' && waitingRuns.length > 1 && !quotedMessage?.conversation_id)} onSubmit={(event) => send(activeChannel, event)} readMessageId={activeChannel === 'chat' ? deferredReadWait?.messageId : undefined} onMessageRead={activeChannel === 'chat' && deferredReadWait ? (messageId) => messageRead.mutate({ waitInstanceId: deferredReadWait.waitInstanceId, messageId }) : undefined} quotedMessage={activeChannel === 'chat' ? quotedMessage : undefined} quoteRequired={activeChannel === 'chat' && waitingRuns.length > 1 && !quotedMessage?.conversation_id} onQuote={activeChannel === 'chat' ? setQuotedMessage : undefined} onConversationOpen={activeChannel === 'chat' ? (messages) => markEventsRead('chat', messages) : undefined} />
          ) : (
            <div className="flex h-[540px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
              <div>
                <MessageCircle className="mx-auto mb-3 text-violet-500" size={28} />
                <h2 className="text-sm font-semibold text-slate-900">Choose a channel</h2>
                <p className="mt-1 text-xs text-slate-500">Select Conversations, Email, Call, or Document from the menu to view its activity.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function ChannelWorkspace({ channel, readMessageId, onMessageRead, quotedMessage, quoteRequired, onQuote, onConversationOpen, ...props }: ChannelWorkspaceProps & { channel: Channel; readMessageId?: string; onMessageRead?: (messageId: string) => void; quotedMessage?: ChatMessage | null; quoteRequired?: boolean; onQuote?: (message: ChatMessage | null) => void; onConversationOpen?: (messages: ChatMessage[]) => void }) {
  if (channel === 'chat') return <ChatWorkspace {...props} readMessageId={readMessageId} onMessageRead={onMessageRead} quotedMessage={quotedMessage} quoteRequired={quoteRequired} onQuote={onQuote} onConversationOpen={onConversationOpen} />
  if (channel === 'email') return <EmailWorkspace {...props} />
  if (channel === 'call') return <CallWorkspace {...props} />
  return <DocumentWorkspace {...props} />
}
