import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Copy, Layers, ListTree, RefreshCw, Route } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageFrame } from '../../components/layout/page-frame'
import { PageHeader } from '../../components/layout/page-header'
import { PageToolbar } from '../../components/layout/page-toolbar'
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
      queryClient.invalidateQueries({ queryKey: ['node-executions', id] })
      queryClient.invalidateQueries({ queryKey: ['participant-history', 'detail', id] })
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

  const data = history.data?.find((item) => item.executionId === id)
  if (!data) return <ErrorState message="Execution not found." />

  const title = `${data.groupSimulationName ?? 'Simulation unavailable'} · ${data.simulationName ?? '—'}`
  const isFinalStatus = ['completed', 'failed', 'cancelled'].includes(data.status)
  const isFlowRefreshing = history.isFetching || nodeExecutions.isFetching
  const refreshFlow = () => {
    void Promise.all([history.refetch(), nodeExecutions.refetch()])
  }

  return (
    <PageFrame
      mode="operations"
      edgeToEdge
      className="history-detail-page flex h-[calc(100dvh-58px)] min-h-0 w-full flex-col overflow-hidden"
    >
      <Tabs
        defaultValue={defaultTab}
        onValueChange={(value) => setActiveTab(value)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <PageHeader
          className="shrink-0 border-b border-slate-200 bg-white px-6 py-4 max-[900px]:px-[18px] max-[620px]:px-3 max-[620px]:py-3"
          eyebrow="Participant flow"
          title={
            <span className="flex min-w-0 items-center gap-2">
              <span className="brand-gradient grid size-8 shrink-0 place-items-center rounded-lg text-white">
                <Layers size={16} />
              </span>
              <span className="min-w-0 break-words">{title}</span>
            </span>
          }
          description={`Participant ${data.participantId} · Session ${data.sessionId}`}
          actions={
            <PageToolbar className="sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => navigate('/history')}
              >
                <ArrowLeft size={14} />
                Back
              </Button>
              <StatusBadge status={data.status} />
              {activeTab === 'flow' && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
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
                          onChange={(e) =>
                            setPollInterval(Math.max(0, parseInt(e.target.value) || 0))
                          }
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
                        onChange={(e) =>
                          setPollInterval(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="h-7 w-16 rounded-md border-slate-200 p-0 text-center font-semibold text-slate-700 outline-none hover:border-slate-300"
                      />
                      <span className="text-slate-500">detik</span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={refreshFlow}
                    disabled={isFlowRefreshing}
                    aria-label="Refresh flow"
                    className="inline-flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-slate-50 hover:text-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw
                      size={12}
                      className={isFlowRefreshing ? 'animate-spin' : undefined}
                    />
                    {isFlowRefreshing ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
              )}
            </PageToolbar>
          }
        />
        <PageToolbar className="shrink-0 justify-between border-b border-slate-200 bg-white px-6 pb-4 max-[900px]:px-[18px] max-[620px]:px-3 max-[620px]:pb-3">
          <TabsList className="h-9 bg-slate-100 p-1">
            <TabsTrigger value="flow" className="px-3 text-xs font-semibold">
              <Route size={14} />
              Flow
            </TabsTrigger>
            <TabsTrigger value="detail" className="px-3 text-xs font-semibold">
              <ListTree size={14} />
              Detail
            </TabsTrigger>
          </TabsList>
          <span className="text-[11px] font-medium text-slate-400 max-[620px]:hidden">
            {activeTab === 'flow' ? 'Live execution path' : 'Node execution log'}
          </span>
        </PageToolbar>

        <TabsContent value="flow" className="min-h-0 flex-1 overflow-hidden bg-white">
          <ParticipantFlowCanvas
            simulationId={data.simulationId}
            executionId={data.executionId}
            currentState={data.currentNodeId}
            executionStatus={data.status}
          />
        </TabsContent>

        <TabsContent value="detail" className="min-h-0 flex-1 overflow-auto bg-white">
          <NodeExecutionTable
            nodeExecutions={nodeExecutions.data ?? []}
            loading={nodeExecutions.isPending}
          />
        </TabsContent>
      </Tabs>
    </PageFrame>
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
            <TableRow key={item.nodeExecutionId} className="align-top">
              <TableCell className="font-mono text-xs text-slate-600 tabular-nums">
                {item.sequenceNumber}
              </TableCell>
              <TableCell className="max-w-56 font-mono text-xs break-all whitespace-normal text-slate-700">
                {item.nodeId}
              </TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell>
                {item.selectedPort ? (
                  <div className="flex flex-col items-start gap-1">
                    <span className="inline-flex rounded-md bg-violet-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-violet-700">
                      {item.selectedPort}
                    </span>
                    {item.selectedEdgeId && (
                      <span
                        className="max-w-44 truncate font-mono text-[10px] text-slate-400"
                        title={item.selectedEdgeId}
                      >
                        {item.selectedEdgeId}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </TableCell>
              <TableCell className="whitespace-normal">
                <JsonCell value={item.outputData} />
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
