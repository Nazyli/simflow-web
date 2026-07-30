import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SimulationRunnerPage } from '../../features/simulation_runner/simulation-runner-page'
import { SimulationStudioPage } from '../../features/simulation_studio/simulation-studio-page'
import { TimerManagementPage } from '../../features/timers/timer-management-page'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/studio" element={<SimulationStudioPage />} />
        <Route path="/simulation" element={<SimulationRunnerPage />} />
        <Route path="/timers" element={<TimerManagementPage />} />
        <Route path="*" element={<Navigate to="/studio" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
