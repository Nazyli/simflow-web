import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Play, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageFrame } from '../../components/layout/page-frame'
import { PageHeader } from '../../components/layout/page-header'
import { startExecutionBatch } from '../../shared/api/executions'
import { getPublishedSimulations } from '../../shared/api/simulations'
import { ErrorState } from '../../shared/components/async-state'
import { formGroupClass, formLabelClass, inputClass } from '../../shared/form-classes'
import {
  DEFAULT_RUNNER_PARTICIPANT_PROFILE,
  PARTICIPANT_GENDERS,
  PARTICIPANT_LANGUAGES,
  type ParticipantGender,
  type ParticipantLanguage,
} from './runner-participant-profile'
import { readActorId, writeActorId } from './simulation-run-context'
import { SimulationSelectionPanel } from './simulation-selection-panel'

const randomParticipantId = () => String(Math.floor(10000 + Math.random() * 90000))

export function SimulationEntryPage() {
  const client = useQueryClient()
  const navigate = useNavigate()
  const [participantId, setParticipantId] = useState(() => randomParticipantId())
  const [actorId, setActorId] = useState(() => readActorId())
  const [participantFullName, setParticipantFullName] = useState(
    DEFAULT_RUNNER_PARTICIPANT_PROFILE.participantFullName,
  )
  const [participantGender, setParticipantGender] = useState<ParticipantGender>(
    DEFAULT_RUNNER_PARTICIPANT_PROFILE.participantGender,
  )
  const [participantLanguage, setParticipantLanguage] = useState<ParticipantLanguage>(
    DEFAULT_RUNNER_PARTICIPANT_PROFILE.participantLanguage,
  )
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
      simulationIds,
      participantFullName: participantFullName.trim(),
      participantGender,
      participantLanguage,
      participantActorId: actorId.trim(),
      context: { actorId: actorId.trim() },
    })
  }

  return (
    <PageFrame mode="workbench" className="simulation-runner-page min-h-[calc(100vh-64px)] w-full">
      <div className="mx-auto flex w-full max-w-[1280px] min-w-0 flex-col gap-4">
        <PageHeader
          title="Run simulation"
          description="Set the participant context, then choose the simulations to launch together."
          eyebrow="Runner"
        />
        <form className="min-w-0" onSubmit={begin}>
          <div className="grid min-w-0 items-start gap-4 md:grid-cols-2">
            <section
              aria-labelledby="runner-profile-title"
              className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-700">
                    <UserRound aria-hidden="true" size={16} strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-bold tracking-[0.12em] text-violet-700 uppercase">
                      Participant setup
                    </p>
                    <h2
                      id="runner-profile-title"
                      className="mt-1 text-base font-semibold tracking-[-0.01em] text-slate-900"
                    >
                      Participant profile
                    </h2>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[0.68rem] font-semibold text-slate-500">
                  Required
                </span>
              </div>
              <p className="mt-3 max-w-[34ch] text-xs leading-relaxed text-slate-500">
                These values are saved with the participant session and used by the simulation
                runtime.
              </p>

              <fieldset className="mt-5 space-y-3.5">
                <legend className="sr-only">Participant details</legend>
                <div className={formGroupClass}>
                  <label className={formLabelClass} htmlFor="runner-full-name">
                    Full name
                  </label>
                  <input
                    id="runner-full-name"
                    className={inputClass}
                    required
                    value={participantFullName}
                    onChange={(event) => setParticipantFullName(event.target.value)}
                  />
                </div>
                <div className={formGroupClass}>
                  <label className={formLabelClass} htmlFor="runner-gender">
                    Gender
                  </label>
                  <select
                    id="runner-gender"
                    className={inputClass}
                    required
                    value={participantGender}
                    onChange={(event) =>
                      setParticipantGender(event.target.value as ParticipantGender)
                    }
                  >
                    {PARTICIPANT_GENDERS.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={formGroupClass}>
                  <label className={formLabelClass} htmlFor="runner-language">
                    Language
                  </label>
                  <select
                    id="runner-language"
                    className={inputClass}
                    required
                    value={participantLanguage}
                    onChange={(event) =>
                      setParticipantLanguage(event.target.value as ParticipantLanguage)
                    }
                  >
                    {PARTICIPANT_LANGUAGES.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </div>
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
              </fieldset>

              <div className="mt-5 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
                The participant ID links this run to the latest session history.
              </div>
            </section>

            <section
              aria-labelledby="runner-simulations-title"
              className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
            >
              <div className="mb-3 min-w-0">
                <p className="text-[0.68rem] font-bold tracking-[0.12em] text-violet-700 uppercase">
                  Run scope
                </p>
                <h2
                  id="runner-simulations-title"
                  className="mt-1 text-base font-semibold tracking-[-0.01em] text-slate-900"
                >
                  Choose simulations
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Select one or more published simulations for this participant.
                </p>
              </div>
              <SimulationSelectionPanel
                className="border-0 bg-transparent p-0 shadow-none"
                simulations={simulations.data ?? []}
                selectedIds={simulationIds}
                onSelectionChange={setSimulationIds}
                isLoading={simulations.isPending}
                hasError={simulations.isError}
              />
              <div className="mt-4 flex min-w-0 flex-col-reverse gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  {simulationIds.length
                    ? `${simulationIds.length} simulation${simulationIds.length === 1 ? '' : 's'} ready to run.`
                    : 'Select at least one simulation to continue.'}
                </p>
                <button
                  type="submit"
                  disabled={
                    !actorId.trim() ||
                    !participantId.trim() ||
                    !participantFullName.trim() ||
                    !simulationIds.length ||
                    start.isPending
                  }
                  className="!m-0 !inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg !border-0 !bg-[#9929EA] !px-4 !py-2 text-sm font-semibold !text-white shadow-sm transition hover:!bg-[#7d1fc2] focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  <Play aria-hidden="true" size={15} />{' '}
                  {start.isPending ? 'Starting simulationsâ€¦' : 'Start selected simulations'}
                </button>
              </div>
              {start.isError && (
                <div className="mt-3 min-w-0" role="alert">
                  <ErrorState message="Unable to start or resume the simulation." />
                </div>
              )}
            </section>
          </div>
        </form>
      </div>
    </PageFrame>
  )
}
