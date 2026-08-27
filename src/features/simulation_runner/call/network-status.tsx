import { Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      {isOnline ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5 text-destructive" />}
      {isOnline ? 'Online' : 'Offline'}
    </span>
  )
}
