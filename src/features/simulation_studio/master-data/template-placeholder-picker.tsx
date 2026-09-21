import {
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type RefObject,
  type UIEvent,
} from 'react'

import { Button } from '../../../components/ui/button'
import { Textarea } from '../../../components/ui/textarea'
import type { TemplatePlaceholder } from '../../../shared/types/simulation'
import {
  insertTemplatePlaceholder,
  placeholderRangeForDeletion,
  tokenizeTemplate,
  type TemplateToken,
} from './template-placeholder-logic'

export function TemplatePlaceholderPicker({
  placeholders,
  disabled = false,
  onSelect,
}: {
  placeholders: TemplatePlaceholder[]
  disabled?: boolean
  onSelect: (placeholder: TemplatePlaceholder) => void
}) {
  if (!placeholders.length) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Insert placeholder">
      <span className="text-muted-foreground mr-1 text-xs">Insert:</span>
      {placeholders.map((placeholder) => (
        <Button
          key={placeholder.name}
          type="button"
          variant="outline"
          size="xs"
          disabled={disabled}
          title={placeholder.description || placeholder.label}
          aria-label={`Insert {${placeholder.name}}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(placeholder)}
        >
          {`{${placeholder.name}}`}
        </Button>
      ))}
    </div>
  )
}

type TemplateTextareaProps = Omit<ComponentProps<typeof Textarea>, 'onChange' | 'value'> & {
  value: string
  placeholders?: TemplatePlaceholder[]
  textareaRef?: RefObject<HTMLTextAreaElement | null>
  onValueChange: (value: string) => void
}

export function TemplateTextarea({
  value,
  placeholders,
  textareaRef: externalTextareaRef,
  onValueChange,
  disabled,
  className,
  onKeyDown,
  onScroll,
  style,
  ...props
}: TemplateTextareaProps) {
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = externalTextareaRef ?? internalTextareaRef
  const highlightRef = useRef<HTMLDivElement>(null)
  const hasContract = placeholders !== undefined
  const allowedNames = placeholders?.map((placeholder) => placeholder.name) ?? []

  function selectPlaceholder(placeholder: TemplatePlaceholder) {
    const textarea = textareaRef.current
    const next = insertTemplatePlaceholder(
      value,
      placeholder.name,
      textarea?.selectionStart,
      textarea?.selectionEnd,
    )
    onValueChange(next.value)
    requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(next.caret, next.caret)
    })
  }

  function syncHighlightScroll(event: UIEvent<HTMLTextAreaElement>) {
    const highlight = highlightRef.current
    if (highlight) {
      highlight.scrollTop = event.currentTarget.scrollTop
      highlight.scrollLeft = event.currentTarget.scrollLeft
    }
    onScroll?.(event)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!event.defaultPrevented && (event.key === 'Backspace' || event.key === 'Delete')) {
      const textarea = event.currentTarget
      if (textarea.selectionStart === textarea.selectionEnd) {
        const range = placeholderRangeForDeletion(value, textarea.selectionStart, event.key)
        if (range) {
          event.preventDefault()
          onValueChange(`${value.slice(0, range.start)}${value.slice(range.end)}`)
          requestAnimationFrame(() => {
            textarea.focus()
            textarea.setSelectionRange(range.start, range.start)
          })
          return
        }
      }
    }
    onKeyDown?.(event)
  }

  return (
    <div className="grid gap-1.5">
      <TemplatePlaceholderPicker
        placeholders={placeholders ?? []}
        disabled={disabled}
        onSelect={selectPlaceholder}
      />
      <div className="relative">
        {hasContract && (
          <TemplateHighlight ref={highlightRef} value={value} allowedNames={allowedNames} />
        )}
        <Textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          className={[className, hasContract && 'relative z-10 bg-transparent text-transparent']
            .filter(Boolean)
            .join(' ')}
          style={hasContract ? { ...style, caretColor: 'var(--foreground)' } : style}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncHighlightScroll}
          {...props}
        />
      </div>
    </div>
  )
}

function TemplateHighlight({
  value,
  allowedNames,
  ref,
}: {
  value: string
  allowedNames: string[]
  ref: RefObject<HTMLDivElement | null>
}) {
  const tokens = tokenizeTemplate(value, allowedNames)
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="text-foreground pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-lg border border-transparent px-2.5 py-2 text-base break-words whitespace-pre-wrap md:text-sm"
    >
      {tokens.map((token, index) => (
        <span key={`${token.text}-${index}`} className={tokenClass(token)}>
          {token.text}
        </span>
      ))}
    </div>
  )
}

function tokenClass(token: TemplateToken): string {
  if (token.kind === 'valid') return 'text-blue-600 dark:text-blue-400'
  if (token.kind === 'invalid') return 'text-red-600 dark:text-red-400'
  return 'text-foreground'
}
