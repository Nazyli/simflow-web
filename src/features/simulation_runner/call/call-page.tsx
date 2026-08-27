import { Video } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { getAgentCallConnection } from '../../../shared/api/agent-call'
import { useSimulationRun } from '../simulation-run-context'
import { generateRoomId, storeCallConnection, type CallPrejoinChoices } from './types'

const defaultChoices: CallPrejoinChoices = {
  audioEnabled: false,
  videoEnabled: false,
  audioDeviceId: null,
  videoDeviceId: null,
  roomId: '',
}

export function CallPrejoinPage() {
  const { participantId } = useSimulationRun()
  const navigate = useNavigate()
  const [choices, setChoices] = useState(defaultChoices)
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([])
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const previewRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    async function refreshDevices() {
      if (!navigator.mediaDevices?.enumerateDevices) return
      const devices = await navigator.mediaDevices.enumerateDevices()
      const mics = devices.filter((device) => device.kind === 'audioinput')
      const cams = devices.filter((device) => device.kind === 'videoinput')
      setMicrophones(mics)
      setCameras(cams)
      setChoices((current) => ({
        ...current,
        audioDeviceId: current.audioDeviceId ?? mics[0]?.deviceId ?? null,
        videoDeviceId: current.videoDeviceId ?? cams[0]?.deviceId ?? null,
      }))
    }
    void refreshDevices()
    navigator.mediaDevices?.addEventListener?.('devicechange', refreshDevices)
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', refreshDevices)
  }, [])

  useEffect(() => {
    async function updatePreview() {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (!choices.videoEnabled || !navigator.mediaDevices?.getUserMedia) {
        if (previewRef.current) previewRef.current.srcObject = null
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: choices.videoDeviceId ? { deviceId: { exact: choices.videoDeviceId } } : true,
          audio: false,
        })
        streamRef.current = stream
        if (previewRef.current) previewRef.current.srcObject = stream
      } catch {
        setMessage('Camera preview is unavailable. Check browser permissions and try again.')
      }
    }
    void updatePreview()
    return () => streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [choices.videoDeviceId, choices.videoEnabled])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const roomId = choices.roomId.trim() || generateRoomId()
    setIsSubmitting(true)
    setMessage(null)
    try {
      const details = await getAgentCallConnection(roomId)
      if (!details.serverUrl || !details.participantToken) {
        setMessage('Calling is not configured yet. LiveKit credentials are unavailable.')
        return
      }
      const nextChoices = { ...choices, roomId }
      storeCallConnection(details, nextChoices)
      navigate(`/simulation/${encodeURIComponent(participantId)}/call/${encodeURIComponent(roomId)}`)
    } catch {
      setMessage('Connection details could not be loaded. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl border border-border bg-card p-6 shadow-sm">
      <form className="w-full max-w-lg space-y-6" onSubmit={submit}>
        <header className="space-y-1">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Video className="size-5" />
          </div>
          <h2 className="pt-2 text-lg font-semibold text-foreground">Set up your call</h2>
          <p className="text-sm text-muted-foreground">
            Select your devices and join a room for this simulation participant.
          </p>
        </header>

        <label className="block space-y-1.5 text-sm font-medium text-foreground">
          Room name
          <Input
            value={choices.roomId}
            onChange={(event) => setChoices((current) => ({ ...current, roomId: event.target.value }))}
            placeholder="Leave empty to create a room"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
            <span>Microphone</span>
            <input
              checked={choices.audioEnabled}
              className="size-4 accent-primary"
              onChange={(event) =>
                setChoices((current) => ({ ...current, audioEnabled: event.target.checked }))
              }
              type="checkbox"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
            <span>Camera</span>
            <input
              checked={choices.videoEnabled}
              className="size-4 accent-primary"
              onChange={(event) =>
                setChoices((current) => ({ ...current, videoEnabled: event.target.checked }))
              }
              type="checkbox"
            />
          </label>
        </div>

        {choices.audioEnabled ? (
          <DeviceSelect
            devices={microphones}
            label="Microphone"
            value={choices.audioDeviceId}
            onValueChange={(audioDeviceId) => setChoices((current) => ({ ...current, audioDeviceId }))}
          />
        ) : null}
        {choices.videoEnabled ? (
          <>
            <DeviceSelect
              devices={cameras}
              label="Camera"
              value={choices.videoDeviceId}
              onValueChange={(videoDeviceId) => setChoices((current) => ({ ...current, videoDeviceId }))}
            />
            <video className="aspect-video w-full rounded-lg bg-muted object-cover" autoPlay muted playsInline ref={previewRef} />
          </>
        ) : null}

        {message ? <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Checking connection…' : 'Join call'}
        </Button>
      </form>
    </div>
  )
}

function DeviceSelect({
  devices,
  label,
  value,
  onValueChange,
}: {
  devices: MediaDeviceInfo[]
  label: string
  value: string | null
  onValueChange: (value: string) => void
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-foreground">
      {label}
      <Select onValueChange={onValueChange} value={value ?? undefined}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {devices.map((device, index) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label || `${label} ${index + 1}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}
