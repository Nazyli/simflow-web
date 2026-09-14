import type { Node } from '@xyflow/react'
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
