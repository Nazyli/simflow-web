import { AlertCircle, Inbox } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function LoadingState({ label = 'Loading data…', variant = 'table' }: { label?: string; variant?: 'table' | 'workflow' | 'canvas' | 'runner' }) {
  const rows = variant === 'canvas' ? 1 : variant === 'runner' ? 4 : 3
  return <motion.section className={`loading-skeleton ${variant}`} role="status" aria-label={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><span className="sr-only">{label}</span>{Array.from({ length: rows }, (_, index) => <motion.i key={index} initial={{ opacity: .45 }} animate={{ opacity: [.45, .9, .45] }} transition={{ duration: 1.25, repeat: Infinity, delay: index * .12 }} />)}</motion.section>
}

export function ErrorState({ message }: { message: string }) { return <motion.p className="async-error" role="alert" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}><AlertCircle size={16} /><span>{message} Check your connection and retry.</span></motion.p> }

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <motion.section className="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><span><Inbox size={22} /></span><strong>{title}</strong><p>{description}</p>{action}</motion.section> }
