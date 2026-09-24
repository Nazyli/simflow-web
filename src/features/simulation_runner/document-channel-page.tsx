import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  getDocuments,
  openDocument,
  type RuntimeSimulationDocument,
} from '../../shared/api/documents'
import { DocumentPreviewDialog } from './document/document-preview-dialog'
import { DocumentWorkspace } from './document/document-workspace'
import { mapRuntimeDocument, type SimulationDocument } from './document/types'
import { useSimulationRun } from './simulation-run-context'

export function DocumentChannelPage() {
  const { participantId } = useSimulationRun()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<SimulationDocument | null>(null)

  const documentsQuery = useQuery({
    queryKey: ['documents', participantId],
    queryFn: () => getDocuments(participantId),
    enabled: Boolean(participantId.trim()),
  })

  const openMutation = useMutation({
    mutationFn: ({
      participantId: participant,
      documentId,
    }: {
      participantId: string
      documentId: string
    }) => openDocument(participant, documentId),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData<RuntimeSimulationDocument[]>(
        ['documents', variables.participantId],
        (current) =>
          current?.map((record) =>
            record.participantDocId === updated.participantDocId ? updated : record,
          ),
      )
      setPreviewDoc(mapRuntimeDocument(updated))
    },
  })

  const documents = useMemo(
    () => (documentsQuery.data ?? []).map(mapRuntimeDocument),
    [documentsQuery.data],
  )

  function handleOpenPreview(doc: SimulationDocument) {
    setSelectedId(doc.id)
    if (!openMutation.isPending) {
      openMutation.mutate({ participantId, documentId: doc.id })
    }
  }

  if (documentsQuery.isPending || documentsQuery.isError) {
    const failed = documentsQuery.isError
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-6 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f1f3f4]">
          <FileText size={20} className="text-[#9aa0a6]" />
        </span>
        <p className="text-sm font-medium text-[#1a1a2e]">
          {failed ? 'Failed to load documents' : 'Loading documents…'}
        </p>
        <p className="mt-1 max-w-sm text-xs text-[#5f6368]">
          {failed
            ? 'Documents could not be retrieved for this participant. Check the connection and try again.'
            : 'Fetching shared documents for this simulation session.'}
        </p>
        {failed ? (
          <button
            type="button"
            onClick={() => documentsQuery.refetch()}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50"
          >
            Retry
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <DocumentWorkspace
        documents={documents}
        selectedId={selectedId}
        onSelectDocument={setSelectedId}
        onOpenPreview={handleOpenPreview}
      />
      {previewDoc ? (
        <DocumentPreviewDialog
          document={previewDoc}
          open
          onOpenChange={(open) => {
            if (!open) setPreviewDoc(null)
          }}
        />
      ) : null}
    </div>
  )
}
