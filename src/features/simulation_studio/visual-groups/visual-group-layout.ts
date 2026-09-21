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

interface VisualGroupLayoutGroup {
  visualGroupId: string
  memberNodeIds: string[]
}

interface VisualGroupLayoutNode {
  id: string
  position: XYPosition
  width?: number
  height?: number
}

export function computeVisualGroupLayouts(
  groups: VisualGroupLayoutGroup[],
  nodes: VisualGroupLayoutNode[],
  options: { padding?: number; headerHeight?: number } = {},
): Map<string, Rect> {
  const padding = options.padding ?? 32
  const headerHeight = options.headerHeight ?? 32
  const minimumWidth = 180
  const minimumHeight = 100
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const layouts = new Map<string, Rect>()

  groups.forEach((group) => {
    const members = group.memberNodeIds
      .map((nodeId) => nodesById.get(nodeId))
      .filter((node): node is VisualGroupLayoutNode => Boolean(node))
    if (members.length === 0) return

    const bounds = members.reduce(
      (result, node) => {
        const width = node.width ?? 200
        const height = node.height ?? 90
        return {
          minX: Math.min(result.minX, node.position.x),
          minY: Math.min(result.minY, node.position.y),
          maxX: Math.max(result.maxX, node.position.x + width),
          maxY: Math.max(result.maxY, node.position.y + height),
        }
      },
      {
        minX: Number.POSITIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
      },
    )

    layouts.set(group.visualGroupId, {
      x: bounds.minX - padding,
      y: bounds.minY - padding,
      width: Math.max(minimumWidth, bounds.maxX - bounds.minX + padding * 2),
      height: Math.max(minimumHeight, bounds.maxY - bounds.minY + padding * 2 + headerHeight),
    })
  })

  return layouts
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
