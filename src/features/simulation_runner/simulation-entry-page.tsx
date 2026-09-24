import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Play, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { startExecutionBatch } from '../../shared/api/executions'
import { getPublishedSimulations } from '../../shared/api/simulations'
import { ErrorState } from '../../shared/components/async-state'
import { formGroupClass, formLabelClass, inputClass } from '../../shared/form-classes'
import { readActorId, writeActorId } from './simulation-run-context'
import { SimulationSelectionPanel } from './simulation-selection-panel'
import { PageFrame } from '../../components/layout/page-frame'
import { PageHeader } from '../../components/layout/page-header'

const randomParticipantId = () => String(Math.floor(10000 + Math.random() * 90000))

export function SimulationEntryPage() {
  const client = useQueryClient()
  const navigate = useNavigate()
  const [participantId, setParticipantId] = useState(() => randomParticipantId())
  const [actorId, setActorId] = useState(() => readActorId())
  const [simulationIds, setSimulationIds] = useState<string[]>([])
  const simulations = useQuery({
    queryKey: ['published-simulations'],
    queryFn: getPublishedSimulations,
  })
  const start = useMutation({
    mutationFn: startExecutionBatch,
    onSuccess: (result) => {
      const normalizedParticipantId = participantId.trim()
      writeActorId(actorId.trim())
      client.invalidateQueries({ queryKey: ['participant-executions', normalizedParticipantId] })
      client.invalidateQueries({ queryKey: ['notification-activity', normalizedParticipantId] })
      navigate(`/simulation/${encodeURIComponent(normalizedParticipantId)}`)
      toast.success(`${result.runs.length} simulation simulation(s) ready.`)
    },
    onError: () => toast.error('Unable to start or resume the selected simulations.'),
  })

  function begin(event: FormEvent) {
    event.preventDefault()
    start.mutate({
      participantId: participantId.trim(),
      simulationIds: simulationIds,
      context: { actorId: actorId.trim() },
    })
  }

  return (
    <PageFrame
      mode="workbench"
      className="simulation-runner-page min-h-[calc(100vh-64px)] w-full"
    >
      <div className="mx-auto flex w-full max-w-[1480px] min-w-0 flex-col gap-4">
        <PageHeader
          title="Run a simulation"
          description="Set the participant context, choose one or more published simulations, and open the runner workspace."
          metadata={
            <span className="inline-flex items-center gap-1.5">
              <Play className="size-3.5 text-violet-700" />
              Participant launch surface
            </span>
          }
          actions={
            <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
              <UserRound className="size-3.5 text-violet-700" />
              Session setup
            </span>
          }
        />
        <form className="grid min-w-0 gap-4 rounded-lg border border-slate-200 bg-white p-4" onSubmit={begin}>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className={`${formGroupClass} min-w-0`}>
            <label className={formLabelClass} htmlFor="runner-actor">
              Participant actor
            </label>
            <input
              id="runner-actor"
              className={inputClass}
              required
              value={actorId}
              onChange={(event) => setActorId(event.target.value)}
            />
          </div>
            <div className={`${formGroupClass} min-w-0`}>
            <label className={formLabelClass} htmlFor="runner-participant">
              Participant ID
            </label>
            <input
              id="runner-participant"
              className={inputClass}
              required
              value={participantId}
              placeholder="5-digit ID"
              onChange={(event) => setParticipantId(event.target.value)}
            />
          </div>
        </div>
        <SimulationSelectionPanel
          simulations={simulations.data ?? []}
          selectedIds={simulationIds}
          onSelectionChange={setSimulationIds}
          isLoading={simulations.isPending}
          hasError={simulations.isError}
        />
        <div className="flex min-w-0 flex-col-reverse gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {simulationIds.length
              ? `${simulationIds.length} simulation${simulationIds.length === 1 ? '' : 's'} ready to run.`
              : 'Select at least one simulation to continue.'}
          </p>
          <button
            type="submit"
            disabled={!actorId || !participantId.trim() || !simulationIds.length || start.isPending}
            className="!m-0 !inline-flex w-full items-center justify-center gap-1.5 rounded-md !border-0 !bg-[#9929EA] !px-3.5 !py-2 text-sm font-semibold !text-white shadow-sm transition hover:!bg-[#7d1fc2] focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50 sm:w-auto"
          >
            <Play size={15} />{' '}
            {start.isPending ? 'Starting simulations…' : 'Start selected simulations'}
          </button>
        </div>
        {start.isError && (
          <div className="min-w-0">
            <ErrorState message="Unable to start or resume the simulation." />
          </div>
        )}
        </form>
      </div>
    </PageFrame>
  )
}
