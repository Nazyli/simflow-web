function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function documentationHref(href: string): string {
  const trimmed = href.trim()
  const internalMatch = trimmed.match(/^([\w-]+)\.md(#[\w-]+)?$/)
  if (internalMatch) return `/documentation/${internalMatch[1]}${internalMatch[2] ?? ''}`

  if (/^(https?:|mailto:|#)/i.test(trimmed)) return trimmed
  return '#'
}

function renderInline(value: string): string {
  let html = escapeHtml(value)
  const placeholders: string[] = []
  html = html.replace(/\{\w+\}/g, (placeholder) => {
    const marker = `\uE000${placeholders.length}\uE001`
    placeholders.push(placeholder)
    return marker
  })

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt: string) => escapeHtml(alt))
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, href: string) => {
    const safeHref = escapeHtml(documentationHref(href))
    const external = /^(https?:|mailto:)/i.test(href.trim())
    const externalAttributes = external ? ' target="_blank" rel="noreferrer"' : ''
    return `<a href="${safeHref}"${externalAttributes}>${label}</a>`
  })
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>')
  return html.replace(
    /\uE000(\d+)\uE001/g,
    (_match, index: string) => placeholders[Number(index)] ?? '',
  )
}

function isFenceStart(line: string): RegExpMatchArray | null {
  return line.match(/^\s*(```|~~~)\s*([\w-]*)\s*$/)
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line)
}

function tableCells(line: string): string[] {
  const normalized = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return normalized.split('|').map((cell) => cell.trim())
}

function isBlockStart(line: string): boolean {
  return Boolean(
    line.match(/^\s*#{1,6}\s+/) ||
    isFenceStart(line) ||
    line.match(/^\s*[-*+]\s+/) ||
    line.match(/^\s*\d+\.\s+/) ||
    line.match(/^\s*>/) ||
    line.match(/^\s*\|/) ||
    line.match(/^\s*([-*_])(?:\s*\1){2,}\s*$/),
  )
}

function isMermaidDefinition(source: string): boolean {
  return /^\s*(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|journey|gitGraph|mindmap|timeline|quadrantChart|requirementDiagram|C4Context)\b/m.test(
    source,
  )
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n')
  const output: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index].trimEnd()
    if (!line.trim()) {
      index += 1
      continue
    }

    const fence = isFenceStart(line)
    if (fence) {
      const fenceMarker = fence[1]
      const language = fence[2]
      const code: string[] = []
      index += 1
      while (index < lines.length && !lines[index].trim().startsWith(fenceMarker)) {
        code.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      const rawSource = code.join('\n')
      const source = escapeHtml(rawSource)
      if (language.toLowerCase() === 'mermaid' || isMermaidDefinition(rawSource)) {
        output.push(`<div class="mermaid-diagram" data-mermaid>${source}</div>`)
      } else {
        const className = language ? ` class="language-${escapeHtml(language)}"` : ''
        output.push(`<pre><code${className}>${source}</code></pre>`)
      }
      continue
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (heading) {
      const level = heading[1].length
      const content = renderInline(heading[2])
      output.push(`<h${level}>${content}</h${level}>`)
      index += 1
      continue
    }

    if (line.match(/^\s*([-*_])(?:\s*\1){2,}\s*$/)) {
      output.push('<hr>')
      index += 1
      continue
    }

    if (line.startsWith('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const headers = tableCells(line)
      const rows: string[][] = []
      index += 2
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(tableCells(lines[index]))
        index += 1
      }
      output.push(
        `<table><thead><tr>${headers.map((cell) => `<th>${renderInline(cell)}</th>`).join('')}</tr></thead><tbody>${rows
          .map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table>`,
      )
      continue
    }

    const unordered = line.match(/^\s*[-*+]\s+(.+)$/)
    if (unordered) {
      const items: string[] = []
      while (index < lines.length) {
        const item = lines[index].match(/^\s*[-*+]\s+(.+)$/)
        if (!item) break
        items.push(`<li>${renderInline(item[1])}</li>`)
        index += 1
      }
      output.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    const ordered = line.match(/^\s*\d+\.\s+(.+)$/)
    if (ordered) {
      const items: string[] = []
      while (index < lines.length) {
        const item = lines[index].match(/^\s*\d+\.\s+(.+)$/)
        if (!item) break
        items.push(`<li>${renderInline(item[1])}</li>`)
        index += 1
      }
      output.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    if (line.startsWith('>')) {
      const quoteLines: string[] = []
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''))
        index += 1
      }
      output.push(`<blockquote><p>${renderInline(quoteLines.join(' '))}</p></blockquote>`)
      continue
    }

    const paragraph: string[] = [line.trim()]
    index += 1
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    output.push(`<p>${renderInline(paragraph.join(' '))}</p>`)
  }

  return output.join('\n')
}
