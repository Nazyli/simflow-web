import { Handle, NodeResizer, NodeToolbar, Position, type NodeProps } from '@xyflow/react'
import { BellRing, CircleDot, GitBranch, Play } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

type WorkflowNodeData = { label: string; nodeType: 'trigger' | 'condition' | 'action' | 'event' }

const nodeAppearance: Record<WorkflowNodeData['nodeType'], { icon: LucideIcon; label: string }> = {
  trigger: { icon: BellRing, label: 'Trigger' },
  condition: { icon: GitBranch, label: 'Condition' },
  action: { icon: Play, label: 'Action' },
  event: { icon: CircleDot, label: 'Event' },
}

export function WorkflowGraphNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData
  const appearance = nodeAppearance[nodeData.nodeType]
  const NodeIcon = appearance.icon
  return <><NodeResizer isVisible={selected} minWidth={150} minHeight={72} /><NodeToolbar isVisible={selected} position={Position.Top}><span>{appearance.label}</span></NodeToolbar><motion.div className={`workflow-node ${nodeData.nodeType} ${selected ? 'selected' : ''}`} animate={{ scale: selected ? 1.025 : 1, y: selected ? -2 : 0 }} transition={{ type: 'spring', stiffness: 420, damping: 26 }}><Handle type="target" position={Position.Left} /><div className="workflow-node-type"><NodeIcon size={14} aria-hidden="true" />{appearance.label}</div><strong>{nodeData.label}</strong><Handle type="source" position={Position.Right} /></motion.div></>
}
