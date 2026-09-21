import { tokenizeTemplate } from './template-placeholder-logic'

export function buildEmailPreviewDocument(content: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email preview</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; }
      body {
        background: #f8fafc;
        color: #0f172a;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        padding: 24px;
      }
      .email-preview-shell {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        margin: 0 auto;
        max-width: 680px;
        min-height: 180px;
        overflow: auto;
        padding: 24px;
      }
      .email-preview-content img { max-width: 100%; height: auto; }
      .email-preview-content table { max-width: 100%; }
      .email-preview-content a { color: #2563eb; }
    </style>
  </head>
  <body>
    <main class="email-preview-shell">
      <div class="email-preview-content">${content}</div>
    </main>
  </body>
</html>`
}

export function highlightEmailTemplateTokens(html: string, allowedNames: string[]): string {
  if (!html || typeof DOMParser === 'undefined') return html

  const document = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const container = document.body.firstElementChild
  if (!container) return html

  for (const element of Array.from(
    container.querySelectorAll('script, iframe, object, embed, form, base'),
  )) {
    element.remove()
  }

  for (const element of Array.from(container.querySelectorAll('*'))) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim().toLowerCase()
      if (
        name.startsWith('on') ||
        ((name === 'href' || name === 'src') && value.startsWith('javascript:'))
      ) {
        element.removeAttribute(attribute.name)
      }
    }
  }

  highlightTextNodes(container, allowedNames)
  return container.innerHTML
}

function highlightTextNodes(node: Node, allowedNames: string[]): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const tokens = tokenizeTemplate(child.textContent ?? '', allowedNames)
      if (tokens.some((token) => token.kind !== 'text')) {
        const ownerDocument = child.ownerDocument
        if (!ownerDocument) continue
        const fragment = ownerDocument.createDocumentFragment()
        for (const token of tokens) {
          if (token.kind === 'text') {
            fragment.appendChild(ownerDocument.createTextNode(token.text))
            continue
          }
          const marker = ownerDocument.createElement('span')
          marker.textContent = token.text
          marker.style.color = token.kind === 'valid' ? '#2563eb' : '#dc2626'
          marker.style.fontWeight = '600'
          fragment.appendChild(marker)
        }
        child.parentNode?.replaceChild(fragment, child)
      }
      continue
    }

    if (child.nodeType === Node.ELEMENT_NODE) {
      const tagName = (child as Element).tagName.toLowerCase()
      if (tagName !== 'script' && tagName !== 'style') {
        highlightTextNodes(child, allowedNames)
      }
    }
  }
}
