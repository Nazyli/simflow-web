import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getWorkflows } from '../../shared/api/workflows'
import { ErrorState, LoadingState } from '../../shared/components/async-state'

export function SimulationStudioPage() {
  const workflows = useQuery({ queryKey: ['workflows'], queryFn: getWorkflows })
  return <main><header><h1>Simulation Studio</h1><Link to="/simulation">Open Simulation Runner</Link></header><p>Manage master data and simulation workflow configurations.</p>{workflows.isPending && <LoadingState />}{workflows.isError && <ErrorState message="Unable to load workflows." />}{workflows.data && <ul>{workflows.data.map((workflow) => <li key={workflow.workflow_id}>{workflow.workflow_name} — {workflow.status}</li>)}</ul>}</main>
}
