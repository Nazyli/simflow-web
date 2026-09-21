import { useEffect, useRef, useState, type MouseEvent } from 'react'

import { Button } from '../../../components/ui/button'
import type { TemplatePlaceholder } from '../../../shared/types/simulation'
import {
  buildEmailPreviewDocument,
  highlightEmailTemplateTokens,
} from './email-content-editor-logic'
import { TemplatePlaceholderPicker, TemplateTextarea } from './template-placeholder-picker'

type EmailContentEditorMode = 'visual' | 'html' | 'preview'

const EDITOR_MODES: Array<{ id: EmailContentEditorMode; label: string }> = [
  { id: 'visual', label: 'Visual' },
  { id: 'html', label: 'HTML' },
  { id: 'preview', label: 'Preview' },
]

export function EmailContentEditor({
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
  const [mode, setMode] = useState<EmailContentEditorMode>('visual')
  const visualEditorRef = useRef<HTMLDivElement>(null)
  const allowedPlaceholderNames = placeholders?.map((placeholder) => placeholder.name) ?? []

  useEffect(() => {
    if (mode !== 'visual' || !visualEditorRef.current) return
    if (visualEditorRef.current.innerHTML !== value) {
      visualEditorRef.current.innerHTML = value
    }
  }, [mode, value])

  function syncVisualValue() {
    const nextValue = visualEditorRef.current?.innerHTML ?? ''
    if (nextValue !== value) onValueChange(nextValue)
  }

  function applyCommand(command: string, commandValue?: string) {
    if (disabled || !visualEditorRef.current) return
    visualEditorRef.current.focus()
    document.execCommand(command, false, commandValue)
    syncVisualValue()
  }

  function insertPlaceholder(placeholder: TemplatePlaceholder) {
    const editor = visualEditorRef.current
    if (!editor) return

    const selection = window.getSelection()
    const range = document.createRange()
    const hasEditorSelection =
      selection &&
      selection.rangeCount > 0 &&
      editor.contains(selection.anchorNode) &&
      editor.contains(selection.focusNode)

    if (hasEditorSelection) {
      range.setStart(selection.getRangeAt(0).startContainer, selection.getRangeAt(0).startOffset)
      range.setEnd(selection.getRangeAt(0).endContainer, selection.getRangeAt(0).endOffset)
    } else {
      range.selectNodeContents(editor)
      range.collapse(false)
    }

    range.deleteContents()
    const token = document.createTextNode(`{${placeholder.name}}`)
    range.insertNode(token)
    range.setStartAfter(token)
    range.collapse(true)
    selection?.removeAllRanges()
    selection?.addRange(range)
    editor.focus()
    syncVisualValue()
  }

  function handleLinkCommand(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (disabled || !visualEditorRef.current) return
    const url = window.prompt('URL')
    if (url?.trim()) applyCommand('createLink', url.trim())
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-slate-50/80 p-1">
        <div
          className="flex items-center gap-1"
          role="tablist"
          aria-label="Email content editor mode"
        >
          {EDITOR_MODES.map((editorMode) => (
            <Button
              key={editorMode.id}
              type="button"
              role="tab"
              aria-selected={mode === editorMode.id}
              variant={mode === editorMode.id ? 'secondary' : 'ghost'}
              size="sm"
              disabled={disabled}
              onClick={() => setMode(editorMode.id)}
            >
              {editorMode.label}
            </Button>
          ))}
        </div>
        {mode === 'visual' && (
          <div className="flex flex-wrap items-center gap-1" aria-label="Email formatting toolbar">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label="Bold"
              title="Bold"
              disabled={disabled}
              onMouseDown={(event) => {
                event.preventDefault()
                applyCommand('bold')
              }}
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
              onMouseDown={(event) => {
                event.preventDefault()
                applyCommand('italic')
              }}
            >
              <em>I</em>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label="Underline"
              title="Underline"
              disabled={disabled}
              onMouseDown={(event) => {
                event.preventDefault()
                applyCommand('underline')
              }}
            >
              <u>U</u>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label="Heading"
              title="Heading"
              disabled={disabled}
              onMouseDown={(event) => {
                event.preventDefault()
                applyCommand('formatBlock', 'h3')
              }}
            >
              H
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label="Bulleted list"
              title="Bulleted list"
              disabled={disabled}
              onMouseDown={(event) => {
                event.preventDefault()
                applyCommand('insertUnorderedList')
              }}
            >
              • List
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label="Add link"
              title="Add link"
              disabled={disabled}
              onMouseDown={handleLinkCommand}
            >
              Link
            </Button>
          </div>
        )}
      </div>

      {mode === 'visual' && (
        <>
          <TemplatePlaceholderPicker
            placeholders={placeholders ?? []}
            disabled={disabled}
            onSelect={insertPlaceholder}
          />
          <div className="border-input bg-background relative min-h-56 rounded-lg border">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 min-h-56 overflow-hidden px-3 py-2 text-sm leading-6"
              dangerouslySetInnerHTML={{
                __html: highlightEmailTemplateTokens(value, allowedPlaceholderNames),
              }}
            />
            <div
              ref={visualEditorRef}
              id={id}
              role="textbox"
              aria-label="Visual email content"
              aria-multiline="true"
              contentEditable={!disabled}
              suppressContentEditableWarning
              data-placeholder="Write the email content..."
              className="focus-visible:border-ring focus-visible:ring-ring/50 empty:before:text-muted-foreground relative z-10 min-h-56 bg-transparent px-3 py-2 text-sm leading-6 text-transparent transition-colors outline-none empty:before:content-[attr(data-placeholder)] focus-visible:ring-3 [&_*]:!text-transparent"
              style={{ caretColor: 'var(--foreground)' }}
              onInput={syncVisualValue}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Use HTML mode for complex layouts, tables, or inline email styles.
          </p>
        </>
      )}

      {mode === 'html' && (
        <TemplateTextarea
          id={id}
          rows={12}
          disabled={disabled}
          value={value}
          placeholders={placeholders}
          onValueChange={onValueChange}
        />
      )}

      {mode === 'preview' && (
        <iframe
          title="Email preview"
          sandbox=""
          srcDoc={buildEmailPreviewDocument(value)}
          className="h-80 w-full rounded-lg border bg-slate-50"
        />
      )}
    </div>
  )
}
