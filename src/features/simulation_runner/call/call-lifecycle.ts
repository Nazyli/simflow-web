import type { CallConnection } from '../../../shared/api/agent-call'

export type CallStatusCategory = 'active' | 'reconnecting' | 'terminal' | 'absent'

export function classifyCallStatus(status: string | undefined | null): CallStatusCategory {
  switch (status) {
    case 'active':
    case 'starting':
    case 'pending':
    case 'end_requested':
      return 'active'
    case 'reconnecting':
      return 'reconnecting'
    case 'ended':
    case 'failed':
    case 'disconnected':
      return 'terminal'
    default:
      return 'absent'
  }
}

export interface ParticipantEndRequest {
  participant_id: string
  event_id: string
  occurred_at: string
}

export function makeParticipantEndRequest(
  _callSessionId: string,
  participantId: string,
  eventId: string,
  occurredAt: string,
): ParticipantEndRequest {
  return {
    participant_id: participantId,
    event_id: eventId,
    occurred_at: occurredAt,
  }
}

export type CallRunnerPhase =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'awaiting-reconnect'
  | 'replaced'
  | 'ended'
  | 'unavailable'

export interface CallRunnerState {
  phase: CallRunnerPhase
  callSessionId: string | null
  connection: CallConnection | null
  reconnectToken: string | null
  eventId: string | null
  occurredAt: string | null
  pendingEnd: boolean
  cleared: boolean
  navigateTo: string | null
}

export const initialCallRunnerState: CallRunnerState = {
  phase: 'connecting',
  callSessionId: null,
  connection: null,
  reconnectToken: null,
  eventId: null,
  occurredAt: null,
  pendingEnd: false,
  cleared: false,
  navigateTo: null,
}

export type CallRunnerAction =
  | { type: 'connection-resolved'; connection: CallConnection }
  | { type: 'connection-absent' }
  | { type: 'reconnecting' }
  | { type: 'disconnected'; recheck: CallConnection | null }
  | { type: 'disconnected-replaced' }
  | { type: 'reconnect-accepted'; token: string }
  | { type: 'participant-end-requested'; eventId: string; occurredAt: string }
  | { type: 'participant-end-succeeded' }
  | { type: 'participant-end-failed' }

export function reduceCallRunnerState(
  state: CallRunnerState,
  action: CallRunnerAction,
): CallRunnerState {
  switch (action.type) {
    case 'connection-resolved': {
      const category = classifyCallStatus(action.connection.status)
      if (category === 'terminal') {
        return { ...state, connection: action.connection, phase: 'ended', navigateTo: 'simulation' }
      }
      if (category === 'absent') {
        return { ...state, phase: 'unavailable', navigateTo: 'simulation' }
      }
      return {
        ...state,
        connection: action.connection,
        callSessionId: action.connection.callSessionId,
        phase: 'connected',
      }
    }
    case 'connection-absent':
      return { ...state, phase: 'unavailable', navigateTo: 'simulation' }
    case 'reconnecting':
      return { ...state, phase: 'reconnecting' }
    case 'disconnected': {
      const category = classifyCallStatus(action.recheck?.status)
      if (category === 'terminal' || category === 'absent') {
        return { ...state, phase: 'ended', navigateTo: 'simulation' }
      }
      return {
        ...state,
        phase: 'awaiting-reconnect',
        reconnectToken: action.recheck?.participantToken ?? null,
      }
    }
    case 'disconnected-replaced':
      return { ...state, phase: 'replaced' }
    case 'reconnect-accepted':
      return {
        ...state,
        phase: 'connected',
        reconnectToken: action.token,
        connection: state.connection
          ? { ...state.connection, participantToken: action.token }
          : state.connection,
      }
    case 'participant-end-requested':
      return { ...state, eventId: action.eventId, occurredAt: action.occurredAt, pendingEnd: true }
    case 'participant-end-succeeded':
      return {
        ...state,
        pendingEnd: false,
        cleared: true,
        phase: 'ended',
        navigateTo: 'simulation',
      }
    case 'participant-end-failed':
      return { ...state, pendingEnd: true }
    default:
      return state
  }
}
