import { Handle, NodeResizer, NodeToolbar, Position, type NodeProps } from '@xyflow/react'

type WorkflowNodeData = { label: string; nodeType: 'trigger' | 'condition' | 'action' | 'event' }

const nodeAppearance: Record<WorkflowNodeData['nodeType'], { icon: string; label: string }> = {
  trigger: { icon: '⚡', label: 'Trigger' },
  condition: { icon: '◇', label: 'Condition' },
  action: { icon: '▶', label: 'Action' },
  event: { icon: '●', label: 'Event' },
}

export function WorkflowGraphNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData
  const appearance = nodeAppearance[nodeData.nodeType]
  return <><NodeResizer isVisible={selected} minWidth={150} minHeight={72} /><NodeToolbar isVisible={selected} position={Position.Top}><span>{appearance.label}</span></NodeToolbar><div className={`workflow-node ${nodeData.nodeType} ${selected ? 'selected' : ''}`}><Handle type="target" position={Position.Left} /><div className="workflow-node-type"><span aria-hidden="true">{appearance.icon}</span>{appearance.label}</div><strong>{nodeData.label}</strong><Handle type="source" position={Position.Right} /></div></>
}
