import { Handle, NodeResizer, NodeToolbar, Position, type NodeProps } from '@xyflow/react'
import { CircleDot } from 'lucide-react'
import { motion } from 'framer-motion'
import type { InputPort, OutputPort } from '../../shared/types/workflow'

type WorkflowNodeData = { label: string; nodeType: string; category: string; inputPorts: InputPort[]; outputPorts: OutputPort[] }

export function WorkflowGraphNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData
  return <><NodeResizer isVisible={selected} minWidth={150} minHeight={72} /><NodeToolbar isVisible={selected} position={Position.Top}><span>{nodeData.category}</span></NodeToolbar><motion.div className={`workflow-node ${nodeData.category} ${selected ? 'selected' : ''}`} animate={{ scale: selected ? 1.025 : 1, y: selected ? -2 : 0 }} transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
    {nodeData.inputPorts.map((port, index) => <Handle key={port.id} id={port.id} type="target" position={Position.Left} style={{ top: `${((index + 1) / (nodeData.inputPorts.length + 1)) * 100}%` }} title={port.description} />)}
    <div className="workflow-node-type"><CircleDot size={14} aria-hidden="true" />{nodeData.category}</div><strong>{nodeData.label}</strong>
    {nodeData.outputPorts.map((port, index) => <Handle key={port.id} id={port.id} type="source" position={Position.Right} style={{ top: `${((index + 1) / (nodeData.outputPorts.length + 1)) * 100}%`, background: port.edge_style.color }} title={port.label} />)}
  </motion.div></>
}
