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
  payload: Pick<GroupSimulation, 'groupSimulationName' | 'groupSimulationDesc'>,
) =>
  apiClient<GroupSimulation>('/studio/group-simulations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const updateGroupSimulation = (
  groupSimulationId: string,
  payload: Pick<GroupSimulation, 'groupSimulationName' | 'groupSimulationDesc'>,
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
  payload: Pick<Simulation, 'simulationName' | 'simulationDesc' | 'channelName' | 'duration'>,
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
  payload?: Pick<Simulation, 'simulationName' | 'simulationDesc'>,
) =>
  apiClient<Simulation>(`/studio/simulations/${encodeURIComponent(simulationId)}/duplicate`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
  })

export const getSimulations = (groupSimulationId: string) =>
  apiClient<Simulation[]>(
    `/studio/group-simulations/${encodeURIComponent(groupSimulationId)}/simulations`,
  )
export interface PublishedSimulation extends Simulation {
  groupSimulationName: string
}
export const getPublishedSimulations = () =>
  apiClient<PublishedSimulation[]>('/studio/simulations/published')
export const deleteSimulation = (simulationId: string) =>
  apiClient<void>(`/studio/simulations/${encodeURIComponent(simulationId)}`, { method: 'DELETE' })
export const validateSimulation = (simulationId: string) =>
  apiClient<{ valid: boolean; errors: string[] }>(
    `/studio/simulations/${encodeURIComponent(simulationId)}/validate`,
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
export type ApiNodePayload = Omit<ApiNode, 'nodeId' | 'category' | 'inputPorts' | 'outputPorts'>
export type ApiEdgePayload = Omit<ApiEdge, 'edgeId' | 'isValid'>
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
