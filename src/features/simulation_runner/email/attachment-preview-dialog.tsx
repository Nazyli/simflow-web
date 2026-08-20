import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { sortAttachmentPreviewPages, type EmailAttachment } from './types'

interface AttachmentPreviewDialogProps {
  attachment: EmailAttachment
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AttachmentPreviewDialog({
  attachment,
  open,
  onOpenChange,
}: AttachmentPreviewDialogProps) {
  const pages = sortAttachmentPreviewPages(attachment.contents)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-48px)] w-[min(900px,calc(100vw-32px))] flex-col gap-0 p-0 sm:max-w-none">
        <DialogHeader className="border-b border-slate-200 px-6 py-4 pr-12">
          <DialogTitle className="truncate text-slate-800">
            {attachment.file_name ?? 'Attachment preview'}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto bg-slate-100 p-4 sm:p-6">
          {pages.map((page) => (
            <article
              key={page.participant_attachment_email_id}
              className="mx-auto mb-6 min-h-[720px] max-w-[680px] bg-white p-6 text-sm leading-7 whitespace-pre-wrap text-slate-700 shadow-sm sm:p-10"
            >
              {page.content}
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
