import type { CSSProperties } from 'react'
import { useState } from 'react'
import { NodeResizer, NodeToolbar, Position, type NodeProps } from '@xyflow/react'
import { CircleDot, LogIn, LogOut, RotateCw } from 'lucide-react'
import { BaseHandle } from '@/components/base-handle'
import { BaseNode, BaseNodeContent, BaseNodeHeader } from '@/components/base-node'
import { NodeStatusIndicator } from '@/components/node-status-indicator'
import type { InputPort, OutputPort } from '../../shared/types/simulation'

type SimulationNodeData = {
  label: string
  nodeType: string
  color: string
  inputPorts: InputPort[]
  outputPorts: OutputPort[]
  rotation: number
  summary?: string | null
  category?: string | null
  editable?: boolean
  onRotate?: (nodeId: string) => void
  parentGroupId?: string
  onRemoveFromGroup?: (nodeId: string) => void
  availableGroups?: Array<{ visualGroupId: string; groupName: string }>
  onAddToGroup?: (nodeId: string, groupId: string) => void
  /** When 'active', wrap node with orbiting border (history flow current node). Opt-in only. */
  status?: 'active' | 'idle' | null
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

export function SimulationGraphNode({ id, data, selected }: NodeProps) {
  const nodeData = data as SimulationNodeData
  const [groupPickerOpen, setGroupPickerOpen] = useState(false)
  const rotation = nodeData.rotation ?? 0
  const inputPos = inputPosition(rotation)
  const outputPos = outputPosition(rotation)

  const baseNodeEl = (
    <BaseNode
      className="w-[220px]"
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
      <BaseNodeHeader className="mb-0 flex-col items-start justify-start gap-0 py-1">
        <span className="flex w-full flex-row items-center justify-end gap-1 leading-none">
          <CircleDot
            size={11}
            aria-hidden="true"
            className="shrink-0"
            style={{ color: nodeData.color }}
          />
          <span
            className="text-right font-mono text-[10px] leading-none font-medium tracking-wide uppercase"
            style={{ color: nodeData.color }}
          >
            {nodeData.nodeType}
          </span>
        </span>
        <span className="-mt-px w-full text-left text-[13px] leading-tight font-semibold break-words whitespace-normal text-slate-800">
          {nodeData.label}
        </span>
      </BaseNodeHeader>
      {nodeData.summary && (
        <BaseNodeContent className="border-t border-slate-100 pt-1 text-left">
          <p className="text-muted-foreground line-clamp-2 text-xs leading-normal break-words">
            {nodeData.summary}
          </p>
        </BaseNodeContent>
      )}
      {nodeData.outputPorts.map((port, index) => (
        <BaseHandle
          key={port.id}
          id={port.id}
          type="source"
          position={outputPos}
          title={port.label}
          style={{
            ...handleOffset(outputPos, index, nodeData.outputPorts.length),
            background: port.edgeStyle.color,
          }}
        />
      ))}
    </BaseNode>
  )

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
        {nodeData.editable && nodeData.parentGroupId && nodeData.onRemoveFromGroup && (
          <button
            type="button"
            className="nodrag ml-1 inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[0.6rem] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
            onClick={() => nodeData.onRemoveFromGroup?.(id)}
            title="Remove node from visual group"
          >
            <LogOut className="h-3 w-3" />
          </button>
        )}
        {nodeData.editable &&
          !nodeData.parentGroupId &&
          nodeData.availableGroups?.length &&
          nodeData.onAddToGroup && (
            <div className="nodrag relative">
              <button
                type="button"
                className="ml-1 inline-flex items-center rounded bg-white px-1.5 py-0.5 text-[0.6rem] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
                onClick={() => setGroupPickerOpen((open) => !open)}
                title="Add node to visual group"
                aria-label="Add node to visual group"
                aria-expanded={groupPickerOpen}
              >
                <LogIn className="h-3 w-3" />
              </button>
              {groupPickerOpen && (
                <div className="absolute top-full left-0 z-30 mt-1 min-w-36 rounded-md border border-slate-200 bg-white p-1 text-left shadow-lg">
                  {nodeData.availableGroups.map((group) => (
                    <button
                      key={group.visualGroupId}
                      type="button"
                      className="block w-full truncate rounded px-2 py-1 text-left text-[0.65rem] text-slate-700 hover:bg-slate-100"
                      onClick={() => {
                        nodeData.onAddToGroup?.(id, group.visualGroupId)
                        setGroupPickerOpen(false)
                      }}
                    >
                      {group.groupName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
      </NodeToolbar>
      <NodeStatusIndicator status={nodeData.status ?? null}>{baseNodeEl}</NodeStatusIndicator>
    </>
  )
}
