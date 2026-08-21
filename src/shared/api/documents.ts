import { apiClient } from './client'

export interface RuntimeDocumentContent {
  simulation_document_content_id: string
  simulation_document_id: string | null
  page: number | null
  content: string | null
  is_highlight: boolean
}

export interface RuntimeSimulationDocument {
  simulation_document_id: string
  participant_id: string | null
  session_id: string
  execution_id: string | null
  participant_folder_id: string | null
  document_name: string | null
  document_id: string | null
  is_highlight: boolean
  is_read: boolean
  owner: string | null
  opened_at: string | null
  counter: number
  created_by: string | null
  created_date: string
  modified_date: string | null
  contents: RuntimeDocumentContent[]
}

export const getDocuments = (participantId: string) =>
  apiClient<RuntimeSimulationDocument[]>(
    `/runner/documents?participant_id=${encodeURIComponent(participantId)}`,
  )

export const openDocument = (participantId: string, documentId: string) =>
  apiClient<RuntimeSimulationDocument>(
    `/runner/documents/${encodeURIComponent(documentId)}/open?participant_id=${encodeURIComponent(participantId)}`,
    { method: 'POST' },
  )
