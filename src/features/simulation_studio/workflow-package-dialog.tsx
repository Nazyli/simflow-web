import { Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import type { WorkflowPackage } from '../../shared/api/simulations'

export function WorkflowPackageDialog({
  open,
  onOpenChange,
  packageFileName,
  workflowPackage,
  importing,
  onImport,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageFileName: string | null
  workflowPackage: WorkflowPackage | null
  importing: boolean
  onImport: () => void
}) {
  const masterCounts = Object.entries(workflowPackage?.master_data ?? {})
    .map(([name, rows]) => `${name.replace('master_', '')}: ${rows.length}`)
    .join(' • ')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-5 sm:max-w-lg">
        <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Upload className="h-5 w-5 text-[#9929EA]" /> Import workflow JSON
        </DialogTitle>
        <DialogDescription>
          Import creates a new draft in the current group. Existing workflows and master-data will
          not be overwritten.
        </DialogDescription>

        {workflowPackage ? (
          <div className="space-y-3 rounded-md border border-[#DBE3EC] bg-slate-50/80 p-3 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">File</p>
              <p className="truncate font-semibold text-slate-800">{packageFileName}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
              <span>
                <strong className="text-slate-800">Workflow:</strong>{' '}
                {workflowPackage.simulation.name}
              </span>
              <span>
                <strong className="text-slate-800">Channel:</strong>{' '}
                {workflowPackage.simulation.channel_name}
              </span>
              <span>
                <strong className="text-slate-800">Nodes:</strong> {workflowPackage.nodes.length}
              </span>
              <span>
                <strong className="text-slate-800">Edges:</strong> {workflowPackage.edges.length}
              </span>
            </div>
            {masterCounts && (
              <p className="text-xs text-slate-600">
                <strong className="text-slate-800">Master-data:</strong> {masterCounts}
              </p>
            )}
            <p className="text-xs leading-normal text-amber-700">
              Owned master-data will receive new IDs. Shared actor, document, activity, and
              knowledge references remain shared.
            </p>
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Choose a valid SimFlow workflow JSON file to continue.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#9929EA] text-white hover:bg-[#7D1FC2]"
            disabled={!workflowPackage || importing}
            onClick={onImport}
          >
            <Upload className="h-3.5 w-3.5" /> {importing ? 'Importing…' : 'Import workflow'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
