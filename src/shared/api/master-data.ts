import { apiClient } from './client'

export interface MasterEmailAttachment {
  attachmentId: string
  docContentId: string | null
  documentId: string | null
  documentName: string
}

export interface MasterEmailDetail {
  emailId: string
  attachments: MasterEmailAttachment[]
}

export const getStudioMasterData = (endpoint: string) =>
  apiClient<Record<string, unknown>[]>(endpoint)

export const getStudioMasterEmail = (emailId: string) =>
  apiClient<MasterEmailDetail>(`/admin/master-data/emails/${encodeURIComponent(emailId)}`)

export interface MasterActor {
  actorId: string
  actorName: string
  actorEmail?: string | null
  actorPosition?: string | null
  [key: string]: unknown
}

export const getMasterActors = () => apiClient<MasterActor[]>('/admin/master-data/actors')
