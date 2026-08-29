import { useRoomContext } from '@livekit/components-react'
import { ConnectionState, RoomEvent, Track, type Room } from 'livekit-client'
import { useEffect, useRef } from 'react'
import type { CallPrejoinChoices } from './types'

function microphoneCaptureOptions(deviceId: string | null) {
  const base = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  }
  if (!deviceId || deviceId === 'default') return base
  return { ...base, deviceId }
}

async function applyChoicesToRoom(room: Room, prev: CallPrejoinChoices, next: CallPrejoinChoices) {
  try {
    if (prev.audioDeviceId !== next.audioDeviceId && next.audioEnabled) {
      await room.switchActiveDevice('audioinput', next.audioDeviceId ?? 'default')
    }
    if (prev.videoDeviceId !== next.videoDeviceId && next.videoEnabled) {
      await room.switchActiveDevice('videoinput', next.videoDeviceId ?? 'default')
    }
  } catch (error) {
    console.warn('Call device switch failed:', error)
  }

  try {
    const audioPublication = room.localParticipant.getTrackPublication(Track.Source.Microphone)
    if (next.audioEnabled) {
      if (!audioPublication || !audioPublication.track) {
        await room.localParticipant.setMicrophoneEnabled(
          true,
          microphoneCaptureOptions(next.audioDeviceId),
        )
      } else {
        audioPublication.track.mediaStreamTrack.enabled = true
      }
    } else if (audioPublication?.track) {
      // Fake mute: keep the audio track published and stream silence so the
      // voice agent's STT stays connected instead of seeing a mute/unpublish.
      audioPublication.track.mediaStreamTrack.enabled = false
    }
  } catch (error) {
    console.error('Call microphone error:', error)
  }

  try {
    if (next.videoEnabled) {
      await room.localParticipant.setCameraEnabled(
        true,
        next.videoDeviceId && next.videoDeviceId !== 'default'
          ? { deviceId: { exact: next.videoDeviceId } }
          : {},
      )
    } else {
      await room.localParticipant.setCameraEnabled(false)
    }
  } catch (error) {
    console.error('Call camera error:', error)
  }
}

export function CallMediaController({ choices }: { choices: CallPrejoinChoices }) {
  const room = useRoomContext()
  const previousRef = useRef(choices)
  const choicesRef = useRef(choices)

  useEffect(() => {
    choicesRef.current = choices
  }, [choices])

  useEffect(() => {
    const applyCurrent = () => {
      const current = choicesRef.current
      previousRef.current = current
      void applyChoicesToRoom(room, current, current).then(() =>
        room.startAudio().catch((error) => {
          console.warn('Audio playback needs a user gesture:', error)
        }),
      )
    }

    const handleConnected = () => applyCurrent()
    const handleReconnected = () => applyCurrent()

    room.on(RoomEvent.Connected, handleConnected)
    room.on(RoomEvent.Reconnected, handleReconnected)
    if (room.state === ConnectionState.Connected) {
      applyCurrent()
    }
    return () => {
      room.off(RoomEvent.Connected, handleConnected)
      room.off(RoomEvent.Reconnected, handleReconnected)
    }
  }, [room])

  useEffect(() => {
    const prev = previousRef.current
    if (prev === choices) return
    previousRef.current = choices
    if (room.state !== ConnectionState.Connected) return
    void applyChoicesToRoom(room, prev, choices)
  }, [choices, room])

  return null
}
