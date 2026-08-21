import { useState } from 'react'
import { DocumentPreviewDialog } from './document/document-preview-dialog'
import { DocumentWorkspace } from './document/document-workspace'
import { DUMMY_DOCUMENTS, type SimulationDocument } from './document/types'

export function DocumentChannelPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<SimulationDocument | null>(null)

  const documents = DUMMY_DOCUMENTS

  function handleOpenPreview(doc: SimulationDocument) {
    setPreviewDoc(doc)
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
