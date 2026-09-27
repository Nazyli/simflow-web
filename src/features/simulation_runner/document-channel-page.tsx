import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useMemo, useState } from 'react'
import {
  createDocument,
  getDocuments,
  openDocument,
  updateDocument,
  type DocumentWriteInput,
  type RuntimeSimulationDocument,
} from '../../shared/api/documents'
import {
  isDocumentDraftDirty,
  serializeDocumentDraft,
  type DocumentEditorDraft,
} from './document/document-editor-logic'
import {
  beginCreateDocument,
  beginEditDocument,
  createInitialDocumentEditorState,
  finishDocumentSave,
  recordDocumentSaveFailure,
} from './document/document-channel-editor-logic'
import { DocumentEditor } from './document/document-editor'
import { DocumentPreviewDialog } from './document/document-preview-dialog'
import { DocumentWorkspace } from './document/document-workspace'
import { mapRuntimeDocument, type SimulationDocument } from './document/types'
import { useSimulationRun } from './simulation-run-context'

export function DocumentChannelPage() {
  const { participantId } = useSimulationRun()
  const queryClient = useQueryClient()
  const [editorState, setEditorState] = useState(createInitialDocumentEditorState)
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
      setEditorState((current) => ({
        ...current,
        mode: 'read',
        selectedId: updated.participantDocId,
        draft: null,
        savedDraft: null,
        error: null,
      }))
      setPreviewDoc(mapRuntimeDocument(updated))
    },
  })

  const saveMutation = useMutation({
    mutationFn: ({
      mode,
      documentId,
      input,
    }: {
      mode: 'create' | 'edit'
      documentId: string | null
      input: DocumentWriteInput
    }) => {
      if (mode === 'create') return createDocument(participantId, input)
      if (!documentId) throw new Error('The document could not be identified.')
      return updateDocument(participantId, documentId, input)
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<RuntimeSimulationDocument[]>(
        ['documents', participantId],
        (current) => {
          if (!current) return [saved]
          const exists = current.some((record) => record.participantDocId === saved.participantDocId)
          return exists
            ? current.map((record) =>
                record.participantDocId === saved.participantDocId ? saved : record,
              )
            : [saved, ...current]
        },
      )
      setEditorState((current) => finishDocumentSave(current, saved))
      toast.success('Document saved.')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to save the document.'
      setEditorState((current) => recordDocumentSaveFailure(current, message))
    },
  })

  const documents = useMemo(
    () => (documentsQuery.data ?? []).map(mapRuntimeDocument),
    [documentsQuery.data],
  )
  const selectedId = editorState.selectedId
  const editorDraft = editorState.draft
  const isEditorDirty = Boolean(
    editorDraft &&
      editorState.savedDraft &&
      isDocumentDraftDirty(editorDraft, editorState.savedDraft),
  )

  useEffect(() => {
    if (!isEditorDirty) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isEditorDirty])

  function canLeaveEditor() {
    return !isEditorDirty || window.confirm('You have unsaved changes. Leave the editor?')
  }

  function showReadDocument(id: string | null) {
    setEditorState({
      ...createInitialDocumentEditorState(),
      selectedId: id,
    })
  }

  function handleSelectDocument(id: string) {
    if (id === selectedId && editorState.mode === 'read') return
    if (!canLeaveEditor()) return
    showReadDocument(id)
  }

  function handleCreateDocument() {
    if (!canLeaveEditor()) return
    if (!participantId.trim()) {
      toast.error('Choose an active participant before creating a document.')
      return
    }
    setEditorState((current) => beginCreateDocument(current))
  }

  function handleEditDocument(doc: SimulationDocument) {
    if (!canLeaveEditor()) return
    const record = (documentsQuery.data ?? []).find(
      (item) => item.participantDocId === doc.id,
    )
    if (!record) {
      toast.error('The selected document is no longer available.')
      return
    }
    setEditorState((current) => beginEditDocument(current, record))
  }

  function handleCancelEditor() {
    if (!canLeaveEditor()) return
    showReadDocument(editorState.mode === 'edit' ? editorState.selectedId : null)
  }

  function handleEditorChange(draft: DocumentEditorDraft) {
    setEditorState((current) => ({ ...current, draft, error: null }))
  }

  function handleSaveEditor() {
    if (!editorDraft || editorState.mode === 'read') return
    if (!participantId.trim()) {
      setEditorState((current) =>
        recordDocumentSaveFailure(current, 'Choose an active participant before saving.'),
      )
      return
    }
    saveMutation.mutate({
      mode: editorState.mode,
      documentId: editorDraft.participantDocId,
      input: serializeDocumentDraft(editorDraft),
    })
  }

  function handleOpenPreview(doc: SimulationDocument) {
    showReadDocument(doc.id)
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
        onSelectDocument={handleSelectDocument}
        onOpenPreview={handleOpenPreview}
        onCreateDocument={handleCreateDocument}
        onEditDocument={handleEditDocument}
        editor={
          editorDraft ? (
            <DocumentEditor
              draft={editorDraft}
              savedDraft={editorState.savedDraft ?? editorDraft}
              mode={editorState.mode === 'create' ? 'create' : 'edit'}
              isSaving={saveMutation.isPending}
              error={editorState.error}
              onChange={handleEditorChange}
              onSave={handleSaveEditor}
              onCancel={handleCancelEditor}
            />
          ) : null
        }
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
