export interface EmailMessage {
  to: string[]
  cc: string[]
  from: string
  actor: string
  channel: 'email'
  emailId: string | null
  messageId?: string
  sessionId?: string
  subject: string
  content: string
  timestamp: string
  actionType: string
  simulationLabel?: string
  simulationId?: string
  isUnread?: boolean
  attachments: EmailAttachment[]
}

export interface EmailAttachment {
  emailAttachmentId: string
  participantEmailId: string
  participantDocId: string | null
  masterAttachmentId: string | null
  documentId: string | null
  fileName: string | null
  isHighlight: boolean
  ownerName: string | null
  openedAt: string | null
  modifiedDate: string | null
  contents: EmailAttachmentContent[]
}

export interface EmailAttachmentContent {
  participantAttachmentEmailId: string
  emailAttachmentId: string
  participantDocContentId: string | null
  page: number | null
  content: string | null
  isHighlight: boolean
  ownerName: string | null
}

export function sortAttachmentPreviewPages<T extends EmailAttachmentContent>(
  contents: readonly T[],
): T[] {
  return [...contents].sort((first, second) => {
    const firstPage = first.page ?? Number.MAX_SAFE_INTEGER
    const secondPage = second.page ?? Number.MAX_SAFE_INTEGER
    return (
      firstPage - secondPage ||
      first.participantAttachmentEmailId.localeCompare(second.participantAttachmentEmailId)
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
