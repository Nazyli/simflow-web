import { Position, type XYPosition } from '@xyflow/react'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface RectBoundaryPoint extends XYPosition {
  position: Position
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

export function pointOnRectBoundary(rect: Rect, externalPoint: XYPosition): RectBoundaryPoint {
  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2
  const deltaX = externalPoint.x - centerX
  const deltaY = externalPoint.y - centerY
  const absoluteDeltaX = Math.abs(deltaX)
  const absoluteDeltaY = Math.abs(deltaY)

  if (absoluteDeltaX * rect.height >= absoluteDeltaY * rect.width) {
    const position = deltaX < 0 ? Position.Left : Position.Right
    const x = position === Position.Left ? rect.x : rect.x + rect.width
    const unclampedY =
      absoluteDeltaX === 0 ? centerY : centerY + (deltaY * (rect.width / 2)) / absoluteDeltaX
    const y = Math.max(rect.y, Math.min(rect.y + rect.height, unclampedY))
    return { x, y, position }
  }

  const position = deltaY < 0 ? Position.Top : Position.Bottom
  const y = position === Position.Top ? rect.y : rect.y + rect.height
  const unclampedX =
    absoluteDeltaY === 0 ? centerX : centerX + (deltaX * (rect.height / 2)) / absoluteDeltaY
  const x = Math.max(rect.x, Math.min(rect.x + rect.width, unclampedX))
  return { x, y, position }
}
