import { Navigate, Outlet, useParams } from 'react-router-dom'
import { SimulationChannelNav } from './simulation-channel-nav'
import { SimulationInfoPanel } from './simulation-info-panel'
import { SimulationRunProvider, useSimulationRun } from './simulation-run-context'

function SimulationRunShell() {
  const { participantId } = useSimulationRun()

  return (
    <main className="simulation-runner-page flex h-[calc(100vh-64px)] w-full flex-col overflow-hidden bg-slate-50 p-5">
      <SimulationInfoPanel participantId={participantId} />
      <section className="mt-4 flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <SimulationChannelNav />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </section>
    </main>
  )
}

export function SimulationRunLayout() {
  const { participantId } = useParams()
  if (!participantId?.trim()) return <Navigate to="/simulation" replace />
  return (
    <SimulationRunProvider participantId={participantId.trim()}>
      <SimulationRunShell />
    </SimulationRunProvider>
  )
}
