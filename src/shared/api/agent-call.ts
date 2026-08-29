import { apiClient } from './client'

export interface CallConnection {
  callSessionId: string
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
  callMessageId: string
  callSessionId: string
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
  callSessionId: string
  status: string
  eventId: string
  endedAt: string
  reason: string
}

export function getCallConnection(participantId: string) {
  return apiClient<CallConnection>(
    `/agent-call/connection?participant_id=${encodeURIComponent(participantId)}`,
  )
}

export function getCallRoomConnection(roomName: string) {
  return apiClient<CallConnection>(
    `/agent-call/room-connection?room_name=${encodeURIComponent(roomName)}`,
  )
}

export function getCallHistory(callSessionId: string, participantId: string) {
  return apiClient<CallMessage[]>(
    `/agent-call/sessions/${encodeURIComponent(callSessionId)}/history?participant_id=${encodeURIComponent(participantId)}`,
  )
}

export function requestParticipantEnd(
  callSessionId: string,
  participantId: string,
  eventId: string,
  occurredAt: string,
) {
  return apiClient<CallParticipantEndResult>(
    `/agent-call/sessions/${encodeURIComponent(callSessionId)}/participant-end`,
    {
      method: 'POST',
      body: JSON.stringify({
        participant_id: participantId,
        event_id: eventId,
        occurred_at: occurredAt,
      }),
    },
  )
}
