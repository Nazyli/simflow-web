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
        'grid min-w-0 grid-cols-2 divide-x divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white/70 sm:grid-cols-3 lg:grid-cols-5',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0 px-3.5 py-3">
          <dt className="truncate text-[0.68rem] font-semibold tracking-[0.08em] text-slate-500 uppercase">
            {item.label}
          </dt>
          <dd
            className={cn(
              'mt-1 text-lg leading-tight font-bold break-words tabular-nums',
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
