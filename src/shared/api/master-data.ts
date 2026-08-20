import { apiClient } from './client'

export interface MasterEmailAttachment {
  attachment_id: string
  doc_content_id: string | null
  document_id: string | null
  document_name: string
}

export interface MasterEmailDetail {
  email_id: string
  attachments: MasterEmailAttachment[]
}

export const getStudioMasterData = (endpoint: string) =>
  apiClient<Record<string, unknown>[]>(endpoint)

export const getStudioMasterEmail = (emailId: string) =>
  apiClient<MasterEmailDetail>(`/studio/master-data/emails/${encodeURIComponent(emailId)}`)
