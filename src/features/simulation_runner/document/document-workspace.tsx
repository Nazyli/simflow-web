import { FileText, ExternalLink, BookOpen, Eye, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { isHtmlContent, stripHtmlToText } from '../../../shared/html'
import { inputClass } from '../../../shared/form-classes'
import { DOCUMENT_STATUS_META, DOCUMENT_TYPE_META, type SimulationDocument } from './types'
import { formatDocumentDate } from './types'

interface DocumentWorkspaceProps {
  documents: SimulationDocument[]
  selectedId: string | null
  onSelectDocument: (id: string) => void
  onOpenPreview: (doc: SimulationDocument) => void
}

export function DocumentWorkspace({
  documents,
  selectedId,
  onSelectDocument,
  onOpenPreview,
}: DocumentWorkspaceProps) {
  const selected = documents.find((d) => d.id === selectedId) ?? null

  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q
      ? documents.filter(
          (doc) =>
            doc.title.toLowerCase().includes(q) ||
            doc.summary.toLowerCase().includes(q) ||
            doc.sharedBy.toLowerCase().includes(q) ||
            (doc.simulationName ?? '').toLowerCase().includes(q),
        )
      : documents
  }, [documents, search])

  return (
    <div className="flex min-h-[540px] flex-1 flex-col overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        {/* Sidebar list */}
        <aside className="flex shrink-0 flex-col border-b border-[#e8eaed] bg-white lg:w-[340px] lg:border-r lg:border-b-0">
          <p className="px-4 pt-3 pb-2 text-[10px] font-bold tracking-wider text-[#9aa0a6] uppercase">
            Documents
          </p>
          <label className="relative px-3 pb-2">
            <Search className="pointer-events-none absolute top-2.5 left-6 h-3.5 w-3.5 text-[#9aa0a6]" />
            <input
              className={`${inputClass} !py-2 !pl-8 text-xs`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents"
            />
          </label>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <FileText size={20} className="text-[#9aa0a6]" />
                <p className="text-xs text-[#5f6368]">
                  {documents.length ? 'No matching documents.' : 'No documents yet.'}
                </p>
              </div>
            ) : (
              filtered.map((doc) => {
                const active = doc.id === selectedId
                const typeMeta = DOCUMENT_TYPE_META[doc.type]
                const statusMeta = DOCUMENT_STATUS_META[doc.status]
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => onSelectDocument(doc.id)}
                    className={`group flex w-full items-stretch gap-0 border-b border-[#e8eaed] text-left transition-colors last:border-b-0 hover:bg-[#f1f3f4] ${active ? 'bg-[#e8f0fe]' : 'bg-white'}`}
                  >
                    {/* Type ribbon */}
                    <span
                      className="w-1 shrink-0 self-stretch rounded-l-sm"
                      style={{ backgroundColor: typeMeta.color }}
                      aria-hidden="true"
                    />
                    <span className="flex min-w-0 flex-1 items-start gap-3 px-3 py-3">
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold"
                        style={{ backgroundColor: typeMeta.bg, color: typeMeta.color }}
                      >
                        {typeMeta.label.charAt(0)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span
                            className={`truncate text-sm ${active ? 'font-semibold text-[#1a1a2e]' : 'font-normal text-[#5f6368]'}`}
                          >
                            {doc.title}
                          </span>
                          <span className="shrink-0 text-[11px] text-[#5f6368]">
                            {formatDocumentDate(doc.sharedAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded border px-1.5 py-px text-[10px] leading-4 font-medium ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </span>
                          <span className="truncate text-xs text-[#5f6368]">{doc.sharedBy}</span>
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Detail panel */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {selected ? (
            <DocumentDetail document={selected} onOpenPreview={onOpenPreview} />
          ) : (
            <div className="flex flex-1 items-center justify-center bg-[#f6f8fb] px-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f1f3f4]">
                  <FileText size={20} className="text-[#9aa0a6]" />
                </span>
                <div>
                  <p className="text-sm font-medium text-[#1a1a2e]">
                    {documents.length ? 'Select a document' : 'No documents yet'}
                  </p>
                  <p className="mt-1 text-xs text-[#5f6368]">
                    {documents.length
                      ? 'Choose a document from the list to preview its contents.'
                      : 'Documents from simulation simulations will appear here.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Document detail panel                                                      */
/* -------------------------------------------------------------------------- */

function DocumentDetail({
  document: doc,
  onOpenPreview,
}: {
  document: SimulationDocument
  onOpenPreview: (doc: SimulationDocument) => void
}) {
  const typeMeta = DOCUMENT_TYPE_META[doc.type]
  const statusMeta = DOCUMENT_STATUS_META[doc.status]

  return (
    <div className="flex flex-1 flex-col bg-[#f6f8fb]">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#e8eaed] bg-white px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-slate-600">{doc.title}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span
              className={`inline-flex items-center rounded border px-1.5 py-px leading-4 font-medium ${statusMeta.className}`}
            >
              {statusMeta.label}
            </span>
            <span className="text-slate-300">·</span>
            <span
              className="inline-flex items-center gap-1 rounded px-1.5 py-px font-medium"
              style={{ backgroundColor: typeMeta.bg, color: typeMeta.color }}
            >
              {typeMeta.label}
            </span>
          </div>
        </div>
      </div>

      {/* Content body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Summary card */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">
              Summary
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">{doc.summary}</p>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {doc.simulationName ? (
              <MetaCard
                icon={<BookOpen size={14} />}
                label="GroupSimulation"
                value={doc.simulationName}
              />
            ) : null}
            <MetaCard icon={<FileText size={14} />} label="Pages" value={`${doc.pageCount}`} />
            <MetaCard icon={<Eye size={14} />} label="Opened" value={`${doc.openCount}×`} />
            <MetaCard
              icon={<ExternalLink size={14} />}
              label="Shared by"
              value={doc.sharedBy || '—'}
            />
          </div>

          {/* Preview excerpt */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase">Preview</h3>
              <button
                type="button"
                onClick={() => onOpenPreview(doc)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <ExternalLink size={12} />
                Open full view
              </button>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-4">
              {(() => {
                const excerpt = isHtmlContent(doc.content)
                  ? stripHtmlToText(doc.content)
                  : doc.content
                return (
                  <pre className="font-sans text-[13px] leading-7 whitespace-pre-wrap text-slate-600">
                    {excerpt.length > 1200 ? `${excerpt.slice(0, 1200)}\n\n…` : excerpt}
                  </pre>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold tracking-wide text-slate-400 uppercase">
          {label}
        </span>
        <span className="block truncate text-sm font-medium text-slate-600">{value}</span>
      </span>
    </div>
  )
}
