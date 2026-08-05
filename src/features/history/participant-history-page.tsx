import { useQuery } from '@tanstack/react-query'
import { ListTree, Route, Workflow } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '../../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { getExecution, getNodeExecutions, type NodeExecution } from '../../shared/api/executions'
import { getSessions, type SimulationSessionSummary } from '../../shared/api/sessions'
import { getWorkflowVersion } from '../../shared/api/workflows'
import { LoadingState } from '../../shared/components/async-state'
import { StatusBadge } from '../../shared/components/status-badge'
import type { Execution } from '../../shared/types/workflow'
import { ParticipantFlowView } from './participant-flow-view'

interface HistoryRow {
  session: SimulationSessionSummary
  execution: Execution | null
  workflowName: string
  versionNumber: number | null
}

const formatDate = (value: string | null | undefined) => (value ? new Date(value).toLocaleString() : '—')

export function ParticipantHistoryPage() {
  const [selectedRow, setSelectedRow] = useState<HistoryRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [flowOpen, setFlowOpen] = useState(false)
  const history = useQuery({
    queryKey: ['participant-history'],
    queryFn: async (): Promise<HistoryRow[]> => {
      const sessions = await getSessions()
      return Promise.all(sessions.map(async (session): Promise<HistoryRow> => {
        if (!session.execution_id) return { session, execution: null, workflowName: 'No execution', versionNumber: null }
        const execution = await getExecution(session.execution_id)
        try {
          const version = await getWorkflowVersion(execution.workflow_version_id)
          return { session, execution, workflowName: version.workflow_name, versionNumber: version.version_number }
        } catch {
          return { session, execution, workflowName: 'Workflow unavailable', versionNumber: null }
        }
      }))
    },
  })
  const nodeExecutions = useQuery({
    queryKey: ['history-node-executions', selectedRow?.execution?.execution_id],
    queryFn: () => getNodeExecutions(selectedRow!.execution!.execution_id),
    enabled: detailOpen && Boolean(selectedRow?.execution),
  })
  const rows = useMemo(() => history.data ?? [], [history.data])

  return (
    <main className="history-page min-h-[calc(100vh-64px)] w-full bg-slate-50 p-5">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white shadow-sm"><Workflow size={18} /></span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Observability</p>
            <h1 className="truncate text-lg font-bold text-slate-900">Workflow execution history</h1>
            <p className="truncate text-xs text-slate-500">All simulation sessions and their latest workflow executions.</p>
          </div>
        </div>
      </header>

      <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {history.isPending ? <LoadingState /> : rows.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant ID</TableHead><TableHead>Session ID</TableHead><TableHead>Workflow</TableHead><TableHead>Version</TableHead><TableHead>Status</TableHead><TableHead>Started at</TableHead><TableHead>Completed at</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.session.session_id}>
                  <TableCell className="font-mono text-xs">{row.session.participant_id}</TableCell>
                  <TableCell className="max-w-44 truncate font-mono text-xs" title={row.session.session_id}>{row.session.session_id}</TableCell>
                  <TableCell className="max-w-48 truncate font-medium" title={row.workflowName}>{row.workflowName}</TableCell>
                  <TableCell>v{row.versionNumber ?? '—'}</TableCell>
                  <TableCell><StatusBadge status={row.execution?.status ?? row.session.status} /></TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-slate-600">{formatDate(row.execution?.started_at ?? row.session.created_at)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-slate-600">{formatDate(row.execution?.completed_at ?? row.session.completed_at)}</TableCell>
                  <TableCell><div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" disabled={!row.execution} onClick={() => { setSelectedRow(row); setDetailOpen(true) }}><ListTree /> Detail</Button>
                    <Button variant="outline" size="sm" disabled={!row.execution} onClick={() => { setSelectedRow(row); setFlowOpen(true) }}><Route /> Flow</Button>
                  </div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <div className="px-5 py-10 text-center text-sm text-slate-500">No simulation sessions yet.</div>}
      </section>

      <NodeExecutionDialog open={detailOpen} onClose={() => setDetailOpen(false)} row={selectedRow} nodeExecutions={nodeExecutions.data ?? []} loading={nodeExecutions.isPending} />
      <ParticipantFlowView open={flowOpen} onClose={() => setFlowOpen(false)} versionId={selectedRow?.execution?.workflow_version_id ?? ''} executionId={selectedRow?.execution?.execution_id ?? ''} title={selectedRow ? `${selectedRow.workflowName} · v${selectedRow.versionNumber ?? '—'}` : 'Participant flow'} currentState={selectedRow?.execution?.current_node_id ?? null} />
    </main>
  )
}

function NodeExecutionDialog({ open, onClose, row, nodeExecutions, loading }: { open: boolean; onClose: () => void; row: HistoryRow | null; nodeExecutions: NodeExecution[]; loading: boolean }) {
  return <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
    <DialogContent className="max-w-4xl p-6">
      <DialogTitle className="text-base font-bold text-slate-900">Workflow node execution history</DialogTitle>
      <DialogDescription>{row ? `${row.workflowName} · ${row.session.session_id}` : 'Node execution details'}</DialogDescription>
      {loading ? <LoadingState /> : <div className="max-h-[55vh] overflow-auto rounded-lg border border-slate-200">
        <Table>
          <TableHeader><TableRow><TableHead>Sequence</TableHead><TableHead>Node ID</TableHead><TableHead>Status</TableHead><TableHead>Selected port</TableHead><TableHead>Output</TableHead></TableRow></TableHeader>
          <TableBody>{nodeExecutions.map((item) => <TableRow key={item.node_execution_id}>
            <TableCell>{item.sequence_number}</TableCell><TableCell className="font-mono text-xs">{item.node_id}</TableCell><TableCell><StatusBadge status={item.status} /></TableCell><TableCell className="font-mono text-xs">{item.selected_port ?? '—'}</TableCell><TableCell className="max-w-72 truncate font-mono text-xs" title={JSON.stringify(item.output_data ?? {})}>{JSON.stringify(item.output_data ?? {})}</TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </div>}
      <div className="flex justify-end"><DialogClose asChild><Button variant="outline" size="sm">Close</Button></DialogClose></div>
    </DialogContent>
  </Dialog>
}
