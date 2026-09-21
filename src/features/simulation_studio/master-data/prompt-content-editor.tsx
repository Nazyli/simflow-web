import { useRef, useState, type MouseEvent } from 'react'

import { Button } from '../../../components/ui/button'
import { RICH_TEXT_CLASS, SafeHtml } from '../../../shared/safe-html'
import type { TemplatePlaceholder } from '../../../shared/types/simulation'
import { renderMarkdown } from '../../documentation/markdown'
import { insertMarkdownSnippet } from './prompt-content-editor-logic'
import { TemplateTextarea } from './template-placeholder-picker'

type PromptContentEditorMode = 'markdown' | 'preview'

export function PromptContentEditor({
  id,
  value,
  placeholders,
  disabled = false,
  onValueChange,
}: {
  id?: string
  value: string
  placeholders?: TemplatePlaceholder[]
  disabled?: boolean
  onValueChange: (value: string) => void
}) {
  const [mode, setMode] = useState<PromptContentEditorMode>('markdown')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function insertSnippet(prefix: string, suffix: string, fallbackText: string) {
    const textarea = textareaRef.current
    const result = insertMarkdownSnippet(
      value,
      textarea?.selectionStart,
      textarea?.selectionEnd,
      prefix,
      suffix,
      fallbackText,
    )
    onValueChange(result.value)
    requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(result.selectionStart, result.selectionEnd)
    })
  }

  function handleToolbarMouseDown(
    event: MouseEvent<HTMLButtonElement>,
    prefix: string,
    suffix: string,
    fallbackText: string,
  ) {
    event.preventDefault()
    if (!disabled) insertSnippet(prefix, suffix, fallbackText)
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-slate-50/80 p-1">
        <div
          className="flex items-center gap-1"
          role="tablist"
          aria-label="Prompt content editor mode"
        >
          <Button
            type="button"
            role="tab"
            aria-selected={mode === 'markdown'}
            variant={mode === 'markdown' ? 'secondary' : 'ghost'}
            size="sm"
            disabled={disabled}
            onClick={() => setMode('markdown')}
          >
            Markdown
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={mode === 'preview'}
            variant={mode === 'preview' ? 'secondary' : 'ghost'}
            size="sm"
            disabled={disabled}
            onClick={() => setMode('preview')}
          >
            Preview
          </Button>
        </div>
        {mode === 'markdown' && (
          <div
            className="flex flex-wrap items-center gap-1"
            aria-label="Markdown formatting toolbar"
          >
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label="Heading"
              title="Heading"
              disabled={disabled}
              onMouseDown={(event) => handleToolbarMouseDown(event, '# ', '', 'Heading')}
            >
              H1
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label="Bold"
              title="Bold"
              disabled={disabled}
              onMouseDown={(event) => handleToolbarMouseDown(event, '**', '**', 'bold text')}
            >
              <strong>B</strong>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label="Italic"
              title="Italic"
              disabled={disabled}
              onMouseDown={(event) => handleToolbarMouseDown(event, '*', '*', 'italic text')}
            >
              <em>I</em>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label="Bullet list"
              title="Bullet list"
              disabled={disabled}
              onMouseDown={(event) => handleToolbarMouseDown(event, '- ', '', 'list item')}
            >
              • List
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label="Code block"
              title="Code block"
              disabled={disabled}
              onMouseDown={(event) => handleToolbarMouseDown(event, '```\n', '\n```', 'code')}
            >
              Code
            </Button>
          </div>
        )}
      </div>

      {mode === 'markdown' && (
        <TemplateTextarea
          id={id}
          rows={14}
          disabled={disabled}
          value={value}
          placeholders={placeholders}
          textareaRef={textareaRef}
          placeholder="Write the prompt in Markdown..."
          onValueChange={onValueChange}
        />
      )}

      {mode === 'preview' && (
        <div className="bg-background min-h-56 rounded-lg border px-4 py-3">
          {value.trim() ? (
            <SafeHtml html={renderMarkdown(value)} className={RICH_TEXT_CLASS} />
          ) : (
            <p className="text-muted-foreground text-sm">Nothing to preview yet.</p>
          )}
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        Markdown is saved as-is. Preview only changes how the prompt is displayed here.
      </p>
    </div>
  )
}
