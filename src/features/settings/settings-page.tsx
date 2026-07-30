import { Bell, Building2, ShieldCheck } from 'lucide-react'

export function SettingsPage() {
  return <section className="settings-page"><div className="page-intro"><p>Workspace settings</p><h1>Control your simulation workspace</h1><span>Manage the defaults that shape every workflow run.</span></div><div className="settings-grid"><article><Building2 size={20} /><div><h2>Workspace profile</h2><p>Acme Simulation · Production environment</p></div><button type="button">Manage</button></article><article><ShieldCheck size={20} /><div><h2>Access and roles</h2><p>12 members with role-based workspace access.</p></div><button type="button">Review</button></article><article><Bell size={20} /><div><h2>Notifications</h2><p>Execution alerts and workflow health updates.</p></div><button type="button">Configure</button></article></div></section>
}
