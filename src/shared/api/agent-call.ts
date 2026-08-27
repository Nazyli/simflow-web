import { apiClient } from './client'

export interface AgentCallConnectionDetails {
  serverUrl: string
  roomName: string
  participantToken: string
  participantName: string
  participantIdentity: string
  actorName: string
  actorLevel: string
}

export function getAgentCallConnection(roomName: string) {
  return apiClient<AgentCallConnectionDetails>(
    `/agent-call/connection?roomName=${encodeURIComponent(roomName)}`,
  )
}
