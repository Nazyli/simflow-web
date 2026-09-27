import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Play } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { startExecutionBatch } from '../../shared/api/executions'
import { getPublishedSimulations } from '../../shared/api/simulations'
import { ErrorState } from '../../shared/components/async-state'
import { formGroupClass, formLabelClass, inputClass } from '../../shared/form-classes'
import { readActorId, writeActorId } from './simulation-run-context'
import { SimulationSelectionPanel } from './simulation-selection-panel'
import {
  DEFAULT_RUNNER_PARTICIPANT_PROFILE,
  PARTICIPANT_GENDERS,
  PARTICIPANT_LANGUAGES,
  type ParticipantGender,
  type ParticipantLanguage,
} from './runner-participant-profile'
import { PageFrame } from '../../components/layout/page-frame'
import { PageHeader } from '../../components/layout/page-header'

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
      simulationIds: simulationIds,
      participantFullName: participantFullName.trim(),
      participantGender,
      participantLanguage,
      participantActorId: actorId.trim(),
      context: { actorId: actorId.trim() },
    })
  }

  return (
    <PageFrame mode="workbench" className="simulation-runner-page min-h-[calc(100vh-64px)] w-full">
      <div className="flex w-full min-w-0 flex-col gap-4">
        <PageHeader title="Run simulation" />
        <form className="grid min-w-0 gap-5 border-y border-slate-200 py-4" onSubmit={begin}>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className={`${formGroupClass} min-w-0`}>
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
            <div className={`${formGroupClass} min-w-0`}>
              <label className={formLabelClass} htmlFor="runner-gender">
                Gender
              </label>
              <select
                id="runner-gender"
                className={inputClass}
                required
                value={participantGender}
                onChange={(event) => setParticipantGender(event.target.value as ParticipantGender)}
              >
                {PARTICIPANT_GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>
            <div className={`${formGroupClass} min-w-0`}>
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
              disabled={
                !actorId.trim() ||
                !participantId.trim() ||
                !participantFullName.trim() ||
                !simulationIds.length ||
                start.isPending
              }
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
