import type { CSSProperties } from 'react'
import { NodeResizer, NodeToolbar, Position, type NodeProps } from '@xyflow/react'
import { CircleDot, RotateCw } from 'lucide-react'
import { BaseHandle } from '@/components/base-handle'
import {
  BaseNode,
  BaseNodeContent,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
} from '@/components/base-node'
import type { InputPort, OutputPort } from '../../shared/types/workflow'

type WorkflowNodeData = {
  label: string
  nodeType: string
  color: string
  inputPorts: InputPort[]
  outputPorts: OutputPort[]
  rotation: number
  editable?: boolean
  onRotate?: (nodeId: string) => void
}

function inputPosition(rotation: number): Position {
  switch (((rotation % 360) + 360) % 360) {
    case 90:
      return Position.Top
    case 180:
      return Position.Right
    case 270:
      return Position.Bottom
    default:
      return Position.Left
  }
}

function outputPosition(rotation: number): Position {
  switch (((rotation % 360) + 360) % 360) {
    case 90:
      return Position.Bottom
    case 180:
      return Position.Left
    case 270:
      return Position.Top
    default:
      return Position.Right
  }
}

function handleOffset(position: Position, index: number, count: number): CSSProperties {
  const fraction = ((index + 1) / (count + 1)) * 100
  if (position === Position.Left || position === Position.Right) {
    return { top: `${fraction}%` }
  }
  return { left: `${fraction}%` }
}

export function WorkflowGraphNode({ id, data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData
  const rotation = nodeData.rotation ?? 0
  const inputPos = inputPosition(rotation)
  const outputPos = outputPosition(rotation)
  return (
    <>
      <NodeResizer isVisible={selected} minWidth={150} minHeight={72} />
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <span>{nodeData.nodeType}</span>
        {nodeData.editable && nodeData.onRotate && (
          <button
            type="button"
            className="ml-1 inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[0.6rem] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
            onClick={() => nodeData.onRotate?.(id)}
            title={`Rotate node (current: ${rotation}°)`}
          >
            <RotateCw className="h-3 w-3" />
            {rotation}°
          </button>
        )}
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
            position={inputPos}
            title={port.description}
            style={handleOffset(inputPos, index, nodeData.inputPorts.length)}
          />
        ))}
        <BaseNodeHeader>
          <CircleDot
            size={14}
            aria-hidden="true"
            className="shrink-0"
            style={{ color: nodeData.color }}
          />
          <BaseNodeHeaderTitle
            className="text-xs font-bold tracking-wider uppercase"
            style={{ color: nodeData.color }}
          >
            {nodeData.nodeType}
          </BaseNodeHeaderTitle>
        </BaseNodeHeader>
        <BaseNodeContent>
          <strong className="text-sm leading-tight font-semibold">{nodeData.label}</strong>
        </BaseNodeContent>
        {nodeData.outputPorts.map((port, index) => (
          <BaseHandle
            key={port.id}
            id={port.id}
            type="source"
            position={outputPos}
            title={port.label}
            style={{
              ...handleOffset(outputPos, index, nodeData.outputPorts.length),
              background: port.edge_style.color,
            }}
          />
        ))}
      </BaseNode>
    </>
  )
}
