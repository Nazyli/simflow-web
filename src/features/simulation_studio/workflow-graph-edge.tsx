import { X } from 'lucide-react'
import type { EdgeProps } from '@xyflow/react'
import { ButtonEdge, type EdgePathType } from '@/components/button-edge'
import { Button } from '@/components/ui/button'

type WorkflowEdgeData = {
  priority: number
  label: string
  style: { color: string; line_style: string; animated: boolean }
  edgeType?: EdgePathType
  onDelete?: (edgeId: string) => void
}

export function WorkflowGraphEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  data,
  selected,
}: EdgeProps) {
  const edgeData = data as WorkflowEdgeData
  const priority = edgeData?.priority ?? 0
  const label = edgeData?.label ?? ''
  const style = edgeData?.style ?? { color: '#94a3b8', line_style: 'solid', animated: false }
  const edgeType = edgeData?.edgeType ?? 'default'
  const onDelete = edgeData?.onDelete
  const stroke = selected ? '#5b46c5' : style.color
  const labelOffset = priority % 2 === 0 ? -18 : 18
  return (
    <ButtonEdge
      id={id}
      source={source}
      target={target}
      sourceX={sourceX}
      sourceY={sourceY}
      sourcePosition={sourcePosition}
      targetX={targetX}
      targetY={targetY}
      targetPosition={targetPosition}
      markerEnd={markerEnd}
      data={{ edgeType }}
      style={{
        stroke,
        strokeWidth: selected ? 2.5 : 1.5,
        strokeDasharray:
          style.line_style === 'dashed' ? '6 4' : style.line_style === 'dotted' ? '2 3' : undefined,
      }}
    >
      <div
        className="bg-background ring-border flex items-center gap-1 rounded-full p-1 shadow-sm ring-1"
        style={{ transform: `translateY(${labelOffset}px)` }}
      >
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="text-muted-foreground h-auto gap-1 rounded-full px-2 py-0.5 text-[0.65rem]"
        >
          <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-px text-[0.6rem] font-bold">
            P{priority}
          </span>
          <span className="max-w-[180px] truncate">{label}</span>
        </Button>
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="nodrag text-muted-foreground size-5 rounded-full"
            onClick={() => onDelete(id)}
            aria-label={`Delete edge ${label}`}
          >
            <X />
          </Button>
        )}
      </div>
    </ButtonEdge>
  )
}
