import { NodeResizer, NodeToolbar, Position, type NodeProps } from '@xyflow/react'
import { ChevronDown, ChevronRight, Layers3, Palette, Pencil, Trash2, Ungroup } from 'lucide-react'
import type { VisualGroupNode } from './visual-group-types'

export function SimulationVisualGroupNode({ id, data, selected }: NodeProps<VisualGroupNode>) {
  const group = data.group
  const borderStyle = group.style.borderStyle

  return (
    <>
      <NodeResizer
        isVisible={selected && data.editable}
        minWidth={180}
        minHeight={100}
        onResizeEnd={(_, params) => data.onResize?.(id, params.width, params.height)}
        lineStyle={{ borderColor: group.style.color }}
        handleStyle={{ backgroundColor: group.style.color, borderColor: 'white' }}
      />
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="nodrag flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-md">
          <button
            type="button"
            className="rounded p-1 text-slate-600 hover:bg-slate-100"
            onClick={() => data.onToggleCollapsed?.(id)}
            title={group.isCollapsed ? 'Expand group' : 'Collapse group'}
          >
            {group.isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            type="button"
            className="rounded p-1 text-slate-600 hover:bg-slate-100"
            onClick={() => {
              const nextName = window.prompt('Visual group name', group.groupName)?.trim()
              if (nextName) data.onRename?.(id, nextName)
            }}
            title="Rename group"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            className="rounded p-1 text-slate-600 hover:bg-slate-100"
            onClick={() => data.onCycleColor?.(id)}
            title="Change group color"
          >
            <Palette size={13} />
          </button>
          <button
            type="button"
            className="rounded p-1 text-slate-600 hover:bg-slate-100"
            onClick={() => data.onUngroup?.(id)}
            title="Ungroup"
          >
            <Ungroup size={13} />
          </button>
          <button
            type="button"
            className="rounded p-1 text-red-600 hover:bg-red-50"
            onClick={() => data.onDelete?.(id)}
            title="Delete group"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </NodeToolbar>
      <div
        className="visual-group-node h-full w-full overflow-visible rounded-xl border-2 bg-white/60 shadow-sm backdrop-blur-[1px]"
        style={{ borderColor: group.style.color, borderStyle }}
      >
        <div
          className="visual-group-header flex h-8 cursor-grab items-center gap-2 rounded-t-[10px] px-3 text-xs font-semibold text-slate-700"
          style={{ backgroundColor: `${group.style.color}18` }}
        >
          <Layers3 size={13} style={{ color: group.style.color }} />
          <span className="truncate">{group.groupName}</span>
          <span className="ml-auto text-[10px] font-normal text-slate-400">
            {group.memberNodeIds.length}
          </span>
        </div>
      </div>
    </>
  )
}
