import { apiClient } from './client'
import { camelizeJson } from './casing'

export interface CallConnection {
  participantCallSessionId: string
  serverUrl: string
  roomName: string
  participantToken: string
  participantName: string
  participantIdentity: string
  actorId: string
  actorName: string
  actorLevel: string
  mode: string
  status: string
}

export interface CallMessage {
  participantCallId: string
  participantCallSessionId: string
  groupingCallId: string
  senderId: string
  senderType: string
  senderName: string
  source: string
  content: string
  status: string
  spokenAt: string
}

export interface CallParticipantEndResult {
  participantCallSessionId: string
  status: string
  eventId: string
  endedAt: string
  reason: string
}

export function getCallConnection(participantId: string) {
  return apiClient<CallConnection>(
    `/agent-call/connection?participantId=${encodeURIComponent(participantId)}`,
  ).then(camelizeJson)
}

export function getCallRoomConnection(roomName: string) {
  return apiClient<CallConnection>(
    `/agent-call/room-connection?roomName=${encodeURIComponent(roomName)}`,
  ).then(camelizeJson)
}

export function getCallHistory(participantCallSessionId: string, participantId: string) {
  return apiClient<CallMessage[]>(
    `/agent-call/participant-call-sessions/${encodeURIComponent(participantCallSessionId)}/history?participantId=${encodeURIComponent(participantId)}`,
  ).then(camelizeJson)
}

export function requestParticipantEnd(
  participantCallSessionId: string,
  participantId: string,
  eventId: string,
  occurredAt: string,
) {
  return apiClient<CallParticipantEndResult>(
    `/agent-call/participant-call-sessions/${encodeURIComponent(participantCallSessionId)}/participant-end`,
    {
      method: 'POST',
      body: JSON.stringify({
        participantId,
        eventId,
        occurredAt,
      }),
    },
  ).then(camelizeJson)
}
