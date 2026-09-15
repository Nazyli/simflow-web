import { apiClient } from './client'
import type {
  GroupSimulation,
  InputPort,
  OutputPort,
  Simulation,
  SimulationDetail,
  VisualGroup,
} from '../types/simulation'

export const getGroupSimulations = () => apiClient<GroupSimulation[]>('/admin/studio/group-simulations')
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
  apiClient<GroupSimulation>(`/admin/studio/group-simulations/${encodeURIComponent(groupSimulationId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
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
  apiClient<void>(`/admin/studio/simulations/${encodeURIComponent(simulationId)}`, { method: 'DELETE' })
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
export type ApiNodePayload = Omit<ApiNode, 'nodeId' | 'category' | 'inputPorts' | 'outputPorts'>
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
  apiClient<void>(`/admin/studio/simulations/nodes/${encodeURIComponent(nodeId)}`, { method: 'DELETE' })
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
  apiClient<void>(`/admin/studio/simulations/edges/${encodeURIComponent(edgeId)}`, { method: 'DELETE' })
