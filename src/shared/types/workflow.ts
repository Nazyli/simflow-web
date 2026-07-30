export interface Workflow {
  workflow_id: string
  workflow_name: string
  workflow_desc: string | null
  workspace_id: string | null
  status: string
  active_version_id: string | null
}

export interface Execution {
  execution_id: string
  workflow_version_id: string
  participant_id: string | null
  status: string
  current_node_id: string | null
  context: Record<string, unknown>
}

export interface WorkflowVersion { workflow_version_id: string; workflow_id: string; version_number: number; status: string }
