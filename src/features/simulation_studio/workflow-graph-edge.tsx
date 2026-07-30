import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'

type WorkflowEdgeData = { priority: number; condition: Record<string, unknown> | null }

export function WorkflowGraphEdge({ id, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, markerEnd, data }: EdgeProps) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  const edgeData = data as WorkflowEdgeData
  const condition = edgeData?.condition
  const label = condition?.field ? `${String(condition.field)} = ${String(condition.equals)}` : 'default'
  return <><BaseEdge id={id} path={path} markerEnd={markerEnd} /><EdgeLabelRenderer><div className="workflow-edge-label" style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}>P{edgeData?.priority ?? 0} · {label}</div></EdgeLabelRenderer></>
}
