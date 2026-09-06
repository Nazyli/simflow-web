export interface EmailMessage {
  to: string[]
  cc: string[]
  from: string
  actor: string
  channel: 'email'
  email_id: string | null
  message_id?: string
  session_id?: string
  subject: string
  content: string
  timestamp: string
  action_type: string
  simulation_label?: string
  simulation_id?: string
  is_unread?: boolean
  attachments: EmailAttachment[]
}

export interface EmailAttachment {
  email_attachment_id: string
  participant_email_id: string
  participant_doc_id: string | null
  master_attachment_id: string | null
  document_id: string | null
  file_name: string | null
  is_highlight: boolean
  owner_name: string | null
  opened_at: string | null
  modified_date: string | null
  contents: EmailAttachmentContent[]
}

export interface EmailAttachmentContent {
  participant_attachment_email_id: string
  email_attachment_id: string
  participant_doc_content_id: string | null
  page: number | null
  content: string | null
  is_highlight: boolean
  owner_name: string | null
}

export function sortAttachmentPreviewPages<T extends EmailAttachmentContent>(
  contents: readonly T[],
): T[] {
  return [...contents].sort((first, second) => {
    const firstPage = first.page ?? Number.MAX_SAFE_INTEGER
    const secondPage = second.page ?? Number.MAX_SAFE_INTEGER
    return (
      firstPage - secondPage ||
      first.participant_attachment_email_id.localeCompare(second.participant_attachment_email_id)
    )
  })
}

/**
 * Builds a compact page label from an attachment's contents, e.g. "p.1",
 * "p.1–3", or "p.1, 3, 5". Returns null when no page is available.
 */
export function formatAttachmentPageLabel(
  contents: readonly EmailAttachmentContent[],
): string | null {
  const pages = contents
    .map((content) => content.page)
    .filter((page): page is number => page != null)
    .sort((first, second) => first - second)

  if (pages.length === 0) return null

  const uniquePages = [...new Set(pages)]
  if (uniquePages.length === 1) {
    return `p.${uniquePages[0]}`
  }

  const ranges: string[] = []
  let rangeStart = uniquePages[0]
  let previous = uniquePages[0]
  for (let index = 1; index < uniquePages.length; index++) {
    const current = uniquePages[index]
    if (current === previous + 1) {
      previous = current
      continue
    }
    ranges.push(rangeStart === previous ? `${rangeStart}` : `${rangeStart}–${previous}`)
    rangeStart = current
    previous = current
  }
  ranges.push(rangeStart === previous ? `${rangeStart}` : `${rangeStart}–${previous}`)

  return `p.${ranges.join(', ')}`
}

export interface EmailSimulation {
  simulationId: string
  groupSimulationName: string
  simulationName: string | null
  status: string
  unreadCount: number
}

export interface EmailInboxThread {
  rootId: string
  latestSenderId: string
  latestSenderType: string
  latestSubject: string
  latestContent: string
  latestIsRead: boolean
  latestCreatedDate: string
  unreadCount: number
  messageCount: number
  simulationId: string | null
}
