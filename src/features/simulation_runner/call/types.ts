import type { CallConnection } from '../../../shared/api/agent-call'

export const CALL_PREJOIN_STORAGE_KEY = 'simflow-call-prejoin'
export const CALL_CONNECTION_STORAGE_KEY = 'simflow-call-connection'

export interface CallPrejoinChoices {
  audioEnabled: boolean
  videoEnabled: boolean
  audioDeviceId: string | null
  videoDeviceId: string | null
  roomId: string
}

export function defaultCallChoices(roomId: string): CallPrejoinChoices {
  return {
    audioEnabled: false,
    videoEnabled: false,
    audioDeviceId: null,
    videoDeviceId: null,
    roomId,
  }
}

export function readStoredValue<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

export function storeCallConnection(details: CallConnection, choices: CallPrejoinChoices) {
  localStorage.setItem(CALL_PREJOIN_STORAGE_KEY, JSON.stringify(choices))
  localStorage.setItem(CALL_CONNECTION_STORAGE_KEY, JSON.stringify(details))
}
