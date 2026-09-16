import type { MasterChat } from '../../../shared/api/master-data'

export interface ChatFormValues {
  actorId: string
  content: string
  prompt: string
}

export function emptyChatForm(): ChatFormValues {
  return { actorId: '', content: '', prompt: '' }
}

export function chatFormFromRecord(record: MasterChat): ChatFormValues {
  return {
    actorId: record.actorId ?? '',
    content: record.content ?? '',
    prompt: (record as MasterChat & { prompt?: string | null }).prompt ?? '',
  }
}

export function chatDialogInitialForm(
  selectedChatId: string | undefined,
  records: MasterChat[],
): ChatFormValues {
  if (!selectedChatId) return emptyChatForm()
  const selectedChat = records.find((record) => record.chatId === selectedChatId)
  return selectedChat ? chatFormFromRecord(selectedChat) : emptyChatForm()
}

export function validateChatForm(values: ChatFormValues): string | null {
  if (!values.actorId.trim()) return 'Select an actor.'
  if (!values.content.trim()) return 'Enter chat content.'
  return null
}
