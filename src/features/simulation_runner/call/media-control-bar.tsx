import { Camera, CameraOff, Mic, MicOff } from 'lucide-react'
import { useLocalParticipant } from '@livekit/components-react'
import { Button } from '../../../components/ui/button'
import type { CallPrejoinChoices } from './types'

export function MediaControlBar({
  choices,
  onChoicesChange,
}: {
  choices: CallPrejoinChoices
  onChoicesChange: (choices: Partial<CallPrejoinChoices>) => void
}) {
  const { localParticipant } = useLocalParticipant()

  async function toggleMicrophone() {
    const audioEnabled = !choices.audioEnabled
    await localParticipant.setMicrophoneEnabled(audioEnabled)
    onChoicesChange({ audioEnabled })
  }

  async function toggleCamera() {
    const videoEnabled = !choices.videoEnabled
    await localParticipant.setCameraEnabled(videoEnabled)
    onChoicesChange({ videoEnabled })
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-sm">
      <Button
        aria-label={choices.audioEnabled ? 'Mute microphone' : 'Enable microphone'}
        onClick={() => void toggleMicrophone()}
        size="icon"
        variant={choices.audioEnabled ? 'secondary' : 'destructive'}
      >
        {choices.audioEnabled ? <Mic /> : <MicOff />}
      </Button>
      <Button
        aria-label={choices.videoEnabled ? 'Turn camera off' : 'Turn camera on'}
        onClick={() => void toggleCamera()}
        size="icon"
        variant={choices.videoEnabled ? 'secondary' : 'destructive'}
      >
        {choices.videoEnabled ? <Camera /> : <CameraOff />}
      </Button>
    </div>
  )
}
