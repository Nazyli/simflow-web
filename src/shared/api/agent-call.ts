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

export interface AgentCallHistoryItem {
  participantCallId: string
  to: string
  fromActorName: string
  content: string
  createdDate: string
}

export function getAgentCallConnection(roomName: string) {
  return apiClient<AgentCallConnectionDetails>(
    `/agent-call/connection?roomName=${encodeURIComponent(roomName)}`,
  )
}

export function getAgentCallHistory(roomId: string) {
  return apiClient<AgentCallHistoryItem[]>(`/agent-call/history/${encodeURIComponent(roomId)}`)
}
