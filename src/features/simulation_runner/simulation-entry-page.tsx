import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Play } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageFrame } from '../../components/layout/page-frame'
import { PageHeader } from '../../components/layout/page-header'
import { startExecutionBatch } from '../../shared/api/executions'
import { getPublishedSimulations } from '../../shared/api/simulations'
import { ErrorState } from '../../shared/components/async-state'
import { inputClass } from '../../shared/form-classes'
import {
  DEFAULT_RUNNER_PARTICIPANT_PROFILE,
  PARTICIPANT_GENDERS,
  PARTICIPANT_LANGUAGES,
  type ParticipantGender,
  type ParticipantLanguage,
} from './runner-participant-profile'
import { readActorId, writeActorId } from './simulation-run-storage'
import { SimulationSelectionPanel } from './simulation-selection-panel'

const randomParticipantId = () => String(Math.floor(10000 + Math.random() * 90000))
const runnerInputClass = `${inputClass} !h-8 !rounded-md !px-2 !py-1 !text-xs`
const runnerFormGroupClass = 'flex flex-col gap-1'
const runnerFormLabelClass = 'text-xs leading-4 font-semibold text-slate-700'

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
      const count = result.runs.length
      toast.success(`${count} simulation${count === 1 ? '' : 's'} ready.`)
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
      <div className="mx-auto flex w-full max-w-[1280px] min-w-0 flex-col gap-3">
        <PageHeader
          title="Run simulation"
          description="Set the participant context, then choose the simulations to launch together."
        />
        <form className="min-w-0" onSubmit={begin}>
          <div className="runner-entry-grid min-w-0">
            <section
              aria-label="Participant profile"
              className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
            >
              <fieldset className="space-y-2.5">
                <legend className="sr-only">Participant details</legend>
                <div className={runnerFormGroupClass}>
                  <label className={runnerFormLabelClass} htmlFor="runner-full-name">
                    Full name
                  </label>
                  <input
                    id="runner-full-name"
                    className={runnerInputClass}
                    required
                    value={participantFullName}
                    onChange={(event) => setParticipantFullName(event.target.value)}
                  />
                </div>
                <div className={runnerFormGroupClass}>
                  <label className={runnerFormLabelClass} htmlFor="runner-gender">
                    Gender
                  </label>
                  <select
                    id="runner-gender"
                    className={runnerInputClass}
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
                <div className={runnerFormGroupClass}>
                  <label className={runnerFormLabelClass} htmlFor="runner-language">
                    Language
                  </label>
                  <select
                    id="runner-language"
                    className={runnerInputClass}
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
                <div className={runnerFormGroupClass}>
                  <label className={runnerFormLabelClass} htmlFor="runner-actor">
                    Participant actor
                  </label>
                  <input
                    id="runner-actor"
                    className={runnerInputClass}
                    required
                    value={actorId}
                    onChange={(event) => setActorId(event.target.value)}
                  />
                </div>
                <div className={runnerFormGroupClass}>
                  <label className={runnerFormLabelClass} htmlFor="runner-participant">
                    Participant ID
                  </label>
                  <input
                    id="runner-participant"
                    className={runnerInputClass}
                    required
                    value={participantId}
                    placeholder="5-digit ID"
                    onChange={(event) => setParticipantId(event.target.value)}
                  />
                </div>
              </fieldset>
            </section>

            <section
              aria-label="Choose simulations"
              className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
            >
              <SimulationSelectionPanel
                className="border-0 bg-transparent p-0 shadow-none"
                simulations={simulations.data ?? []}
                selectedIds={simulationIds}
                onSelectionChange={setSimulationIds}
                isLoading={simulations.isPending}
                hasError={simulations.isError}
              />
              <div className="mt-3 flex min-w-0 flex-col-reverse gap-2 border-t border-slate-200 pt-2 sm:flex-row sm:items-center sm:justify-between">
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
                  className="!bg-primary !text-primary-foreground hover:!bg-primary/80 focus-visible:ring-primary/40 !m-0 !inline-flex min-h-8 w-fit items-center justify-center gap-1 rounded-md !border-0 !px-2.5 !py-1 text-xs font-semibold shadow-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play aria-hidden="true" size={13} />{' '}
                  {start.isPending ? 'Starting…' : 'Run selected'}
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
