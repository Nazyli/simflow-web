import { useQuery } from '@tanstack/react-query'
import { Activity, GitBranch, History, PlayCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getExecutions } from '../../shared/api/executions'
import { getWorkflowVersions, getWorkflows } from '../../shared/api/workflows'
import { EmptyState, ErrorState, LoadingState } from '../../shared/components/async-state'
import { StatusBadge } from '../../shared/components/status-badge'
import type { Workflow } from '../../shared/types/workflow'

export function WorkflowHistoryPage() {
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const workflows = useQuery({ queryKey: ['workflows'], queryFn: getWorkflows })
  const versions = useQuery({ queryKey: ['workflow-versions', workflow?.workflow_id], queryFn: () => getWorkflowVersions(workflow!.workflow_id), enabled: Boolean(workflow) })
  const [versionId, setVersionId] = useState<string | null>(null)
  const executions = useQuery({ queryKey: ['workflow-history-executions', versionId], queryFn: () => getExecutions(versionId!), enabled: Boolean(versionId) })
  useEffect(() => { setVersionId(null) }, [workflow?.workflow_id])
  return (
    <main className="workflow-history-page min-h-[calc(100vh-64px)] w-full bg-slate-50 p-5">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white shadow-sm"><GitBranch size={18} /></span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Workflow observability</p>
            <h1 className="truncate text-lg font-bold text-slate-900">Version &amp; execution history</h1>
            <p className="truncate text-xs text-slate-500">Choose a workflow first, then inspect its version lineage and execution records.</p>
          </div>
        </div>
      </header>

      <section className="mt-4 grid items-start gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Workflows</h2>
          <div className="grid gap-1.5">
            {workflows.isPending && <LoadingState />}
            {workflows.isError && <ErrorState message="Unable to load workflows." />}
            {workflows.data?.map((item) => (
              <button key={item.workflow_id} className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition ${workflow?.workflow_id === item.workflow_id ? 'border-purple-200 bg-purple-50' : 'border-transparent hover:bg-slate-50'}`} onClick={() => setWorkflow(item)}>
                <span className="truncate text-xs font-semibold text-slate-700">{item.workflow_name}</span>
                <StatusBadge status={item.status} />
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {!workflow ? (
            <EmptyState title="Select a workflow" description="Choose a workflow from the list to see its version and execution history." />
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-50 text-[#5b46c5]"><GitBranch size={18} /></span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-900">{workflow.workflow_name}</h2>
                  <p className="text-xs text-slate-500">Version lineage and execution outcomes.</p>
                </div>
              </div>

              <section className="mt-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><History size={16} className="text-[#5b46c5]" /> Version history</h3>
                {versions.isPending ? <LoadingState /> : versions.data?.length ? (
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
                    {versions.data.map((version) => (
                      <button key={version.workflow_version_id} className={`grid gap-2 rounded-xl border p-3 text-left transition ${versionId === version.workflow_version_id ? 'border-purple-300 bg-purple-50' : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50'}`} onClick={() => setVersionId(version.workflow_version_id)}>
                        <strong className="text-xs font-bold text-slate-800">Version {version.version_number}</strong>
                        <StatusBadge status={version.status} />
                        <small className="truncate font-mono text-[10px] text-slate-400">{version.workflow_version_id}</small>
                      </button>
                    ))}
                  </div>
                ) : <EmptyState title="No versions yet" description="Create a workflow version in Studio to begin tracking changes." />}
              </section>

              {versionId && (
                <section className="mt-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><Activity size={16} className="text-[#5b46c5]" /> Execution history</h3>
                  {executions.isPending ? <LoadingState /> : executions.data?.length ? (
                    <div className="grid gap-2">
                      {executions.data.map((execution) => (
                        <article key={execution.execution_id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><PlayCircle size={16} /></span>
                          <div className="min-w-0 flex-1">
                            <strong className="block truncate text-xs font-bold text-slate-800">{execution.participant_id ?? 'No participant'}</strong>
                            <small className="block truncate font-mono text-[10px] text-slate-400">{execution.execution_id}</small>
                          </div>
                          <span className="text-xs text-slate-500">Current node: {execution.current_node_id ?? 'Completed'}</span>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={execution.status} />
                            {execution.participant_id && execution.session_id && <button className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-none transition hover:bg-slate-50" onClick={() => navigate(`/history?participant=${encodeURIComponent(execution.participant_id!)}&session=${encodeURIComponent(execution.session_id!)}`)}>Detail</button>}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : <EmptyState title="No executions yet" description="Run this version from Runner to populate its execution history." />}
                </section>
              )}
            </>
          )}
        </section>
      </section>
    </main>
  )
}
