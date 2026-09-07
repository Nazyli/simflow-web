import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DOCUMENT_STATUS_META, DOCUMENT_TYPE_META, type SimulationDocument } from './types'

interface DocumentPreviewDialogProps {
  document: SimulationDocument
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocumentPreviewDialog({
  document: doc,
  open,
  onOpenChange,
}: DocumentPreviewDialogProps) {
  const typeMeta = DOCUMENT_TYPE_META[doc.type]
  const statusMeta = DOCUMENT_STATUS_META[doc.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-48px)] w-[min(900px,calc(100vw-32px))] flex-col gap-0 p-0 sm:max-w-none">
        <DialogHeader className="border-b border-slate-200 px-6 py-4 pr-12">
          <div className="flex items-center gap-3">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold"
              style={{ backgroundColor: typeMeta.bg, color: typeMeta.color }}
            >
              {typeMeta.label.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-slate-800">{doc.title}</DialogTitle>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <span
                  className={`inline-flex items-center rounded border px-1.5 py-px leading-4 font-medium ${statusMeta.className}`}
                >
                  {statusMeta.label}
                </span>
                <span className="text-slate-400">·</span>
                <span>{doc.sharedBy}</span>
                {doc.simulationName ? (
                  <>
                    <span className="text-slate-400">·</span>
                    <span>{doc.simulationName}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto bg-slate-100 p-4 sm:p-6">
          <div className="mx-auto flex max-w-[680px] flex-col gap-5">
            {doc.pages.map((page, index) => (
              <section key={index}>
                <article className="min-h-[720px] bg-white p-6 text-sm leading-7 whitespace-pre-wrap text-slate-700 shadow-sm sm:p-10">
                  {page}
                </article>
                {doc.pages.length > 1 ? (
                  <p className="mt-2 text-center text-[11px] text-slate-400">
                    Page {index + 1} of {doc.pages.length}
                  </p>
                ) : null}
              </section>
            ))}
            <p className="text-center text-[11px] text-slate-400">
              {doc.pageCount} page{doc.pageCount === 1 ? '' : 's'} · {typeMeta.label} · opened{' '}
              {doc.openCount}×
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
