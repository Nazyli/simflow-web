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
    <span className="text-muted-foreground flex items-center gap-1 text-xs">
      {isOnline ? <Wifi className="size-3.5" /> : <WifiOff className="text-destructive size-3.5" />}
      {isOnline ? 'Online' : 'Offline'}
    </span>
  )
}
