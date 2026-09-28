import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type SummaryStripTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

export type SummaryStripItem = {
  label: string
  value: ReactNode
  tone?: SummaryStripTone
}

const toneClasses: Record<SummaryStripTone, string> = {
  neutral: 'text-slate-900',
  accent: 'text-violet-700',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-red-700',
}

export function SummaryStrip({
  items,
  className,
}: {
  items: SummaryStripItem[]
  className?: string
}) {
  return (
    <dl
      className={cn(
        'app-summary-strip grid min-w-0 auto-cols-[minmax(112px,1fr)] grid-flow-col divide-x divide-slate-200 overflow-x-auto rounded-md border border-slate-200 bg-white',
        className,
      )}
    >
      {items.map((item, index) => (
        <div
          key={`${index}:${item.label}`}
          className="app-summary-strip__item min-w-[112px] px-3.5 py-2.5"
        >
          <dt className="truncate text-xs font-semibold tracking-[0.08em] text-slate-500 uppercase">
            {item.label}
          </dt>
          <dd
            className={cn(
              'mt-0.5 text-base leading-tight font-semibold break-words tabular-nums',
              toneClasses[item.tone ?? 'neutral'],
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
