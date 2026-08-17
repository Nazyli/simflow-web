import { Workflow } from 'lucide-react'
import { StatusBadge } from '../../../shared/components/status-badge'
import type { EmailWorkflow } from './types'

interface WorkflowSidebarProps {
  workflows: EmailWorkflow[]
  selectedWorkflow: string | null
  onSelect: (workflowVersionId: string) => void
}

export function WorkflowSidebar({ workflows, selectedWorkflow, onSelect }: WorkflowSidebarProps) {
  return (
    <aside className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white p-2 lg:w-[220px] lg:flex-col lg:overflow-y-auto lg:border-r lg:border-b-0 lg:p-2">
      <p className="hidden px-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase lg:block">
        Workflows
      </p>
      {workflows.map((workflow) => {
        const active = workflow.workflowVersionId === selectedWorkflow
        return (
          <button
            key={workflow.workflowVersionId}
            type="button"
            onClick={() => onSelect(workflow.workflowVersionId)}
            className={`flex min-w-[200px] rounded-lg px-3 py-2.5 text-left lg:min-w-0 ${
              active
                ? '!border-0 !bg-violet-50 !text-[#5b46c5]'
                : '!border-0 !bg-transparent !text-slate-700 hover:!bg-slate-50'
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{workflow.workflowName}</span>
                <StatusBadge status={workflow.status} />
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-slate-500">
                  Version {workflow.versionNumber}
                </span>
                {workflow.unreadCount > 0 && (
                  <span
                    aria-label={`${workflow.unreadCount} unread email${workflow.unreadCount === 1 ? '' : 's'}`}
                    className="grid size-5 shrink-0 place-items-center rounded-full bg-violet-600 text-[10px] font-bold text-white"
                  >
                    {workflow.unreadCount}
                  </span>
                )}
              </span>
            </span>
          </button>
        )
      })}
      {workflows.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
          <Workflow size={18} className="text-slate-300" />
          <p className="text-xs text-slate-400">No workflows in this session.</p>
        </div>
      )}
    </aside>
  )
}
