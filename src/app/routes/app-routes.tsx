import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SimulationRunnerPage } from '../../features/simulation_runner/simulation-runner-page'
import { SimulationStudioPage } from '../../features/simulation_studio/simulation-studio-page'
import { TimerManagementPage } from '../../features/timers/timer-management-page'
import { ParticipantHistoryPage } from '../../features/history/participant-history-page'
import { MasterDataPage } from '../../features/master_data/master-data-page'
import { SettingsPage } from '../../features/settings/settings-page'
import { AppShell } from '../layouts/app-shell'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AppShell>
      <Routes>
        <Route path="/studio" element={<SimulationStudioPage />} />
        <Route path="/simulation" element={<SimulationRunnerPage />} />
        <Route path="/timers" element={<TimerManagementPage />} />
        <Route path="/history" element={<ParticipantHistoryPage />} />
        <Route path="/master-data" element={<MasterDataPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/studio" replace />} />
      </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
