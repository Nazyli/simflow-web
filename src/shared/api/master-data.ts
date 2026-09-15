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

export interface MasterChat {
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

export interface MasterCall {
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

export interface MasterPrompt {
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
  apiClient<MasterEmailDetail>(`/admin/master-data/emails/${encodeURIComponent(emailId)}`)

export interface MasterActor {
  actorId: string
  actorName: string
  actorEmail?: string | null
  actorPosition?: string | null
  [key: string]: unknown
}

export const getMasterActors = () => apiClient<MasterActor[]>('/admin/master-data/actors')
