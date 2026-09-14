import type { Node } from '@xyflow/react'
import type { ApiEdge } from '../../../shared/api/simulations'
import type { VisualGroup } from '../../../shared/types/simulation'
import { absoluteToParentPosition, type Rect } from './visual-group-layout'

export function projectWorkflowNodes(workflowNodes: Node[], groups: VisualGroup[]): Node[] {
  const groupByNodeId = new Map<string, VisualGroup>()
  groups.forEach((group) =>
    group.memberNodeIds.forEach((nodeId) => groupByNodeId.set(nodeId, group)),
  )

  return workflowNodes.map((node) => {
    const group = groupByNodeId.get(node.id)
    if (!group) return node
    const parent: Rect = {
      x: group.positionX,
      y: group.positionY,
      width: group.width,
      height: group.height,
    }
    return {
      ...node,
      parentId: group.visualGroupId,
      position: absoluteToParentPosition(node.position, parent),
      hidden: group.isCollapsed,
      zIndex: 1,
    }
  })
}

export interface ProjectedWorkflowEdge extends ApiEdge {
  hidden: boolean
  sourceGroupId?: string
  targetGroupId?: string
  visualSourceNodeId?: string
  visualTargetNodeId?: string
  visualSourceHandleId?: string
  visualTargetHandleId?: string
}

export function projectWorkflowEdges(
  workflowEdges: ApiEdge[],
  groups: VisualGroup[],
): ProjectedWorkflowEdge[] {
  const groupByNodeId = new Map<string, VisualGroup>()
  groups.forEach((group) =>
    group.memberNodeIds.forEach((nodeId) => groupByNodeId.set(nodeId, group)),
  )

  return workflowEdges.map((edge) => {
    const sourceGroup = groupByNodeId.get(edge.sourceNodeId)
    const targetGroup = groupByNodeId.get(edge.targetNodeId)
    const isInternalCollapsedEdge = Boolean(
      sourceGroup?.isCollapsed &&
      targetGroup?.isCollapsed &&
      sourceGroup.visualGroupId === targetGroup.visualGroupId,
    )

    return {
      ...edge,
      hidden: isInternalCollapsedEdge,
      sourceGroupId:
        sourceGroup?.isCollapsed && !isInternalCollapsedEdge
          ? sourceGroup.visualGroupId
          : undefined,
      targetGroupId:
        targetGroup?.isCollapsed && !isInternalCollapsedEdge
          ? targetGroup.visualGroupId
          : undefined,
      visualSourceNodeId:
        sourceGroup?.isCollapsed && !isInternalCollapsedEdge
          ? sourceGroup.visualGroupId
          : undefined,
      visualSourceHandleId:
        sourceGroup?.isCollapsed && !isInternalCollapsedEdge
          ? 'visual-group-source'
          : undefined,
      visualTargetNodeId:
        targetGroup?.isCollapsed && !isInternalCollapsedEdge
          ? targetGroup.visualGroupId
          : undefined,
      visualTargetHandleId:
        targetGroup?.isCollapsed && !isInternalCollapsedEdge
          ? 'visual-group-target'
          : undefined,
    }
  })
}
