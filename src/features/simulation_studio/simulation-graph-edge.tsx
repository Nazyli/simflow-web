import { X } from 'lucide-react'
import { useEffect } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react'
import { type EdgePathType } from '@/components/button-edge'
import { Button } from '@/components/ui/button'
import { pointOnRectBoundary, type Rect } from './visual-groups/visual-group-layout'

type SimulationEdgeData = {
  label: string
  style: { color: string; lineStyle: string; animated: boolean }
  emphasis?: 'participant' | 'background'
  edgeType?: EdgePathType
  onDelete?: (edgeId: string) => void
  collapsedSourceRect?: Rect
  collapsedTargetRect?: Rect
  /** Reports the rendered path + endpoints back to the parent so the flow can draw one combined traveling dot. */
  onPathReady?: (
    edgeId: string,
    report: { path: string; sx: number; sy: number; tx: number; ty: number },
  ) => void
}

type PathProps = Pick<
  EdgeProps,
  'sourceX' | 'sourceY' | 'sourcePosition' | 'targetX' | 'targetY' | 'targetPosition'
>

function getPath(type: EdgePathType, props: PathProps): ReturnType<typeof getBezierPath> {
  const common = {
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  }
  switch (type) {
    case 'straight':
      return getStraightPath(common)
    case 'step':
      return getSmoothStepPath({ ...common, borderRadius: 0 })
    case 'smoothstep':
      return getSmoothStepPath({ ...common, borderRadius: 90 })
    default:
      return getBezierPath(common)
  }
}

export function SimulationGraphEdge({
  id: _id,
  source: _source,
  target: _target,
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
  const edgeData = data as SimulationEdgeData
  const label = edgeData?.label ?? ''
  const style = edgeData?.style ?? { color: '#94a3b8', lineStyle: 'solid', animated: false }
  const isParticipantPath = edgeData?.emphasis === 'participant'
  const isBackgroundEdge = edgeData?.emphasis === 'background'
  const edgeType = edgeData?.edgeType ?? 'default'
  const onDelete = edgeData?.onDelete
  const sourceBoundary = edgeData?.collapsedSourceRect
    ? pointOnRectBoundary(edgeData.collapsedSourceRect, { x: targetX, y: targetY })
    : undefined
  const targetBoundary = edgeData?.collapsedTargetRect
    ? pointOnRectBoundary(edgeData.collapsedTargetRect, { x: sourceX, y: sourceY })
    : undefined
  const stroke = selected ? '#9929EA' : style.color
  const labelOffset = -18

  const effectiveSourceX = sourceBoundary?.x ?? sourceX
  const effectiveSourceY = sourceBoundary?.y ?? sourceY
  const effectiveSourcePosition = sourceBoundary?.position ?? sourcePosition ?? Position.Right
  const effectiveTargetX = targetBoundary?.x ?? targetX
  const effectiveTargetY = targetBoundary?.y ?? targetY
  const effectiveTargetPosition = targetBoundary?.position ?? targetPosition ?? Position.Left

  const [edgePath, labelX, labelY] = getPath(edgeType, {
    sourceX: effectiveSourceX,
    sourceY: effectiveSourceY,
    sourcePosition: effectiveSourcePosition,
    targetX: effectiveTargetX,
    targetY: effectiveTargetY,
    targetPosition: effectiveTargetPosition,
  })

  // Report this edge's rendered path + endpoint so the parent can build one
  // dot that travels the whole participant path sequentially.
  useEffect(() => {
    edgeData?.onPathReady?.(_id, {
      path: edgePath,
      sx: effectiveSourceX,
      sy: effectiveSourceY,
      tx: effectiveTargetX,
      ty: effectiveTargetY,
    })
  }, [
    _id,
    edgePath,
    effectiveSourceX,
    effectiveSourceY,
    effectiveTargetX,
    effectiveTargetY,
    edgeData?.onPathReady,
  ])

  return (
    <>
      {isParticipantPath && (
        <BaseEdge
          path={edgePath}
          className="history-edge-participant-halo"
          style={{
            stroke: stroke,
            strokeWidth: 7,
            opacity: 0.14,
            filter: 'blur(3px)',
            pointerEvents: 'none',
          }}
        />
      )}
      <BaseEdge
        path={edgePath}
        className={
          isParticipantPath
            ? 'history-edge-participant'
            : isBackgroundEdge
              ? 'history-edge-background'
              : undefined
        }
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: isParticipantPath ? 2.25 : selected ? 2.5 : 1.5,
          opacity: isBackgroundEdge ? 0.56 : 1,
          filter: isParticipantPath ? 'drop-shadow(0 0 3px rgba(124,58,237,0.5))' : undefined,
          strokeDasharray:
            style.lineStyle === 'dashed' ? '6 4' : style.lineStyle === 'dotted' ? '2 3' : undefined,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={`nodrag nopan pointer-events-auto absolute z-10 flex items-center gap-0.5 rounded-full border p-0.5 shadow-sm backdrop-blur-sm ${isParticipantPath ? 'history-edge-label--participant' : ''} ${isBackgroundEdge ? 'history-edge-label--background' : ''}`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px) translateY(${labelOffset}px)`,
          }}
        >
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="text-foreground/80 hover:bg-background/50 hover:text-foreground h-auto gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-medium"
          >
            <span className="max-w-[180px] truncate">{label}</span>
          </Button>
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="nodrag text-muted-foreground size-5 rounded-full"
              onClick={() => onDelete(_id)}
              aria-label={`Delete edge ${label}`}
            >
              <X />
            </Button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
