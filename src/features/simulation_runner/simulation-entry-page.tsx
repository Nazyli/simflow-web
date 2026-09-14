import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Play } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { startExecutionBatch } from '../../shared/api/executions'
import { getPublishedSimulations } from '../../shared/api/simulations'
import { ErrorState, LoadingState } from '../../shared/components/async-state'
import { MultiSelect } from '../../shared/components/multi-select'
import { formGroupClass, formLabelClass, inputClass } from '../../shared/form-classes'
import { readActorId, writeActorId } from './simulation-run-context'

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
    <main className="simulation-runner-page min-h-[calc(100vh-64px)] w-full bg-slate-50 p-5">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white shadow-sm">
            <Play size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-purple-700 uppercase">
              Simulation cockpit
            </p>
            <h1 className="truncate text-lg font-bold text-slate-900">Run a simulation</h1>
            <p className="truncate text-xs text-slate-500">
              Enter the participant persona, select a simulation, then start to open the participant
              workspace.
            </p>
          </div>
        </div>
      </header>
      <form
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={begin}
      >
        <div className={formGroupClass}>
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
        <div className={formGroupClass}>
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
        <div className={formGroupClass}>
          <label className={formLabelClass} htmlFor="runner-simulation">
            Simulations
          </label>
          <MultiSelect
            id="runner-simulation"
            options={(simulations.data ?? []).map((item) => ({
              value: item.simulationId,
              label: `${item.groupSimulationName} · ${item.simulationName}`,
            }))}
            value={simulationIds}
            onValueChange={setSimulationIds}
            placeholder="Select one or more simulations"
          />
        </div>
        <div className={`${formGroupClass} justify-end`}>
          <button
            type="submit"
            disabled={!actorId || !participantId.trim() || !simulationIds.length || start.isPending}
            className="!m-0 !inline-flex w-full items-center justify-center gap-1.5 rounded-lg !border-0 !bg-[#5b46c5] !px-3.5 !py-2 text-sm font-semibold !text-white shadow-sm transition hover:!bg-[#4b38ac] disabled:opacity-50"
          >
            <Play size={15} />{' '}
            {start.isPending ? 'Starting simulations…' : 'Start selected simulations'}
          </button>
        </div>
        {start.isError && (
          <div className="sm:col-span-2 lg:col-span-4">
            <ErrorState message="Unable to start or resume the simulation." />
          </div>
        )}
      </form>
      {simulations.isPending && <LoadingState />}
    </main>
  )
}
