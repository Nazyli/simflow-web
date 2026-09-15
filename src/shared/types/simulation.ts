export interface GroupSimulation {
  groupSimulationId: string
  groupSimulationName: string
  groupSimulationDesc: string | null
  createdBy?: string | null
  createdDate?: string | null
  modifiedBy?: string | null
  modifiedDate?: string | null
  isDeleted?: boolean
  simulations?: Simulation[]
}

export interface SimulationDetail extends Simulation {
  groupSimulationName: string
}

export interface Execution {
  executionId: string
  sessionId: string | null
  simulationId: string
  participantId: string | null
  status: string
  currentNodeId: string | null
  context: Record<string, unknown>
  startedAt: string
  completedAt: string | null
}

export interface Simulation {
  simulationId: string
  groupSimulationId: string
  simulationName: string
  simulationDesc: string | null
  channelName: string
  duration: number
  status?: string
  createdBy?: string | null
  createdDate?: string | null
  modifiedBy?: string | null
  modifiedDate?: string | null
  isDeleted?: boolean
  executionCount?: number
  isLocked?: boolean
}

export interface EdgeStyle {
  color: string
  lineStyle: 'solid' | 'dashed' | 'dotted'
  animated: boolean
}

export interface VisualGroupStyle {
  color: string
  borderStyle: 'solid' | 'dashed' | 'dotted'
}

export interface VisualGroup {
  visualGroupId: string
  simulationId: string
  groupName: string
  memberNodeIds: string[]
  positionX: number
  positionY: number
  width: number
  height: number
  style: VisualGroupStyle
  isCollapsed: boolean
}
export interface InputPort {
  id: string
  label: string
  description: string
  acceptedDataTypes: string[]
  maxConnections: number
}
export interface OutputPort {
  id: string
  label: string
  description: string
  dataSchema: Record<string, unknown>
  dataType: string
  maxConnections: number
  edgeStyle: EdgeStyle
}
export interface ParameterPicker {
  editor?: string
  resource: string
  valueField: string
  displayFields?: string[]
  filterField?: string
  filterBy?: string
  endpoint?: string
  valueType?: 'array'
  selectionMode?: 'append_one'
}
export interface ParameterOption {
  picker?: ParameterPicker
  select?: { id: string; label: string }[]
  multiline?: boolean
}
export interface NodeDefinition {
  nodeType: string
  category: string
  label: string
  icon: string
  color: string
  description: string
  inputPorts: InputPort[]
  outputPorts: OutputPort[]
  parameters: Record<string, unknown>
  validationRules: Record<string, unknown>
  parameterOptions?: Record<string, ParameterOption>
}
export interface NodeCatalog {
  categories: { id: string; label: string }[]
  nodes: NodeDefinition[]
}
