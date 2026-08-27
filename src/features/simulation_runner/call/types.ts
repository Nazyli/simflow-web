import type { AgentCallConnectionDetails } from '../../../shared/api/agent-call'

export const CALL_PREJOIN_STORAGE_KEY = 'simflow-call-prejoin'
export const CALL_CONNECTION_STORAGE_KEY = 'simflow-call-connection'

export interface CallPrejoinChoices {
  audioEnabled: boolean
  videoEnabled: boolean
  audioDeviceId: string | null
  videoDeviceId: string | null
  roomId: string
}

export function generateRoomId(): string {
  const segment = () => Math.random().toString(36).slice(2, 6)
  return `${segment()}-${segment()}`
}

export function readStoredValue<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

export function storeCallConnection(details: AgentCallConnectionDetails, choices: CallPrejoinChoices) {
  localStorage.setItem(CALL_PREJOIN_STORAGE_KEY, JSON.stringify(choices))
  localStorage.setItem(CALL_CONNECTION_STORAGE_KEY, JSON.stringify(details))
}
