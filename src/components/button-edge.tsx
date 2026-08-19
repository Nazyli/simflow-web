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
}: EdgeProps & { children: ReactNode }) {
  const edgeType = (data as { edgeType?: EdgePathType } | undefined)?.edgeType ?? 'default'
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
