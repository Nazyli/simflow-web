import { useId, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function SurfaceSection({
  children,
  title,
  description,
  actions,
  className,
}: {
  children: ReactNode
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  const titleId = useId()

  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={cn('min-w-0 border-b border-slate-200 pb-5 last:border-b-0', className)}
    >
      {(title || description || actions) && (
        <header className="mb-4 flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {title && (
              <h2
                id={titleId}
                className="text-base leading-snug font-bold break-words text-slate-900"
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 max-w-[72ch] text-sm leading-relaxed break-words text-slate-500">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex max-w-full min-w-0 shrink-0 flex-wrap items-center gap-2 [&>*]:max-w-full">
              {actions}
            </div>
          )}
        </header>
      )}
      {children}
    </section>
  )
}
