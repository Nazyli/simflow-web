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
  nodeId: string | null
  actorFrom: string | null
  actorTo: string | null
  actorCc: string | null
  emailType: string | null
  parentMasterEmailId: string | null
  subject: string | null
  content: string | null
  prompt?: string | null
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
  actorId: string | null
  content: string | null
  prompt?: string | null
}

export const getMasterChatByNode = (nodeId: string) =>
  apiClient<MasterChat | null>(`/admin/master-data/chats/by-node/${encodeURIComponent(nodeId)}`)

export const createMasterChat = (
  nodeId: string,
  actorId: string,
  content: string,
  prompt?: string | null,
) =>
  apiClient<MasterChat>('/admin/master-data/chats', {
    method: 'POST',
    body: JSON.stringify({ nodeId, actorId, content, prompt: prompt ?? null }),
  })

export const updateMasterChat = (
  chatId: string,
  actorId: string,
  content: string,
  prompt?: string | null,
) =>
  apiClient<MasterChat>(`/admin/master-data/chats/${encodeURIComponent(chatId)}`, {
    method: 'PUT',
    body: JSON.stringify({ actorId, content, prompt: prompt ?? null }),
  })

export const deleteMasterChat = (chatId: string) =>
  apiClient<null>(`/admin/master-data/chats/${encodeURIComponent(chatId)}`, { method: 'DELETE' })

export interface MasterCall extends AuditFields {
  callId: string
  nodeId: string | null
  actorId: string | null
  content: string | null
  prompt?: string | null
}

export const getMasterCallByNode = (nodeId: string) =>
  apiClient<MasterCall | null>(`/admin/master-data/calls/by-node/${encodeURIComponent(nodeId)}`)

export const createMasterCall = (
  nodeId: string,
  actorId: string,
  content: string,
  prompt?: string | null,
) =>
  apiClient<MasterCall>('/admin/master-data/calls', {
    method: 'POST',
    body: JSON.stringify({ nodeId, actorId, content, prompt: prompt ?? null }),
  })

export const updateMasterCall = (
  callId: string,
  actorId: string,
  content: string,
  prompt?: string | null,
) =>
  apiClient<MasterCall>(`/admin/master-data/calls/${encodeURIComponent(callId)}`, {
    method: 'PUT',
    body: JSON.stringify({ actorId, content, prompt: prompt ?? null }),
  })

export const deleteMasterCall = (callId: string) =>
  apiClient<null>(`/admin/master-data/calls/${encodeURIComponent(callId)}`, { method: 'DELETE' })

export interface MasterPrompt extends AuditFields {
  promptId: string
  nodeId: string | null
  content: string | null
  desc: string | null
}

export const getMasterPromptByNode = (nodeId: string) =>
  apiClient<MasterPrompt | null>(`/admin/master-data/prompts/by-node/${encodeURIComponent(nodeId)}`)

export const createMasterPrompt = (nodeId: string, content: string) =>
  apiClient<MasterPrompt>('/admin/master-data/prompts', {
    method: 'POST',
    body: JSON.stringify({ nodeId, content }),
  })

export const updateMasterPrompt = (promptId: string, content: string) =>
  apiClient<MasterPrompt>(`/admin/master-data/prompts/${encodeURIComponent(promptId)}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  })

export const deleteMasterPrompt = (promptId: string) =>
  apiClient<null>(`/admin/master-data/prompts/${encodeURIComponent(promptId)}`, {
    method: 'DELETE',
  })

export interface PromptPreviewResponse {
  renderedPrompt: string
  variables: Record<string, unknown>
  unresolvedPlaceholders: string[]
}

export const previewPrompt = (
  nodeType: string,
  prompt: string,
  actorId?: string | null,
  variables?: Record<string, unknown>,
) =>
  apiClient<PromptPreviewResponse>('/admin/master-data/prompts/preview', {
    method: 'POST',
    body: JSON.stringify({
      nodeType,
      prompt,
      ...(actorId?.trim() ? { actorId: actorId.trim() } : {}),
      ...(variables && Object.keys(variables).length > 0 ? { variables } : {}),
    }),
  })

export const getMasterEmailByNode = (nodeId: string) =>
  apiClient<MasterEmail | null>(`/admin/master-data/emails/by-node/${encodeURIComponent(nodeId)}`)

export const getMasterEmailOriginals = (simulationId: string, excludeEmailId?: string) => {
  const params = new URLSearchParams({ simulationId })
  if (excludeEmailId) params.set('excludeEmailId', excludeEmailId)
  return apiClient<MasterEmail[]>(`/admin/master-data/emails/originals?${params.toString()}`)
}

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
  prompt?: string | null
}

export const createMasterEmail = (nodeId: string, values: MasterEmailFormPayload) =>
  apiClient<MasterEmail>('/admin/master-data/emails', {
    method: 'POST',
    body: JSON.stringify({ nodeId, ...values, prompt: values.prompt ?? null }),
  })

export const updateMasterEmail = (emailId: string, values: MasterEmailFormPayload) =>
  apiClient<MasterEmail>(`/admin/master-data/emails/${encodeURIComponent(emailId)}`, {
    method: 'PUT',
    body: JSON.stringify({ ...values, prompt: values.prompt ?? null }),
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
