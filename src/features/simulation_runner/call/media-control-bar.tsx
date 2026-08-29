import { Camera, CameraOff, Check, ChevronDown, Mic, MicOff } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { CallPrejoinChoices } from './types'

function useMediaDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])

  useEffect(() => {
    let active = true

    const refresh = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return
      try {
        const list = await navigator.mediaDevices.enumerateDevices()
        if (active) {
          setDevices(list.filter((device) => device.kind && device.deviceId))
        }
      } catch {
        if (active) setDevices([])
      }
    }

    void refresh()
    navigator.mediaDevices?.addEventListener('devicechange', refresh)
    return () => {
      active = false
      navigator.mediaDevices?.removeEventListener('devicechange', refresh)
    }
  }, [])

  return devices
}

function DeviceMenu({
  activeId,
  items,
  onClose,
  onSelect,
  open,
}: {
  activeId: string | null
  items: MediaDeviceInfo[]
  onClose: () => void
  onSelect: (deviceId: string) => void
  open: boolean
}) {
  if (!open) return null

  const byId = new Map<string, { deviceId: string; label: string }>()
  for (const device of items) {
    if (!device.deviceId || byId.has(device.deviceId)) continue
    byId.set(device.deviceId, {
      deviceId: device.deviceId,
      label: device.label.trim() || 'Unnamed device',
    })
  }
  const entries = Array.from(byId.values())
  const fullItems = byId.has('default')
    ? entries
    : [{ deviceId: 'default', label: 'System default' }, ...entries]

  return (
    <>
      <button
        aria-label="Close device menu"
        className="fixed inset-0 z-40 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div className="border-border bg-card absolute bottom-full left-1/2 z-50 mb-2 max-h-48 w-52 -translate-x-1/2 overflow-y-auto rounded-lg border shadow-lg">
        {fullItems.length === 0 ? (
          <p className="text-muted-foreground px-3 py-2 text-xs">No devices found</p>
        ) : (
          fullItems.map((device) => {
            const isActive =
              device.deviceId === activeId || (!activeId && device.deviceId === 'default')
            return (
              <button
                className={`hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                  isActive ? 'text-primary font-medium' : 'text-foreground'
                }`}
                key={device.deviceId}
                onClick={() => {
                  onSelect(device.deviceId)
                  onClose()
                }}
                title={device.label}
                type="button"
              >
                <span className="w-4 text-center">
                  {isActive ? <Check className="size-3.5" /> : null}
                </span>
                <span className="truncate">{device.label}</span>
              </button>
            )
          })
        )}
      </div>
    </>
  )
}

export function MediaControlBar({
  choices,
  onChoicesChange,
}: {
  choices: CallPrejoinChoices
  onChoicesChange: (choices: Partial<CallPrejoinChoices>) => void
}) {
  const devices = useMediaDevices()
  const [micMenuOpen, setMicMenuOpen] = useState(false)
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false)

  const microphones = useMemo(
    () => devices.filter((device) => device.kind === 'audioinput'),
    [devices],
  )
  const cameras = useMemo(() => devices.filter((device) => device.kind === 'videoinput'), [devices])

  return (
    <div className="relative flex items-center gap-3 rounded-full bg-black/50 px-3 py-2 text-white shadow-lg backdrop-blur-sm">
      <div className="relative flex items-center gap-1">
        <button
          aria-label={choices.audioEnabled ? 'Mute microphone' : 'Enable microphone'}
          className={`rounded-full p-2.5 transition-all ${
            choices.audioEnabled ? 'bg-white/15 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'
          }`}
          onClick={() => onChoicesChange({ audioEnabled: !choices.audioEnabled })}
          title={choices.audioEnabled ? 'Turn off microphone' : 'Turn on microphone'}
          type="button"
        >
          {choices.audioEnabled ? <Mic className="size-4" /> : <MicOff className="size-4" />}
        </button>
        <button
          aria-label="Select microphone device"
          className="rounded-full p-1.5 opacity-70 transition hover:bg-white/20 hover:opacity-100 disabled:opacity-30"
          disabled={microphones.length === 0}
          onClick={() => {
            setMicMenuOpen((open) => !open)
            setCameraMenuOpen(false)
          }}
          title="Select microphone device"
          type="button"
        >
          <ChevronDown className="size-3" />
        </button>
        <DeviceMenu
          activeId={choices.audioDeviceId}
          items={microphones}
          onClose={() => setMicMenuOpen(false)}
          onSelect={(deviceId) => onChoicesChange({ audioDeviceId: deviceId, audioEnabled: true })}
          open={micMenuOpen}
        />
      </div>

      <div className="h-7 w-px bg-white/25" />

      <div className="relative flex items-center gap-1">
        <button
          aria-label={choices.videoEnabled ? 'Turn camera off' : 'Turn camera on'}
          className={`rounded-full p-2.5 transition-all ${
            choices.videoEnabled ? 'bg-white/15 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'
          }`}
          onClick={() => onChoicesChange({ videoEnabled: !choices.videoEnabled })}
          title={choices.videoEnabled ? 'Turn off camera' : 'Turn on camera'}
          type="button"
        >
          {choices.videoEnabled ? <Camera className="size-4" /> : <CameraOff className="size-4" />}
        </button>
        <button
          aria-label="Select camera device"
          className="rounded-full p-1.5 opacity-70 transition hover:bg-white/20 hover:opacity-100 disabled:opacity-30"
          disabled={cameras.length === 0}
          onClick={() => {
            setCameraMenuOpen((open) => !open)
            setMicMenuOpen(false)
          }}
          title="Select camera device"
          type="button"
        >
          <ChevronDown className="size-3" />
        </button>
        <DeviceMenu
          activeId={choices.videoDeviceId}
          items={cameras}
          onClose={() => setCameraMenuOpen(false)}
          onSelect={(deviceId) => onChoicesChange({ videoDeviceId: deviceId, videoEnabled: true })}
          open={cameraMenuOpen}
        />
      </div>
    </div>
  )
}
