import type { MasterPrompt } from '../../../shared/api/master-data'

export interface PromptFormValues {
  content: string
}

export function emptyPromptForm(): PromptFormValues {
  return { content: '' }
}

export function promptDialogInitialForm(
  selectedPromptId: string | undefined,
  records: MasterPrompt[],
): PromptFormValues {
  if (!selectedPromptId) return emptyPromptForm()
  const selectedPrompt = records.find((record) => record.promptId === selectedPromptId)
  return selectedPrompt
    ? { content: selectedPrompt.content ?? '' }
    : emptyPromptForm()
}

export function validatePromptForm(values: PromptFormValues): string | null {
  if (!values.content.trim()) return 'Enter prompt content.'
  return null
}
