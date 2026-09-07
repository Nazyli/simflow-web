export interface GroupSimulation {
  group_simulation_id: string
  group_simulation_name: string
  group_simulation_desc: string | null
  created_by?: string | null
  created_date?: string | null
  modified_by?: string | null
  modified_date?: string | null
  is_deleted?: boolean
  simulations?: Simulation[]
}

export interface SimulationDetail extends Simulation {
  group_simulation_name: string
}

export interface Execution {
  execution_id: string
  session_id: string | null
  simulation_id: string
  participant_id: string | null
  status: string
  current_node_id: string | null
  context: Record<string, unknown>
  started_at: string
  completed_at: string | null
}

export interface Simulation {
  simulation_id: string
  group_simulation_id: string
  simulation_name: string
  simulation_desc: string | null
  channel_name: string
  duration: number
  status?: string
  created_by?: string | null
  created_date?: string | null
  modified_by?: string | null
  modified_date?: string | null
  is_deleted?: boolean
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
export interface ParameterPicker {
  resource: string
  value_field: string
  display_fields: string[]
  filter_field?: string
  filter_by?: string
  endpoint?: string
  value_type?: 'array'
  selection_mode?: 'append_one'
}
export interface ParameterOption {
  picker?: ParameterPicker
  select?: { id: string; label: string }[]
  multiline?: boolean
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
  parameter_options?: Record<string, ParameterOption>
}
export interface NodeCatalog {
  categories: { id: string; label: string }[]
  nodes: NodeDefinition[]
}
