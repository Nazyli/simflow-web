import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'

type WorkflowEdgeData = { priority: number; condition: Record<string, unknown> | null }

export function WorkflowGraphEdge({ id, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, markerEnd, data, selected }: EdgeProps) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  const edgeData = data as WorkflowEdgeData
  const condition = edgeData?.condition
  const label = condition?.field ? `${String(condition.field)} = ${String(condition.equals)}` : 'default'
  const stroke = selected ? '#5b46c5' : '#94a3b8'
  return <><BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ stroke, strokeWidth: selected ? 2.5 : 1.5 }} /><EdgeLabelRenderer><div className={`workflow-edge-label ${selected ? 'selected' : ''}`} style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}><b>P{edgeData?.priority ?? 0}</b><span>{label}</span></div></EdgeLabelRenderer></>
}
