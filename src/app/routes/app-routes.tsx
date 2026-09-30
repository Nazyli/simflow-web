import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AppShell } from '../layouts/app-shell'

const ChatChannelPage = lazy(() =>
  import('../../features/simulation_runner/chat-channel-page').then((module) => ({
    default: module.ChatChannelPage,
  })),
)
const CallMeetingRoomPage = lazy(() =>
  import('../../features/simulation_runner/call/meeting-room-page').then((module) => ({
    default: module.CallMeetingRoomPage,
  })),
)
const { CallChannelPage, DocumentChannelPage, EmailChannelPage } = {
  CallChannelPage: lazy(() =>
    import('../../features/simulation_runner/channel-pages').then((module) => ({
      default: module.CallChannelPage,
    })),
  ),
  DocumentChannelPage: lazy(() =>
    import('../../features/simulation_runner/channel-pages').then((module) => ({
      default: module.DocumentChannelPage,
    })),
  ),
  EmailChannelPage: lazy(() =>
    import('../../features/simulation_runner/channel-pages').then((module) => ({
      default: module.EmailChannelPage,
    })),
  ),
}
const SimulationEntryPage = lazy(() =>
  import('../../features/simulation_runner/simulation-entry-page').then((module) => ({
    default: module.SimulationEntryPage,
  })),
)
const SimulationHomePage = lazy(() =>
  import('../../features/simulation_runner/simulation-home-page').then((module) => ({
    default: module.SimulationHomePage,
  })),
)
const SimulationRunLayout = lazy(() =>
  import('../../features/simulation_runner/simulation-run-layout').then((module) => ({
    default: module.SimulationRunLayout,
  })),
)
const SimulationStudioPage = lazy(() =>
  import('../../features/simulation_studio/simulation-studio-page').then((module) => ({
    default: module.SimulationStudioPage,
  })),
)
const SimulationListPage = lazy(() =>
  import('../../features/simulation_studio/simulation-list-page').then((module) => ({
    default: module.SimulationListPage,
  })),
)
const TimerManagementPage = lazy(() =>
  import('../../features/timers/timer-management-page').then((module) => ({
    default: module.TimerManagementPage,
  })),
)
const AiTokenUsagePage = lazy(() =>
  import('../../features/ai_token_usage/ai-token-usage-page').then((module) => ({
    default: module.AiTokenUsagePage,
  })),
)
const ParticipantAiUsagePage = lazy(() =>
  import('../../features/ai_token_usage/participant-ai-usage-page').then((module) => ({
    default: module.ParticipantAiUsagePage,
  })),
)
const ParticipantHistoryPage = lazy(() =>
  import('../../features/history/participant-history-page').then((module) => ({
    default: module.ParticipantHistoryPage,
  })),
)
const ExecutionDetailPage = lazy(() =>
  import('../../features/history/execution-detail-page').then((module) => ({
    default: module.ExecutionDetailPage,
  })),
)
const SettingsPage = lazy(() =>
  import('../../features/settings/settings-page').then((module) => ({
    default: module.SettingsPage,
  })),
)
const DocumentationPage = lazy(() =>
  import('../../features/documentation/documentation-page').then((module) => ({
    default: module.DocumentationPage,
  })),
)
const MasterActorsPage = lazy(() =>
  import('../../features/master_data/master-actors-page').then((module) => ({
    default: module.MasterActorsPage,
  })),
)

function RouteFallback() {
  return (
    <div
      className="grid min-h-[calc(100vh-48px)] place-items-center text-sm text-slate-500"
      role="status"
    >
      Loading…
    </div>
  )
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={<RouteFallback />}>
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
            <Route path="/ai-token-usage" element={<AiTokenUsagePage />} />
            <Route path="/ai-token-usage/:participantId" element={<ParticipantAiUsagePage />} />
            <Route path="/master-data/actors" element={<MasterActorsPage />} />
            <Route path="/history" element={<ParticipantHistoryPage />} />
            <Route path="/history/:id" element={<ExecutionDetailPage />} />
            <Route
              path="/documentation"
              element={<Navigate to="/documentation/00-index" replace />}
            />
            <Route path="/documentation/:slug" element={<DocumentationPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/studio" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  )
}
