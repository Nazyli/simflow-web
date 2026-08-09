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
  session_id: string | null
  workflow_version_id: string
  participant_id: string | null
  status: string
  current_node_id: string | null
  context: Record<string, unknown>
  started_at: string
  completed_at: string | null
}

export interface WorkflowVersion {
  workflow_version_id: string
  workflow_id: string
  version_number: number
  status: string
}

export interface EdgeStyle {
  color: string
  line_style: 'solid' | 'dashed' | 'dotted'
  animated: boolean
}
export interface InputPort {
  id: string
  label: string
  description: string
  accepted_data_types: string[]
  max_connections: number
}
export interface OutputPort {
  id: string
  label: string
  description: string
  data_schema: Record<string, unknown>
  data_type: string
  max_connections: number
  edge_style: EdgeStyle
}
export interface NodeDefinition {
  node_type: string
  category: string
  label: string
  icon: string
  color: string
  description: string
  input_ports: InputPort[]
  output_ports: OutputPort[]
  parameters: Record<string, unknown>
  validation_rules: Record<string, unknown>
}
export interface NodeCatalog {
  categories: { id: string; label: string }[]
  nodes: NodeDefinition[]
}
