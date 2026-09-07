import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Copy, Layers, ListTree, Route } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Input } from '../../components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { getNodeExecutions, type NodeExecution } from '../../shared/api/executions'
import { getExecutionHistory } from '../../shared/api/sessions'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import { StatusBadge } from '../../shared/components/status-badge'
import { ParticipantFlowCanvas } from './participant-flow-view'

export function ExecutionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'flow' ? 'flow' : 'detail'

  // Polling state - MUST be before useQuery calls
  const [pollInterval, setPollInterval] = useState(60)
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [timeLeft, setTimeLeft] = useState(pollInterval)

  const queryClient = useQueryClient()

  const history = useQuery({
    queryKey: ['participant-history', 'detail', id],
    queryFn: getExecutionHistory,
    enabled: Boolean(id),
  })

  const nodeExecutions = useQuery({
    queryKey: ['history-node-executions', id],
    queryFn: () => getNodeExecutions(id!),
    enabled: Boolean(id),
  })

  // Auto-refresh node executions with countdown timer
  useEffect(() => {
    if (activeTab !== 'flow' || pollInterval <= 0) {
      setTimeLeft(pollInterval)
      return
    }

    setTimeLeft(pollInterval)

    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['history-node-executions', id] })
    }, pollInterval * 1000)

    const countdownId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Reset after invalidation
          return pollInterval
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(intervalId)
      clearInterval(countdownId)
    }
  }, [activeTab, pollInterval, id, queryClient])

  if (!id) return <ErrorState message="No execution ID provided." />

  if (history.isPending) return <LoadingState />
  if (history.isError) return <ErrorState message="Unable to load execution details." />

  const data = history.data?.find((item) => item.execution_id === id)
  if (!data) return <ErrorState message="Execution not found." />

  const title = `${data.group_simulation_name ?? 'Simulation unavailable'} · ${data.simulation_name ?? '—'}`
  const isFinalStatus = ['completed', 'failed', 'cancelled'].includes(data.status)

  return (
    <main className="min-h-[calc(100vh-64px)] w-full bg-slate-50 p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/history')}>
            <ArrowLeft size={14} />
            Back
          </Button>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white shadow-sm">
            <Layers size={18} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900">{title}</h1>
            <p className="truncate text-xs text-slate-500">
              {data.participant_id} · {data.session_id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={data.status} />
          {activeTab === 'flow' && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs">
              <span className="text-slate-500">Auto-refresh:</span>
              {pollInterval > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-8 w-8 items-center justify-center">
                      <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
                        <circle
                          className="text-slate-200"
                          strokeWidth="3"
                          stroke="currentColor"
                          fill="transparent"
                          r="16"
                          cx="18"
                          cy="18"
                        />
                        <circle
                          className="text-violet-600 transition-all duration-1000"
                          strokeWidth="3"
                          strokeDasharray={`${(timeLeft / pollInterval) * 100}, 100`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="16"
                          cx="18"
                          cy="18"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-bold text-slate-700">
                        {timeLeft}s
                      </span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={3600}
                      value={pollInterval}
                      onChange={(e) => setPollInterval(Math.max(0, parseInt(e.target.value) || 0))}
                      className="h-7 w-16 rounded-md border-slate-200 p-0 text-center font-semibold text-slate-700 outline-none hover:border-slate-300"
                    />
                    <span className="text-slate-500">detik</span>
                  </div>
                  {isFinalStatus && (
                    <span className="ml-1 text-[10px] text-amber-600">● Final status</span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-slate-400">Disabled</span>
                  <Input
                    type="number"
                    min={1}
                    max={3600}
                    value={pollInterval}
                    onChange={(e) => setPollInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-7 w-16 rounded-md border-slate-200 p-0 text-center font-semibold text-slate-700 outline-none hover:border-slate-300"
                  />
                  <span className="text-slate-500">detik</span>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <Tabs
        defaultValue={defaultTab}
        onValueChange={(value) => setActiveTab(value)}
        className="flex h-[calc(100vh-180px)] flex-col"
      >
        <TabsList className="shrink-0">
          <TabsTrigger value="flow">
            <Route size={14} />
            Flow
          </TabsTrigger>
          <TabsTrigger value="detail">
            <ListTree size={14} />
            Detail
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="flow"
          className="mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <ParticipantFlowCanvas
            simulationId={data.simulation_id}
            executionId={data.execution_id}
            currentState={data.current_node_id}
          />
        </TabsContent>

        <TabsContent
          value="detail"
          className="mt-3 min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <NodeExecutionTable
            nodeExecutions={nodeExecutions.data ?? []}
            loading={nodeExecutions.isPending}
          />
        </TabsContent>
      </Tabs>
    </main>
  )
}

function NodeExecutionTable({
  nodeExecutions,
  loading,
}: {
  nodeExecutions: NodeExecution[]
  loading: boolean
}) {
  if (loading) return <LoadingState />
  if (!nodeExecutions.length) {
    return (
      <div className="px-5 py-10 text-center text-sm text-slate-500">
        No node executions recorded.
      </div>
    )
  }
  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-1 [&_th]:bg-slate-50 [&_th]:text-[0.66rem] [&_th]:font-bold [&_th]:tracking-[0.06em] [&_th]:uppercase">
          <TableRow>
            <TableHead>Sequence</TableHead>
            <TableHead>Node ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Selected</TableHead>
            <TableHead>Output</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodeExecutions.map((item) => (
            <TableRow key={item.node_execution_id} className="align-top">
              <TableCell className="font-mono text-xs text-slate-600 tabular-nums">
                {item.sequence_number}
              </TableCell>
              <TableCell className="max-w-56 font-mono text-xs break-all whitespace-normal text-slate-700">
                {item.node_id}
              </TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell>
                {item.selected_port ? (
                  <div className="flex flex-col items-start gap-1">
                    <span className="inline-flex rounded-md bg-violet-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-violet-700">
                      {item.selected_port}
                    </span>
                    {item.selected_edge_id && (
                      <span
                        className="max-w-44 truncate font-mono text-[10px] text-slate-400"
                        title={item.selected_edge_id}
                      >
                        {item.selected_edge_id}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </TableCell>
              <TableCell className="whitespace-normal">
                <JsonCell value={item.output_data} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function JsonCell({ value }: { value: Record<string, unknown> | null }) {
  const text = JSON.stringify(value ?? {}, null, 2)
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <div className="relative min-w-[260px]">
      <button
        onClick={copy}
        className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-md bg-slate-700/80 text-slate-200 transition hover:bg-slate-600"
        title="Copy output"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
      <pre className="max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 pr-9 font-mono text-[11px] leading-relaxed text-slate-100">
        {text}
      </pre>
    </div>
  )
}
