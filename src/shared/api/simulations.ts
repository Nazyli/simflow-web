import { apiClient } from './client'
import type {
  GroupSimulation,
  InputPort,
  OutputPort,
  Simulation,
  SimulationDetail,
  VisualGroup,
} from '../types/simulation'

export const getGroupSimulations = () =>
  apiClient<GroupSimulation[]>('/admin/studio/group-simulations')
export const getSimulationDetail = (simulationId: string) =>
  apiClient<SimulationDetail>(`/admin/studio/simulations/${encodeURIComponent(simulationId)}`)
export const createGroupSimulation = (
  payload: Pick<GroupSimulation, 'groupSimulationName' | 'groupSimulationDesc'>,
) =>
  apiClient<GroupSimulation>('/admin/studio/group-simulations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const updateGroupSimulation = (
  groupSimulationId: string,
  payload: Pick<GroupSimulation, 'groupSimulationName' | 'groupSimulationDesc'>,
) =>
  apiClient<GroupSimulation>(
    `/admin/studio/group-simulations/${encodeURIComponent(groupSimulationId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )
export const deleteGroupSimulation = (groupSimulationId: string) =>
  apiClient<void>(`/admin/studio/group-simulations/${encodeURIComponent(groupSimulationId)}`, {
    method: 'DELETE',
  })
export const createSimulation = (
  groupSimulationId: string,
  payload: Pick<Simulation, 'simulationName' | 'simulationDesc' | 'channelName' | 'duration'>,
) =>
  apiClient<Simulation>(
    `/admin/studio/group-simulations/${encodeURIComponent(groupSimulationId)}/simulations`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
export const duplicateSimulation = (
  simulationId: string,
  payload?: Pick<Simulation, 'simulationName' | 'simulationDesc'>,
) =>
  apiClient<Simulation>(`/admin/studio/simulations/${encodeURIComponent(simulationId)}/duplicate`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
  })

export interface WorkflowPackage {
  format: 'simflow.workflow'
  format_version: 1
  source: { simulation_name: string; simulation_desc: string | null }
  simulation: {
    name: string
    description: string | null
    channel_name: string
    duration: number
  }
  nodes: Array<{
    node_id: string
    node_name: string
    node_type: string
    configuration: Record<string, unknown>
    position_x: number | null
    position_y: number | null
    rotation: number
    is_enabled: boolean
  }>
  edges: Array<{
    source_node_id: string
    source_port_id: string
    target_node_id: string
    target_port_id: string
  }>
  visual_groups: Array<{
    group_name: string
    member_node_ids: string[]
    position_x: number
    position_y: number
    width: number
    height: number
    style: Record<string, unknown>
    is_collapsed: boolean
  }>
  master_data: Record<string, Array<Record<string, unknown>>>
  shared_references: Record<string, string[]>
}

export const exportSimulation = (simulationId: string) =>
  apiClient<WorkflowPackage>(`/admin/studio/simulations/${encodeURIComponent(simulationId)}/export`)

export const importSimulation = (simulationId: string, workflowPackage: WorkflowPackage) =>
  apiClient<Simulation>(`/admin/studio/simulations/${encodeURIComponent(simulationId)}/import`, {
    method: 'POST',
    body: JSON.stringify(workflowPackage),
  })

export const getSimulations = (groupSimulationId: string) =>
  apiClient<Simulation[]>(
    `/admin/studio/group-simulations/${encodeURIComponent(groupSimulationId)}/simulations`,
  )
export interface PublishedSimulation extends Simulation {
  groupSimulationName: string
}
export const getPublishedSimulations = () =>
  apiClient<PublishedSimulation[]>('/admin/studio/simulations/published')
export const deleteSimulation = (simulationId: string) =>
  apiClient<void>(`/admin/studio/simulations/${encodeURIComponent(simulationId)}`, {
    method: 'DELETE',
  })
export const validateSimulation = (simulationId: string) =>
  apiClient<{ valid: boolean; errors: string[] }>(
    `/admin/studio/simulations/${encodeURIComponent(simulationId)}/validate`,
  )

export interface ApiNode {
  nodeId: string
  nodeName: string
  nodeType: string
  parameters: Record<string, unknown>
  positionX: number | null
  positionY: number | null
  rotation: number
  category: string
  inputPorts: InputPort[]
  outputPorts: OutputPort[]
}
export interface ApiEdge {
  edgeId: string
  sourceNodeId: string
  sourcePortId: string
  targetNodeId: string
  targetPortId: string
  isValid: boolean
}
export interface SimulationGraph {
  nodes: ApiNode[]
  edges: ApiEdge[]
  visualGroups: VisualGroup[]
}
export type ApiNodePayload = Omit<ApiNode, 'nodeId' | 'category' | 'inputPorts' | 'outputPorts'> & {
  duplicateFromNodeId?: string
}
export type ApiEdgePayload = Omit<ApiEdge, 'edgeId' | 'isValid'>
export const getGraph = (simulationId: string) =>
  apiClient<SimulationGraph>(`/admin/studio/simulations/${encodeURIComponent(simulationId)}/graph`)
export const addNode = (simulationId: string, payload: ApiNodePayload) =>
  apiClient<ApiNode>(`/admin/studio/simulations/${encodeURIComponent(simulationId)}/nodes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const updateNode = (nodeId: string, payload: ApiNodePayload) =>
  apiClient<ApiNode>(`/admin/studio/simulations/nodes/${encodeURIComponent(nodeId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
export const deleteNode = (nodeId: string) =>
  apiClient<void>(`/admin/studio/simulations/nodes/${encodeURIComponent(nodeId)}`, {
    method: 'DELETE',
  })
export const addSimulationEdge = (simulationId: string, payload: ApiEdgePayload) =>
  apiClient<ApiEdge>(`/admin/studio/simulations/${encodeURIComponent(simulationId)}/edges`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const updateSimulationEdge = (edgeId: string, payload: ApiEdgePayload) =>
  apiClient<ApiEdge>(`/admin/studio/simulations/edges/${encodeURIComponent(edgeId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
export const deleteSimulationEdge = (edgeId: string) =>
  apiClient<void>(`/admin/studio/simulations/edges/${encodeURIComponent(edgeId)}`, {
    method: 'DELETE',
  })
