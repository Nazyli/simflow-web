import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type PageFrameMode = 'workbench' | 'operations' | 'reference'

const modeClasses: Record<PageFrameMode, string> = {
  workbench: 'space-y-3 max-[900px]:px-0 max-[900px]:py-0 max-[620px]:p-0',
  operations: 'space-y-6',
  reference: 'space-y-8',
}

export function PageFrame({
  children,
  className,
  mode = 'operations',
}: {
  children: ReactNode
  className?: string
  mode?: PageFrameMode
}) {
  return (
    <main
      className={cn(
        'max-w-none min-w-0 bg-[#F6F8FB] p-6 max-[900px]:px-[18px] max-[900px]:py-[22px] max-[620px]:p-3',
        modeClasses[mode],
        className,
      )}
    >
      {children}
    </main>
  )
}
