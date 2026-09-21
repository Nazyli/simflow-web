import { renderMarkdown } from '../../documentation/markdown'

export function renderPromptPreview(markdown: string): string {
  return renderMarkdown(markdown)
}
