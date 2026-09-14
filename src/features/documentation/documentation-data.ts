export type DocumentationSectionId = 'getting-started' | 'nodes' | 'references'

export interface DocumentationEntry {
  slug: string
  file: string
  title: string
  section: DocumentationSectionId
}

export interface DocumentationSection {
  id: DocumentationSectionId
  label: string
  entries: DocumentationEntry[]
}

export type DocumentationMatch = 'title' | 'content'

export interface DocumentationSearchResult {
  entry: DocumentationEntry
  match: DocumentationMatch
  snippet?: string
}

export const DOCUMENTATION_ENTRIES: DocumentationEntry[] = [
  { slug: '00-index', file: '00-index.md', title: 'Overview', section: 'getting-started' },
  {
    slug: '01-pengenalan',
    file: '01-pengenalan.md',
    title: 'Pengenalan',
    section: 'getting-started',
  },
  {
    slug: '02-node-catalog',
    file: '02-node-catalog.md',
    title: 'Node Catalog',
    section: 'getting-started',
  },
  { slug: '03-start', file: '03-start.md', title: 'Start', section: 'nodes' },
  { slug: '04-send-chat', file: '04-send-chat.md', title: 'Send Chat', section: 'nodes' },
  { slug: '05-send-email', file: '05-send-email.md', title: 'Send Email', section: 'nodes' },
  { slug: '06-add-document', file: '06-add-document.md', title: 'Add Document', section: 'nodes' },
  {
    slug: '07-open-document',
    file: '07-open-document.md',
    title: 'Open Document',
    section: 'nodes',
  },
  {
    slug: '08-wait-for-reply',
    file: '08-wait-for-reply.md',
    title: 'Wait for Reply',
    section: 'nodes',
  },
  {
    slug: '09-wait-for-read',
    file: '09-wait-for-read.md',
    title: 'Wait for Read',
    section: 'nodes',
  },
  {
    slug: '10-check-reply-attachment',
    file: '10-check-reply-attachment.md',
    title: 'Check Reply Attachment',
    section: 'nodes',
  },
  {
    slug: '11-wait-for-attachment-open',
    file: '11-wait-for-attachment-open.md',
    title: 'Wait for Attachment Open',
    section: 'nodes',
  },
  {
    slug: '12-ai-classification',
    file: '12-ai-classification.md',
    title: 'AI Classification',
    section: 'nodes',
  },
  {
    slug: '13-invite-to-call',
    file: '13-invite-to-call.md',
    title: 'Invite to Call',
    section: 'nodes',
  },
  { slug: '14-start-call', file: '14-start-call.md', title: 'Start Call', section: 'nodes' },
  {
    slug: '15-send-call-speech',
    file: '15-send-call-speech.md',
    title: 'Send Call Speech',
    section: 'nodes',
  },
  {
    slug: '16-wait-for-call-utterance',
    file: '16-wait-for-call-utterance.md',
    title: 'Wait for Call Utterance',
    section: 'nodes',
  },
  {
    slug: '17-wait-for-call-end',
    file: '17-wait-for-call-end.md',
    title: 'Wait for Call End',
    section: 'nodes',
  },
  { slug: '18-end-call', file: '18-end-call.md', title: 'End Call', section: 'nodes' },
  {
    slug: '19-conversation-group',
    file: '19-conversation-group.md',
    title: 'Conversation Group',
    section: 'nodes',
  },
  { slug: '20-loop', file: '20-loop.md', title: 'Loop', section: 'nodes' },
  { slug: '21-end', file: '21-end.md', title: 'End', section: 'nodes' },
  {
    slug: '30-port-reference',
    file: '30-port-reference.md',
    title: 'Port Reference',
    section: 'references',
  },
  {
    slug: '31-configuration-reference',
    file: '31-configuration-reference.md',
    title: 'Configuration Reference',
    section: 'references',
  },
  {
    slug: '32-contoh-workflow',
    file: '32-contoh-workflow.md',
    title: 'Contoh Workflow',
    section: 'references',
  },
  {
    slug: '33-troubleshooting',
    file: '33-troubleshooting.md',
    title: 'Troubleshooting',
    section: 'references',
  },
  {
    slug: '34-ringkasan-coverage',
    file: '34-ringkasan-coverage.md',
    title: 'Ringkasan Coverage',
    section: 'references',
  },
]

export function filterDocumentationEntries(
  entries: DocumentationEntry[],
  query: string,
): DocumentationEntry[] {
  return searchDocumentationEntries(entries, query).map((result) => result.entry)
}

export function searchDocumentationEntries(
  entries: DocumentationEntry[],
  query: string,
  contentBySlug: Record<string, string> = {},
): DocumentationSearchResult[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) {
    return entries.map((entry) => ({ entry, match: 'title' as const }))
  }

  return entries.flatMap((entry) => {
    const titleMatches = entry.title.toLocaleLowerCase().includes(normalizedQuery)
    const content = contentBySlug[entry.slug] ?? ''
    const contentIndex = content.toLocaleLowerCase().indexOf(normalizedQuery)
    if (!titleMatches && contentIndex === -1) return []

    return [
      {
        entry,
        match: titleMatches ? ('title' as const) : ('content' as const),
        snippet:
          contentIndex === -1
            ? undefined
            : createSearchSnippet(content, contentIndex, normalizedQuery.length),
      },
    ]
  })
}

export function highlightSearchText(
  text: string,
  query: string,
): Array<{ text: string; highlighted: boolean }> {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return [{ text, highlighted: false }]

  const parts: Array<{ text: string; highlighted: boolean }> = []
  const normalizedText = text.toLocaleLowerCase()
  let cursor = 0
  let matchIndex = normalizedText.indexOf(normalizedQuery, cursor)

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      parts.push({ text: text.slice(cursor, matchIndex), highlighted: false })
    }
    parts.push({
      text: text.slice(matchIndex, matchIndex + normalizedQuery.length),
      highlighted: true,
    })
    cursor = matchIndex + normalizedQuery.length
    matchIndex = normalizedText.indexOf(normalizedQuery, cursor)
  }

  if (cursor < text.length) parts.push({ text: text.slice(cursor), highlighted: false })
  return parts.length > 0 ? parts : [{ text, highlighted: false }]
}

function createSearchSnippet(content: string, matchIndex: number, queryLength: number): string {
  const contextLength = 48
  const start = Math.max(0, matchIndex - contextLength)
  const end = Math.min(content.length, matchIndex + queryLength + contextLength)
  const snippet = content.slice(start, end).replace(/\s+/g, ' ').trim()
  return `${start > 0 ? '…' : ''}${snippet}${end < content.length ? '…' : ''}`
}

const DOCUMENTATION_SECTION_DEFINITIONS: Array<Pick<DocumentationSection, 'id' | 'label'>> = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'nodes', label: 'Nodes' },
  { id: 'references', label: 'References' },
]

export const DOCUMENTATION_SECTIONS: DocumentationSection[] = DOCUMENTATION_SECTION_DEFINITIONS.map(
  (section) => ({
    ...section,
    entries: DOCUMENTATION_ENTRIES.filter((entry) => entry.section === section.id),
  }),
)

export function getDocumentationEntry(slug: string | undefined): DocumentationEntry | undefined {
  return DOCUMENTATION_ENTRIES.find((entry) => entry.slug === slug)
}

export function getDocumentationUrl(entry: DocumentationEntry | undefined): string {
  return entry ? `/documentation/${entry.file}` : '/documentation/00-index.md'
}
