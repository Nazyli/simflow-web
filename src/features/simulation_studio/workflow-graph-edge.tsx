import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'

type WorkflowEdgeData = { priority: number; label: string; style: { color: string; line_style: string; animated: boolean } }

export function WorkflowGraphEdge({ id, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, markerEnd, data, selected }: EdgeProps) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  const edgeData = data as WorkflowEdgeData
  const priority = edgeData?.priority ?? 0
  const label = edgeData?.label ?? ''
  const style = edgeData?.style ?? { color: '#94a3b8', line_style: 'solid', animated: false }
  const stroke = selected ? '#5b46c5' : style.color
  const labelOffset = priority % 2 === 0 ? -18 : 18
  return <><BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ stroke, strokeWidth: selected ? 2.5 : 1.5, strokeDasharray: style.line_style === 'dashed' ? '6 4' : style.line_style === 'dotted' ? '2 3' : undefined }} /><EdgeLabelRenderer><div className={`workflow-edge-label ${selected ? 'selected' : ''}`} style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + labelOffset}px)` }}><b>P{priority}</b><span>{label}</span></div></EdgeLabelRenderer></>
}
