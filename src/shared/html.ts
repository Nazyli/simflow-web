const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
])

const HTML_DETECTION_PATTERN =
  /<\/?(p|div|br|span|strong|em|ul|ol|li|a|h[1-6]|blockquote|table|b|i|u|hr|pre|code)[\s>/]/i

export function isHtmlContent(content: string): boolean {
  return HTML_DETECTION_PATTERN.test(content)
}

function isSafeHref(href: string): boolean {
  const normalized = href.trim().toLowerCase()
  return (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('mailto:')
  )
}

function sanitizeElement(element: Element): void {
  for (const child of Array.from(element.children)) {
    sanitizeElement(child)
  }

  const tagName = element.tagName.toLowerCase()
  if (!ALLOWED_TAGS.has(tagName)) {
    const parent = element.parentNode
    if (!parent) return
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element)
    }
    parent.removeChild(element)
    return
  }

  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLowerCase()
    if (name.startsWith('on') || name === 'style' || name === 'class' || name === 'id') {
      element.removeAttribute(attribute.name)
      continue
    }
    if (tagName === 'a' && name === 'href') {
      if (!isSafeHref(attribute.value)) {
        element.removeAttribute(attribute.name)
      }
      continue
    }
    if (tagName !== 'a' && (name === 'href' || name === 'src')) {
      element.removeAttribute(attribute.name)
    }
  }

  if (tagName === 'a') {
    element.setAttribute('target', '_blank')
    element.setAttribute('rel', 'noopener noreferrer')
  }
}

export function sanitizeHtml(dirty: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${dirty}</div>`, 'text/html')
  const container = doc.body.firstElementChild ?? doc.body
  sanitizeElement(container)
  return container.innerHTML
}

export function stripHtmlToText(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const text = doc.body.textContent ?? ''
  return text.replace(/\s+/g, ' ').trim()
}
