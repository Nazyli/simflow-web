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
      className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${
        isOnline
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {isOnline ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
      {isOnline ? 'Online' : 'Offline'}
    </span>
  )
}
