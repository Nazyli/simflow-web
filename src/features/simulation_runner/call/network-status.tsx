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
    <span
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm ${
        isOnline
          ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
          : 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30'
      }`}
    >
      {isOnline ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
      {isOnline ? 'Online' : 'Offline'}
    </span>
  )
}
