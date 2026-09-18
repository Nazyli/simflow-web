import { type ReactNode } from 'react'

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react'

export type EdgePathType = 'default' | 'straight' | 'step' | 'smoothstep'

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

export function ButtonEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  children,
  data,
  animated,
}: EdgeProps & { children: ReactNode; animated?: boolean }) {
  const edgeType = (data as { edgeType?: EdgePathType } | undefined)?.edgeType ?? 'default'
  const edgeData = data as { style?: { color?: string; animated?: boolean } } | undefined
  const isAnimated = Boolean(animated) || Boolean(edgeData?.style?.animated)
  const dotColor =
    (typeof style === 'object' && style !== null && 'stroke' in style
      ? (style as { stroke?: string }).stroke
      : undefined) ??
    edgeData?.style?.color ??
    '#dc2626'
  const [edgePath, labelX, labelY] = getPath(edgeType, {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {isAnimated && (
        <circle r="5" fill={dotColor} stroke="#fff" strokeWidth={1} style={{ pointerEvents: 'none' }}>
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          {children}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
