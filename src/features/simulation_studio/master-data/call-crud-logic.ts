import type { MasterCall } from '../../../shared/api/master-data'

export interface CallFormValues {
  actorId: string
  content: string
  prompt: string
}

export function emptyCallForm(): CallFormValues {
  return { actorId: '', content: '', prompt: '' }
}

export function callDialogInitialForm(
  selectedCallId: string | undefined,
  records: MasterCall[],
): CallFormValues {
  if (!selectedCallId) return emptyCallForm()
  const selectedCall = records.find((record) => record.callId === selectedCallId)
  return selectedCall
    ? {
        actorId: selectedCall.actorId ?? '',
        content: selectedCall.content ?? '',
        prompt: (selectedCall as MasterCall & { prompt?: string | null }).prompt ?? '',
      }
    : emptyCallForm()
}

export function validateCallForm(values: CallFormValues): string | null {
  if (!values.actorId.trim()) return 'Select an actor.'
  if (!values.content.trim()) return 'Enter call content.'
  return null
}
