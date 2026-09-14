import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ChatChannelPage } from '../../features/simulation_runner/chat-channel-page'
import { CallMeetingRoomPage } from '../../features/simulation_runner/call/meeting-room-page'
import {
  CallChannelPage,
  DocumentChannelPage,
  EmailChannelPage,
} from '../../features/simulation_runner/channel-pages'
import { SimulationEntryPage } from '../../features/simulation_runner/simulation-entry-page'
import { SimulationHomePage } from '../../features/simulation_runner/simulation-home-page'
import { SimulationRunLayout } from '../../features/simulation_runner/simulation-run-layout'
import { SimulationStudioPage } from '../../features/simulation_studio/simulation-studio-page'
import { SimulationListPage } from '../../features/simulation_studio/simulation-list-page'
import { TimerManagementPage } from '../../features/timers/timer-management-page'
import { ParticipantHistoryPage } from '../../features/history/participant-history-page'
import { ExecutionDetailPage } from '../../features/history/execution-detail-page'
import { SettingsPage } from '../../features/settings/settings-page'
import { DocumentationPage } from '../../features/documentation/documentation-page'
import { AppShell } from '../layouts/app-shell'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/studio" element={<SimulationListPage />} />
          <Route path="/studio/:simulationId" element={<SimulationStudioPage />} />
          <Route path="/simulation" element={<SimulationEntryPage />} />
          <Route path="/simulation/:participantId" element={<SimulationRunLayout />}>
            <Route index element={<SimulationHomePage />} />
            <Route path="chat" element={<ChatChannelPage />} />
            <Route path="email" element={<EmailChannelPage />} />
            <Route path="call" element={<CallChannelPage />} />
            <Route path="call/:roomId" element={<CallMeetingRoomPage />} />
            <Route path="document" element={<DocumentChannelPage />} />
          </Route>
          <Route path="/timers" element={<TimerManagementPage />} />
          <Route path="/history" element={<ParticipantHistoryPage />} />
          <Route path="/history/:id" element={<ExecutionDetailPage />} />
          <Route path="/documentation" element={<Navigate to="/documentation/00-index" replace />} />
          <Route path="/documentation/:slug" element={<DocumentationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/studio" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
