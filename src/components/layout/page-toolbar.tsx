import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function PageToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex w-full max-w-full min-w-0 flex-wrap items-center gap-2 overflow-x-auto [&>*]:max-w-full [&>*]:min-w-0 [&>*]:shrink [&>*]:whitespace-normal',
        className,
      )}
    >
      {children}
    </div>
  )
}
