import type { CallConnection } from '../../../shared/api/agent-call'

export type CallInvitePhase = 'invited' | 'joining' | 'waiting-for-call' | 'joined' | 'expired'

export interface CallInviteState {
  phase: CallInvitePhase
  invitationId: string | null
  eventId: string | null
  occurredAt: string | null
  connection: CallConnection | null
  errorMessage: string | null
}

export const initialCallInviteState: CallInviteState = {
  phase: 'invited',
  invitationId: null,
  eventId: null,
  occurredAt: null,
  connection: null,
  errorMessage: null,
}

export type CallInviteAction =
  | { type: 'invitation-loaded'; invitationId: string }
  | { type: 'join-requested'; eventId: string; occurredAt: string }
  | { type: 'join-succeeded' }
  | { type: 'join-failed'; expired?: boolean; message?: string }
  | { type: 'connection-resolved'; connection: CallConnection }

export function parseInviteToken(search: string): string | null {
  const token = new URLSearchParams(search).get('invite')
  return token && token.trim() ? token : null
}

export function reduceCallInviteState(
  state: CallInviteState,
  action: CallInviteAction,
): CallInviteState {
  switch (action.type) {
    case 'invitation-loaded':
      return { ...state, phase: 'invited', invitationId: action.invitationId, errorMessage: null }
    case 'join-requested':
      return {
        ...state,
        phase: 'joining',
        // Keep the first event id stable across HTTP retries.
        eventId: state.eventId ?? action.eventId,
        occurredAt: state.occurredAt ?? action.occurredAt,
        errorMessage: null,
      }
    case 'join-succeeded':
      return { ...state, phase: 'waiting-for-call', errorMessage: null }
    case 'join-failed':
      if (action.expired) {
        return { ...state, phase: 'expired', errorMessage: null }
      }
      return {
        ...state,
        phase: 'invited',
        errorMessage: action.message ?? 'Join failed. Please try again.',
      }
    case 'connection-resolved':
      return { ...state, phase: 'joined', connection: action.connection }
    default:
      return state
  }
}
