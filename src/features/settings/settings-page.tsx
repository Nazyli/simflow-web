import { useState } from 'react'
import { Database, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { resetDatabase, type ResetResponse } from '../../shared/api/admin'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { PageFrame } from '../../components/layout/page-frame'
import { PageHeader } from '../../components/layout/page-header'
import { SurfaceSection } from '../../components/layout/surface-section'

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
    <PageFrame mode="reference" className="settings-page mx-auto w-full max-w-3xl">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Manage the local demo environment and its seeded simulation data."
      />

      <SurfaceSection
        title="Reset demo data"
        description="Re-run migrations and seed all demo simulations."
        className="rounded-xl border border-slate-200 bg-white p-6 max-[620px]:rounded-lg max-[620px]:p-4"
      >
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            This will downgrade, re-migrate, and re-seed the database. All existing simulation data
            will be lost.
          </span>
        </div>

        <Button
          variant="destructive"
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
          className="gap-2"
        >
          <Database size={14} />
          {loading ? 'Resetting...' : 'Reset Database'}
        </Button>

        {result && (
          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4" aria-live="polite">
            <p className="text-xs font-semibold text-slate-700">Reset output</p>
            {(['downgrade', 'upgrade', 'seed'] as const).map((step) => (
              <details key={step} className="group">
                <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
                  {step}
                </summary>
                <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-600">
                  {result[step]}
                </pre>
              </details>
            ))}
          </div>
        )}
      </SurfaceSection>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Database</DialogTitle>
            <DialogDescription>
              This will run alembic downgrade, re-migrate to head, and re-seed all demo data. All
              existing simulation data will be permanently lost.
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
    </PageFrame>
  )
}
