import { apiClient } from './client'

export interface AuditFields {
  createdBy: string | null
  createdDate: string | null
  modifiedBy: string | null
  modifiedDate: string | null
}

export interface MasterEmailAttachment {
  attachmentId: string
  docContentId: string | null
  documentId: string | null
  documentName: string
}

export interface MasterEmail extends AuditFields {
  emailId: string
  emailName: string | null
  nodeId: string | null
  actorFrom: string | null
  actorTo: string | null
  actorCc: string | null
  emailType: string | null
  parentMasterEmailId: string | null
  subject: string | null
  content: string | null
  attachments: MasterEmailAttachment[]
}

export interface MasterDocumentContent {
  docContentId: string
  documentId: string
  documentName: string
  page: number | null
  content: string | null
}

export const getStudioMasterData = (endpoint: string) =>
  apiClient<Record<string, unknown>[]>(endpoint)

export interface MasterChat extends AuditFields {
  chatId: string
  nodeId: string | null
  chatName: string
  actorId: string | null
  content: string | null
}

export const getMasterChats = () => apiClient<MasterChat[]>('/admin/master-data/chats')

export const createMasterChat = (nodeId: string, actorId: string, content: string) =>
  apiClient<MasterChat>('/admin/master-data/chats', {
    method: 'POST',
    body: JSON.stringify({ nodeId, actorId, content }),
  })

export const updateMasterChat = (chatId: string, actorId: string, content: string) =>
  apiClient<MasterChat>(`/admin/master-data/chats/${encodeURIComponent(chatId)}`, {
    method: 'PUT',
    body: JSON.stringify({ actorId, content }),
  })

export const deleteMasterChat = (chatId: string) =>
  apiClient<null>(`/admin/master-data/chats/${encodeURIComponent(chatId)}`, { method: 'DELETE' })

export interface MasterCall extends AuditFields {
  callId: string
  callName: string | null
  nodeId: string | null
  actorId: string | null
  content: string | null
}

export const getMasterCalls = () => apiClient<MasterCall[]>('/admin/master-data/calls')

export const createMasterCall = (nodeId: string, actorId: string, content: string) =>
  apiClient<MasterCall>('/admin/master-data/calls', {
    method: 'POST',
    body: JSON.stringify({ nodeId, actorId, content }),
  })

export const updateMasterCall = (callId: string, actorId: string, content: string) =>
  apiClient<MasterCall>(`/admin/master-data/calls/${encodeURIComponent(callId)}`, {
    method: 'PUT',
    body: JSON.stringify({ actorId, content }),
  })

export const deleteMasterCall = (callId: string) =>
  apiClient<null>(`/admin/master-data/calls/${encodeURIComponent(callId)}`, { method: 'DELETE' })

export interface MasterPrompt extends AuditFields {
  promptId: string
  nodeId: string | null
  content: string | null
  desc: string | null
}

export const getMasterPrompts = () => apiClient<MasterPrompt[]>('/admin/master-data/prompts')

export const createMasterPrompt = (nodeId: string, content: string, desc: string | null) =>
  apiClient<MasterPrompt>('/admin/master-data/prompts', {
    method: 'POST',
    body: JSON.stringify({ nodeId, content, desc }),
  })

export const updateMasterPrompt = (promptId: string, content: string, desc: string | null) =>
  apiClient<MasterPrompt>(`/admin/master-data/prompts/${encodeURIComponent(promptId)}`, {
    method: 'PUT',
    body: JSON.stringify({ content, desc }),
  })

export const deleteMasterPrompt = (promptId: string) =>
  apiClient<null>(`/admin/master-data/prompts/${encodeURIComponent(promptId)}`, {
    method: 'DELETE',
  })

export const getStudioMasterEmail = (emailId: string) =>
  apiClient<MasterEmail>(`/admin/master-data/emails/${encodeURIComponent(emailId)}`)

export const getMasterEmails = () => apiClient<MasterEmail[]>('/admin/master-data/emails')

export const getMasterEmailOriginals = (simulationId: string) =>
  apiClient<MasterEmail[]>(
    `/admin/master-data/emails/originals?simulationId=${encodeURIComponent(simulationId)}`,
  )

export const getMasterDocumentContents = () =>
  apiClient<MasterDocumentContent[]>('/admin/master-data/emails/document-contents')

export interface MasterEmailFormPayload {
  actorFrom: string
  actorTo: string
  actorCc: string | null
  emailType: 'original' | 'reply'
  parentMasterEmailId: string | null
  subject: string
  content: string
  docContentIds: string[]
}

export const createMasterEmail = (nodeId: string, values: MasterEmailFormPayload) =>
  apiClient<MasterEmail>('/admin/master-data/emails', {
    method: 'POST',
    body: JSON.stringify({ nodeId, ...values }),
  })

export const updateMasterEmail = (emailId: string, values: MasterEmailFormPayload) =>
  apiClient<MasterEmail>(`/admin/master-data/emails/${encodeURIComponent(emailId)}`, {
    method: 'PUT',
    body: JSON.stringify(values),
  })

export const deleteMasterEmail = (emailId: string) =>
  apiClient<null>(`/admin/master-data/emails/${encodeURIComponent(emailId)}`, { method: 'DELETE' })

export interface MasterActor {
  actorId: string
  actorName: string
  actorEmail?: string | null
  actorPosition?: string | null
  [key: string]: unknown
}

export const getMasterActors = () => apiClient<MasterActor[]>('/admin/master-data/actors')
