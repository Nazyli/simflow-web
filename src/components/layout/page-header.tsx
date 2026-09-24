import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  eyebrow,
  metadata,
  actions,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  metadata?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex min-w-0 flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="mb-1 text-[0.68rem] font-bold tracking-[0.12em] text-violet-700 uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="min-w-0 text-xl leading-tight font-bold tracking-[-0.02em] break-words text-slate-900 max-[620px]:text-lg">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-[72ch] text-sm leading-relaxed break-words text-slate-500">
            {description}
          </p>
        )}
        {metadata && (
          <div className="mt-2 flex max-w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {metadata}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex w-full max-w-full min-w-0 shrink-0 flex-wrap items-center justify-start gap-2 overflow-x-auto sm:w-auto sm:justify-end [&>*]:max-w-full [&>*]:min-w-0 [&>*]:shrink [&>*]:whitespace-normal">
          {actions}
        </div>
      )}
    </header>
  )
}
