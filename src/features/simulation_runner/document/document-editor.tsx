import {
  Bold,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Save,
  Underline,
  Undo2,
  X,
} from 'lucide-react'
import { useEffect, useRef, type MouseEvent } from 'react'

import { Button } from '../../../components/ui/button'
import { inputClass } from '../../../shared/form-classes'
import {
  isDocumentDraftDirty,
  updateDraftPage,
  type DocumentEditorDraft,
} from './document-editor-logic'
import { canSaveDocumentEditor, editorSaveStatus, updateEditorName } from './document-editor-ui-logic'

export function DocumentEditor({
  draft,
  savedDraft,
  mode,
  disabled = false,
  isSaving = false,
  error = null,
  onChange,
  onSave,
  onCancel,
}: {
  draft: DocumentEditorDraft
  savedDraft: DocumentEditorDraft
  mode: 'create' | 'edit'
  disabled?: boolean
  isSaving?: boolean
  error?: string | null
  onChange: (draft: DocumentEditorDraft) => void
  onSave: () => void
  onCancel: () => void
}) {
  const editorRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const activeEditorRef = useRef<HTMLDivElement | null>(null)
  const isDirty = isDocumentDraftDirty(draft, savedDraft)
  const saveDisabled = disabled || isSaving || !isDirty || !canSaveDocumentEditor(draft, isSaving)

  useEffect(() => {
    for (const page of draft.contents) {
      const editor = editorRefs.current[page.page]
      if (editor && editor.innerHTML !== page.content) editor.innerHTML = page.content
    }
  }, [draft])

  function applyCommand(command: string, value?: string) {
    if (disabled || isSaving || !activeEditorRef.current) return
    activeEditorRef.current.focus()
    document.execCommand(command, false, value)
    const page = Number(activeEditorRef.current.dataset.page)
    onChange(updateDraftPage(draft, page, activeEditorRef.current.innerHTML))
  }

  function handleLinkMouseDown(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (disabled || isSaving) return
    const url = window.prompt('URL')
    if (url?.trim()) applyCommand('createLink', url.trim())
  }

  function handlePageInput(page: number, content: string) {
    onChange(updateDraftPage(draft, page, content))
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f6f8fb]">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">
              Document name
            </span>
            <input
              className={`${inputClass} !h-9 !rounded-md text-sm`}
              value={draft.documentName}
              disabled={disabled || isSaving}
              onChange={(event) => onChange(updateEditorName(draft, event.target.value))}
              placeholder="Untitled document"
              aria-label="Document name"
            />
          </label>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs ${error ? 'text-rose-600' : isDirty ? 'text-amber-700' : 'text-slate-500'}`}
              role={error ? 'alert' : 'status'}
            >
              {editorSaveStatus({ isSaving, isDirty, error })}
            </span>
            <Button type="button" variant="ghost" size="sm" disabled={disabled || isSaving} onClick={onCancel}>
              <X size={14} />
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={saveDisabled} onClick={onSave}>
              <Save size={14} />
              {mode === 'create' ? 'Create document' : 'Save changes'}
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
          <ToolbarButton label="Bold" onMouseDown={(event) => { event.preventDefault(); applyCommand('bold') }}>
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton label="Italic" onMouseDown={(event) => { event.preventDefault(); applyCommand('italic') }}>
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton label="Underline" onMouseDown={(event) => { event.preventDefault(); applyCommand('underline') }}>
            <Underline size={14} />
          </ToolbarButton>
          <ToolbarButton label="Heading" onMouseDown={(event) => { event.preventDefault(); applyCommand('formatBlock', 'h2') }}>
            <Heading3 size={14} />
          </ToolbarButton>
          <ToolbarButton label="Bulleted list" onMouseDown={(event) => { event.preventDefault(); applyCommand('insertUnorderedList') }}>
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton label="Numbered list" onMouseDown={(event) => { event.preventDefault(); applyCommand('insertOrderedList') }}>
            <ListOrdered size={14} />
          </ToolbarButton>
          <ToolbarButton label="Add link" onMouseDown={handleLinkMouseDown}>
            <Link2 size={14} />
          </ToolbarButton>
          <span className="mx-1 h-4 w-px bg-slate-200" aria-hidden="true" />
          <ToolbarButton label="Undo" onMouseDown={(event) => { event.preventDefault(); applyCommand('undo') }}>
            <Undo2 size={14} />
          </ToolbarButton>
          <ToolbarButton label="Redo" onMouseDown={(event) => { event.preventDefault(); applyCommand('redo') }}>
            <Redo2 size={14} />
          </ToolbarButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6">
        <div className="mx-auto flex max-w-[760px] flex-col gap-5">
          {draft.contents.map((page) => (
            <section key={page.page} aria-labelledby={`document-page-${page.page}`}>
              <div className="mb-2 flex items-center justify-between px-1">
                <h2
                  id={`document-page-${page.page}`}
                  className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase"
                >
                  Page {page.page}
                </h2>
                <span className="text-[11px] text-slate-400">HTML document page</span>
              </div>
              <div
                ref={(element) => {
                  editorRefs.current[page.page] = element
                }}
                data-page={page.page}
                role="textbox"
                aria-label={`Page ${page.page} content`}
                aria-multiline="true"
                contentEditable={!disabled && !isSaving}
                suppressContentEditableWarning
                data-placeholder="Start writing…"
                className="min-h-[480px] rounded-md border border-slate-200 bg-white px-6 py-7 text-[13px] leading-7 text-slate-700 shadow-sm outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-500/20 sm:min-h-[620px] sm:px-10 sm:py-10"
                onFocus={(event) => {
                  activeEditorRef.current = event.currentTarget
                }}
                onInput={(event) => handlePageInput(page.page, event.currentTarget.innerHTML)}
              />
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

function ToolbarButton({
  label,
  onMouseDown,
  children,
}: {
  label: string
  onMouseDown: (event: MouseEvent<HTMLButtonElement>) => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      onMouseDown={onMouseDown}
    >
      {children}
    </Button>
  )
}
