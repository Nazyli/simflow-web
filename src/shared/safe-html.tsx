import { useMemo } from 'react'
import { sanitizeHtml } from './html'

export const RICH_TEXT_CLASS =
  'text-[13px] leading-[1.7] break-words text-slate-700 [&_a]:text-indigo-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-slate-200 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-[15px] [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_table]:w-full [&_table]:text-xs [&_td]:border [&_td]:border-slate-200 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-2 [&_th]:py-1'

interface SafeHtmlProps {
  html: string
  className?: string
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  const sanitized = useMemo(() => sanitizeHtml(html), [html])
  return (
    <div className={className ?? RICH_TEXT_CLASS} dangerouslySetInnerHTML={{ __html: sanitized }} />
  )
}
