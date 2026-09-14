import { useEffect, useMemo, useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type {
  RuntimeDocumentContent,
  RuntimeSimulationDocument,
} from '../../../shared/api/documents'

export interface AttachmentPageSelection {
  participantDocContentId: string
  page: number | null
}

export interface AttachmentSelection {
  participantDocId: string
  documentName: string
  contents: AttachmentPageSelection[]
}

interface AttachmentPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documents: RuntimeSimulationDocument[]
  isLoading: boolean
  initialSelection: AttachmentSelection[]
  onConfirm: (selection: AttachmentSelection[]) => void
}

function sortPages<T extends RuntimeDocumentContent>(contents: readonly T[]): T[] {
  return [...contents].sort((first, second) => {
    const firstPage = first.page ?? Number.MAX_SAFE_INTEGER
    const secondPage = second.page ?? Number.MAX_SAFE_INTEGER
    return (
      firstPage - secondPage ||
      first.participantDocContentId.localeCompare(second.participantDocContentId)
    )
  })
}

function selectionToState(selection: AttachmentSelection[]): Record<string, Set<string>> {
  return Object.fromEntries(
    selection.map((item) => [
      item.participantDocId,
      new Set(item.contents.map((page) => page.participantDocContentId)),
    ]),
  )
}

export function AttachmentPickerDialog({
  open,
  onOpenChange,
  documents,
  isLoading,
  initialSelection,
  onConfirm,
}: AttachmentPickerDialogProps) {
  const [selected, setSelected] = useState<Record<string, Set<string>>>({})

  useEffect(() => {
    if (open) setSelected(selectionToState(initialSelection))
    // Re-initialize only when the dialog opens so edits stay local until confirmed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const totalPages = useMemo(
    () => Object.values(selected).reduce((total, pages) => total + pages.size, 0),
    [selected],
  )

  const togglePage = (participantDocId: string, contentId: string) => {
    setSelected((current) => {
      const pages = new Set(current[participantDocId] ?? [])
      if (pages.has(contentId)) {
        pages.delete(contentId)
      } else {
        pages.add(contentId)
      }
      return { ...current, [participantDocId]: pages }
    })
  }

  const toggleDocument = (document: RuntimeSimulationDocument) => {
    const allSelected = document.contents.every((content) =>
      selected[document.participantDocId]?.has(content.participantDocContentId),
    )
    setSelected((current) => ({
      ...current,
      [document.participantDocId]: new Set(
        allSelected ? [] : document.contents.map((content) => content.participantDocContentId),
      ),
    }))
  }

  const confirm = () => {
    const next: AttachmentSelection[] = []
    for (const document of documents) {
      const pages = selected[document.participantDocId]
      if (!pages?.size) continue
      next.push({
        participantDocId: document.participantDocId,
        documentName: document.documentName ?? 'Untitled document',
        contents: sortPages(document.contents)
          .filter((content) => pages.has(content.participantDocContentId))
          .map((content) => ({
            participantDocContentId: content.participantDocContentId,
            page: content.page,
          })),
      })
    }
    onConfirm(next)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-48px)] w-[min(560px,calc(100vw-32px))] flex-col gap-0 p-0 sm:max-w-none">
        <DialogHeader className="border-b border-[#e8eaed] px-6 py-4 pr-12">
          <DialogTitle className="text-[#1a1a2e]">Attach documents</DialogTitle>
          <p className="mt-1 text-xs font-normal text-[#5f6368]">
            Choose a document, then pick the specific pages to attach.
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#5f6368]">
              <Loader2 size={16} className="animate-spin" />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#5f6368]">
              No documents are available in this simulation yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {documents.map((document) => {
                const docId = document.participantDocId
                const pages = sortPages(document.contents)
                const selectedCount = pages.filter((content) =>
                  selected[docId]?.has(content.participantDocContentId),
                ).length
                const allSelected = pages.length > 0 && selectedCount === pages.length
                return (
                  <li key={docId} className="rounded-lg border border-[#e8eaed] bg-white">
                    <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                      <Checkbox
                        checked={selectedCount > 0 && !allSelected ? 'indeterminate' : allSelected}
                        onCheckedChange={() => toggleDocument(document)}
                      />
                      <FileText size={16} className="shrink-0 text-[#5b46c5]" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1a1a2e]">
                        {document.documentName ?? 'Untitled document'}
                      </span>
                      <span className="text-xs text-[#5f6368]">
                        {selectedCount}/{pages.length} pages
                      </span>
                    </label>
                    {pages.length > 0 ? (
                      <ul className="border-t border-[#e8eaed] px-4 py-2">
                        {pages.map((content) => (
                          <li key={content.participantDocContentId}>
                            <label className="flex cursor-pointer items-center gap-3 rounded-md py-1.5 pr-2 pl-7 hover:bg-[#f6f8fb]">
                              <Checkbox
                                checked={Boolean(
                                  selected[docId]?.has(content.participantDocContentId),
                                )}
                                onCheckedChange={() =>
                                  togglePage(docId, content.participantDocContentId)
                                }
                              />
                              <span className="text-sm text-[#1a1a2e]">
                                Page {content.page ?? '—'}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="border-t border-[#e8eaed] px-6 py-4 sm:justify-between">
          <span className="text-xs text-[#5f6368]">
            {totalPages} page{totalPages === 1 ? '' : 's'} selected
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirm} className="bg-[#5b46c5] hover:bg-[#4b38ac]">
              Attach
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
