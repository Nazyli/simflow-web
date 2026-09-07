import { apiClient } from './client'
import type {
  GroupSimulation,
  InputPort,
  OutputPort,
  Simulation,
  SimulationDetail,
} from '../types/simulation'

export const getGroupSimulations = () => apiClient<GroupSimulation[]>('/studio/group-simulations')
export const getSimulationDetail = (simulationId: string) =>
  apiClient<SimulationDetail>(`/studio/simulations/${encodeURIComponent(simulationId)}`)
export const createGroupSimulation = (
  payload: Pick<GroupSimulation, 'group_simulation_name' | 'group_simulation_desc'>,
) =>
  apiClient<GroupSimulation>('/studio/group-simulations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const updateGroupSimulation = (
  groupSimulationId: string,
  payload: Pick<GroupSimulation, 'group_simulation_name' | 'group_simulation_desc'>,
) =>
  apiClient<GroupSimulation>(`/studio/group-simulations/${encodeURIComponent(groupSimulationId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
export const deleteGroupSimulation = (groupSimulationId: string) =>
  apiClient<void>(`/studio/group-simulations/${encodeURIComponent(groupSimulationId)}`, {
    method: 'DELETE',
  })
export const createSimulation = (
  groupSimulationId: string,
  payload: Pick<Simulation, 'simulation_name' | 'simulation_desc' | 'channel_name' | 'duration'>,
) =>
  apiClient<Simulation>(
    `/studio/group-simulations/${encodeURIComponent(groupSimulationId)}/simulations`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
export const duplicateSimulation = (
  simulationId: string,
  payload?: Pick<Simulation, 'simulation_name' | 'simulation_desc'>,
) =>
  apiClient<Simulation>(`/studio/simulations/${encodeURIComponent(simulationId)}/duplicate`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
  })

export const createDraftFromSimulation = (simulationId: string) =>
  duplicateSimulation(simulationId)
export const getSimulations = (groupSimulationId: string) =>
  apiClient<Simulation[]>(
    `/studio/group-simulations/${encodeURIComponent(groupSimulationId)}/simulations`,
  )
export interface PublishedSimulation extends Simulation {
  group_simulation_name: string
}
export const getPublishedSimulations = () =>
  apiClient<PublishedSimulation[]>('/studio/simulations/published')
export const deleteSimulation = (simulationId: string) =>
  apiClient<void>(`/studio/simulations/${encodeURIComponent(simulationId)}`, { method: 'DELETE' })
/** @deprecated publish/validate endpoint removed; graph is validated on node/edge mutations. */
export const publishSimulation = (simulationId: string) =>
  duplicateSimulation(simulationId)
export interface ApiNode {
  node_id: string
  node_name: string
  node_type: string
  parameters: Record<string, unknown>
  position_x: number | null
  position_y: number | null
  rotation: number
  category: string
  input_ports: InputPort[]
  output_ports: OutputPort[]
}
export interface ApiEdge {
  edge_id: string
  source_node_id: string
  source_port_id: string
  target_node_id: string
  target_port_id: string
  is_valid: boolean
}
export type ApiNodePayload = Omit<ApiNode, 'node_id' | 'category' | 'input_ports' | 'output_ports'>
export type ApiEdgePayload = Omit<ApiEdge, 'edge_id' | 'is_valid'>
export const getGraph = (simulationId: string) =>
  apiClient<[ApiNode[], ApiEdge[]]>(`/studio/simulations/${encodeURIComponent(simulationId)}/graph`)
export const addNode = (simulationId: string, payload: ApiNodePayload) =>
  apiClient<ApiNode>(`/studio/simulations/${encodeURIComponent(simulationId)}/nodes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const updateNode = (nodeId: string, payload: ApiNodePayload) =>
  apiClient<ApiNode>(`/studio/simulations/nodes/${encodeURIComponent(nodeId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
export const deleteNode = (nodeId: string) =>
  apiClient<void>(`/studio/simulations/nodes/${encodeURIComponent(nodeId)}`, { method: 'DELETE' })
export const addSimulationEdge = (simulationId: string, payload: ApiEdgePayload) =>
  apiClient<ApiEdge>(`/studio/simulations/${encodeURIComponent(simulationId)}/edges`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const updateSimulationEdge = (edgeId: string, payload: ApiEdgePayload) =>
  apiClient<ApiEdge>(`/studio/simulations/edges/${encodeURIComponent(edgeId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
export const deleteSimulationEdge = (edgeId: string) =>
  apiClient<void>(`/studio/simulations/edges/${encodeURIComponent(edgeId)}`, { method: 'DELETE' })
