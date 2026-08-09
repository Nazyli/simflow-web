import { AlertCircle, Inbox } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function LoadingState({
  label = 'Loading data…',
  variant = 'table',
}: {
  label?: string
  variant?: 'table' | 'workflow' | 'canvas' | 'runner'
}) {
  const rows = variant === 'canvas' ? 1 : variant === 'runner' ? 4 : 3
  const widths = ['w-full', 'w-[84%]', 'w-[68%]']
  const containerClass =
    variant === 'canvas'
      ? 'grid min-h-[360px] place-items-center rounded-lg border border-slate-200 bg-white p-4'
      : variant === 'runner'
        ? 'grid grid-cols-2 gap-2.5 rounded-lg border border-slate-200 bg-white p-4'
        : 'grid gap-2.5 rounded-lg border border-slate-200 bg-white p-4'
  return (
    <motion.section
      role="status"
      aria-label={label}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={containerClass}
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          key={index}
          className={
            variant === 'canvas'
              ? 'h-[90px] w-1/2 rounded-lg'
              : variant === 'runner'
                ? 'h-[120px] rounded-lg'
                : `h-3.5 rounded-full ${widths[index] ?? 'w-full'}`
          }
        />
      ))}
    </motion.section>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <motion.p
      role="alert"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"
    >
      <AlertCircle size={16} />
      <span>{message} Check your connection and retry.</span>
    </motion.p>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid justify-items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-600">
        <Inbox size={22} />
      </span>
      <strong className="text-sm text-slate-700">{title}</strong>
      <p className="m-0 max-w-[320px] text-xs leading-relaxed">{description}</p>
      {action}
    </motion.section>
  )
}
