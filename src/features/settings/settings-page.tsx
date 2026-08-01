import { Bell, Building2, ShieldCheck } from 'lucide-react'

const cards = [
  { icon: Building2, title: 'Workspace profile', text: 'Acme Simulation · Production environment', action: 'Manage' },
  { icon: ShieldCheck, title: 'Access and roles', text: '12 members with role-based workspace access.', action: 'Review' },
  { icon: Bell, title: 'Notifications', text: 'Execution alerts and workflow health updates.', action: 'Configure' },
]

export function SettingsPage() {
  return (
    <section className="w-full max-w-[900px]">
      <div className="max-w-2xl">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#6854cc]">Workspace settings</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Control your simulation workspace</h1>
        <span className="mt-2 block text-sm text-slate-500">Manage the defaults that shape every workflow run.</span>
      </div>
      <div className="mt-8 grid gap-3">
        {cards.map((card) => (
          <article key={card.title} className="flex flex-wrap items-center gap-3.5 rounded-[10px] border border-[#e0e7ef] bg-white p-[17px]">
            <card.icon size={20} className="shrink-0 text-[#6652cc]" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#273449]">{card.title}</h2>
              <p className="mt-0.5 text-xs text-[#7d899a]">{card.text}</p>
            </div>
            <button type="button" className="ml-auto rounded-md border border-[#e0e7ef] bg-white px-2.5 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50">{card.action}</button>
          </article>
        ))}
      </div>
    </section>
  )
}
