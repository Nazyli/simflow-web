import type { MasterEmail } from '../../../shared/api/master-data'

export type EmailType = 'original' | 'reply'

export interface EmailFormValues {
  actorFrom: string
  actorTo: string
  actorCc: string
  emailType: EmailType
  parentMasterEmailId: string
  subject: string
  content: string
  docContentIds: string[]
  prompt: string
}

export function emptyEmailForm(): EmailFormValues {
  return {
    actorFrom: '',
    actorTo: '',
    actorCc: '',
    emailType: 'original',
    parentMasterEmailId: '',
    subject: '',
    content: '',
    docContentIds: [],
    prompt: '',
  }
}

export function emailDialogInitialForm(
  selectedEmailId: string | undefined,
  records: MasterEmail[],
): EmailFormValues {
  if (!selectedEmailId) return emptyEmailForm()
  const email = records.find((record) => record.emailId === selectedEmailId)
  if (!email) return emptyEmailForm()
  return {
    actorFrom: email.actorFrom ?? '',
    actorTo: email.actorTo ?? '',
    actorCc: email.actorCc ?? '',
    emailType: email.emailType === 'reply' ? 'reply' : 'original',
    parentMasterEmailId: email.parentMasterEmailId ?? '',
    subject: email.subject ?? '',
    content: email.content ?? '',
    docContentIds: email.attachments
      .map((attachment) => attachment.docContentId)
      .filter((id): id is string => Boolean(id)),
    prompt: (email as MasterEmail & { prompt?: string | null }).prompt ?? '',
  }
}

export function validateEmailForm(values: EmailFormValues): string | null {
  if (!values.actorFrom.trim()) return 'Select the sender actor.'
  if (!values.actorTo.trim()) return 'Select the recipient actor.'
  if (values.emailType !== 'original' && values.emailType !== 'reply') {
    return 'Select a valid email type.'
  }
  if (values.emailType === 'reply' && !values.parentMasterEmailId.trim()) {
    return 'Select the original email for this reply.'
  }
  if (!values.subject.trim()) return 'Enter an email subject.'
  if (!values.content.trim()) return 'Enter email content.'
  return null
}

export function toggleEmailAttachment(ids: string[], id: string, checked: boolean): string[] {
  if (checked) return ids.includes(id) ? ids : [...ids, id]
  return ids.filter((item) => item !== id)
}
