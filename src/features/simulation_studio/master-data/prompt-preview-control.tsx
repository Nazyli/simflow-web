import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, Check, Copy, Eye } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { ApiError } from '../../../shared/api/client'
import { RICH_TEXT_CLASS, SafeHtml } from '../../../shared/safe-html'
import { previewPrompt } from '../../../shared/api/master-data'
import { renderPromptPreview } from './prompt-preview-logic'

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    try {
      const body = JSON.parse(error.message) as { info?: { message?: string } }
      return body.info?.message ?? error.message
    } catch {
      return error.message
    }
  }
  return error instanceof Error ? error.message : 'Unable to preview prompt.'
}

export function PromptPreviewControl({
  nodeType,
  prompt,
  actorId,
  variables,
  disabled = false,
}: {
  nodeType: string
  prompt: string
  actorId?: string | null
  variables?: Record<string, unknown>
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const previewMutation = useMutation({
    mutationFn: () => previewPrompt(nodeType, prompt.trim(), actorId, variables),
  })

  function openPreview() {
    setCopied(false)
    setOpen(true)
    previewMutation.mutate()
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setCopied(false)
      previewMutation.reset()
    }
  }

  async function copyPreview() {
    if (!previewMutation.data) return
    await navigator.clipboard.writeText(previewMutation.data.renderedPrompt)
    setCopied(true)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || !prompt.trim() || previewMutation.isPending}
        onClick={openPreview}
      >
        <Eye /> Preview prompt
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[min(720px,calc(100vh-32px))] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b px-6 pt-6 pb-4">
            <DialogTitle>Prompt preview</DialogTitle>
            <DialogDescription>
              This is the final prompt after placeholder injection with{' '}
              {actorId ? 'the selected actor and sample runtime data' : 'sample runtime data'}. It
              is not saved and does not call the AI provider.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 overflow-auto px-6 py-5">
            {previewMutation.isPending && (
              <p className="text-muted-foreground text-sm">Rendering prompt...</p>
            )}
            {previewMutation.error && (
              <p className="text-destructive text-sm">{errorMessage(previewMutation.error)}</p>
            )}
            {previewMutation.data && (
              <>
                <div className="max-h-[min(480px,55vh)] overflow-auto rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm selection:bg-indigo-100 [&_code]:rounded [&_code]:bg-slate-200/70 [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mb-3 [&_h2]:mb-2 [&_h3]:mb-2 [&_hr]:my-4 [&_li]:my-1 [&_p]:mb-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-slate-200 [&_pre]:bg-white [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0">
                  <SafeHtml
                    html={renderPromptPreview(previewMutation.data.renderedPrompt)}
                    className={RICH_TEXT_CLASS}
                  />
                </div>
                {previewMutation.data.unresolvedPlaceholders.length > 0 && (
                  <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <p>
                      Unresolved placeholders:{' '}
                      {previewMutation.data.unresolvedPlaceholders
                        .map((name) => `{${name}}`)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter className="mx-0 mb-0 border-t px-6 pt-4 pb-6">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!previewMutation.data}
              onClick={() => void copyPreview()}
            >
              {copied ? <Check /> : <Copy />}
              {copied ? 'Copied' : 'Copy prompt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
