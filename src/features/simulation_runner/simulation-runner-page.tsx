import { Link } from 'react-router-dom'

export function SimulationRunnerPage() {
  return <main><header><h1>Simulation Runner</h1><Link to="/studio">Open Simulation Studio</Link></header><p>Enter a participant ID to start a workflow simulation.</p><label htmlFor="participant-id">Participant ID</label><input id="participant-id" name="participant-id" placeholder="Participant ID" /><button type="button">Start simulation</button></main>
}
