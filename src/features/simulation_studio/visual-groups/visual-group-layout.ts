import type { XYPosition } from '@xyflow/react'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface PositionedNode {
  id: string
  position: XYPosition
  parentId?: string
}

export function absoluteToParentPosition(position: XYPosition, parent: Rect): XYPosition {
  return { x: position.x - parent.x, y: position.y - parent.y }
}

export function parentToAbsolutePosition(position: XYPosition, parent: Rect): XYPosition {
  return { x: position.x + parent.x, y: position.y + parent.y }
}

export function translateGroupMembers<Node extends PositionedNode>(
  nodes: Node[],
  groupId: string,
  delta: XYPosition,
): Node[] {
  return nodes.map((node) =>
    node.parentId === groupId
      ? { ...node, position: { x: node.position.x + delta.x, y: node.position.y + delta.y } }
      : node,
  )
}

export function shouldDetachChild(child: Rect, group: Rect): boolean {
  const centerX = child.x + child.width / 2
  const centerY = child.y + child.height / 2
  return (
    centerX < group.x ||
    centerX > group.x + group.width ||
    centerY < group.y ||
    centerY > group.y + group.height
  )
}
