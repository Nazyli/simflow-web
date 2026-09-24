import { Navigate, Outlet, useParams } from 'react-router-dom'
import { SimulationChannelNav } from './simulation-channel-nav'
import { SimulationInfoPanel } from './simulation-info-panel'
import { SimulationRunProvider, useSimulationRun } from './simulation-run-context'
import { PageFrame } from '../../components/layout/page-frame'

function SimulationRunShell() {
  const { participantId } = useSimulationRun()

  return (
    <main className="simulation-runner-page min-w-0">
      <PageFrame
        mode="workbench"
        className="flex h-[calc(100vh-64px)] w-full min-w-0 flex-col overflow-hidden"
      >
        <SimulationInfoPanel participantId={participantId} />
        <section className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col gap-3 lg:flex-row">
          <SimulationChannelNav />
          <div className="min-h-0 min-w-0 flex-1">
            <Outlet />
          </div>
        </section>
      </PageFrame>
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
