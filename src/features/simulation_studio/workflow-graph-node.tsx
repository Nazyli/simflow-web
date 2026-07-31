import { NodeResizer, NodeToolbar, Position, type NodeProps } from '@xyflow/react'
import { CircleDot } from 'lucide-react'
import { BaseHandle } from '@/components/base-handle'
import { BaseNode, BaseNodeContent, BaseNodeHeader, BaseNodeHeaderTitle } from '@/components/base-node'
import type { InputPort, OutputPort } from '../../shared/types/workflow'

type WorkflowNodeData = { label: string; nodeType: string; color: string; inputPorts: InputPort[]; outputPorts: OutputPort[] }

export function WorkflowGraphNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData
  return (
    <>
      <NodeResizer isVisible={selected} minWidth={150} minHeight={72} />
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <span>{nodeData.nodeType}</span>
      </NodeToolbar>
      <BaseNode
        className="min-w-[190px]"
        style={{ borderColor: nodeData.color, boxShadow: `0 0 0 1px ${nodeData.color}22` }}
      >
        {nodeData.inputPorts.map((port, index) => (
          <BaseHandle
            key={port.id}
            id={port.id}
            type="target"
            position={Position.Left}
            title={port.description}
            style={{ top: `${((index + 1) / (nodeData.inputPorts.length + 1)) * 100}%` }}
          />
        ))}
        <BaseNodeHeader>
          <CircleDot size={14} aria-hidden="true" className="shrink-0" style={{ color: nodeData.color }} />
          <BaseNodeHeaderTitle className="text-xs font-bold uppercase tracking-wider" style={{ color: nodeData.color }}>
            {nodeData.nodeType}
          </BaseNodeHeaderTitle>
        </BaseNodeHeader>
        <BaseNodeContent>
          <strong className="text-sm font-semibold leading-tight">{nodeData.label}</strong>
        </BaseNodeContent>
        {nodeData.outputPorts.map((port, index) => (
          <BaseHandle
            key={port.id}
            id={port.id}
            type="source"
            position={Position.Right}
            title={port.label}
            style={{ top: `${((index + 1) / (nodeData.outputPorts.length + 1)) * 100}%`, background: port.edge_style.color }}
          />
        ))}
      </BaseNode>
    </>
  )
}
