import { useState } from 'react'
import { Database, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { resetDatabase, type ResetResponse } from '../../shared/api/admin'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'

export function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResetResponse | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleReset() {
    setConfirmOpen(false)
    setLoading(true)
    setResult(null)
    try {
      const res = await resetDatabase()
      setResult(res)
      toast.success('Database reset completed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-700">Settings</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50">
            <Database size={18} className="text-amber-600" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Reset Demo Data</h2>
            <p className="text-xs text-slate-400">
              Re-run migrations and seed all demo workflows
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            This will downgrade, re-migrate, and re-seed the database. All existing workflow data
            will be lost.
          </span>
        </div>

        <button
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          <Database size={14} />
          {loading ? 'Resetting...' : 'Reset Database'}
        </button>

        {result && (
          <div className="mt-4 space-y-2">
            {(['downgrade', 'upgrade', 'seed'] as const).map((step) => (
              <details key={step} className="group">
                <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
                  {step}
                </summary>
                <pre className="mt-1 max-h-40 overflow-auto rounded bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-600">
                  {result[step]}
                </pre>
              </details>
            ))}
          </div>
        )}
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Database</DialogTitle>
            <DialogDescription>
              This will run alembic downgrade, re-migrate to head, and re-seed all demo data.
              All existing workflow data will be permanently lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleReset}>
              Yes, reset everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
