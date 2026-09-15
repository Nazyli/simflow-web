import { apiClient } from './client'

export interface RuntimeDocumentContent {
  participantDocContentId: string
  participantDocId: string | null
  page: number | null
  content: string | null
  contentMd: string | null
  isHighlight: boolean
}

export interface RuntimeSimulationDocument {
  participantDocId: string
  participantId: string | null
  sessionId: string
  executionId: string | null
  participantFolderId: string | null
  documentName: string | null
  documentId: string | null
  isHighlight: boolean
  isRead: boolean
  owner: string | null
  openedAt: string | null
  counter: number
  createdBy: string | null
  createdDate: string
  modifiedDate: string | null
  contents: RuntimeDocumentContent[]
}

export const getDocuments = (participantId: string) =>
  apiClient<RuntimeSimulationDocument[]>(
    `/web/documents?participantId=${encodeURIComponent(participantId)}`,
  )

export const openDocument = (participantId: string, documentId: string) =>
  apiClient<RuntimeSimulationDocument>(
    `/web/documents/${encodeURIComponent(documentId)}/open?participantId=${encodeURIComponent(participantId)}`,
    { method: 'POST' },
  )
