import type { VisualGroup } from '../../../shared/types/simulation'
import type { GroupDefaults, VisualGroupDraft } from './visual-group-types'

const GROUP_PADDING = 32
const GROUP_HEADER_HEIGHT = 32
const MIN_GROUP_WIDTH = 180
const MIN_GROUP_HEIGHT = 100

interface MeasuredNode {
  id: string
  position: { x: number; y: number }
  measured?: { width?: number; height?: number }
  width?: number
  height?: number
}

type VisualGroupMembership = Pick<VisualGroup, 'memberNodeIds' | 'visualGroupId'> &
  Partial<VisualGroup>

export function createVisualGroup(
  nodes: MeasuredNode[],
  selectedNodeIds: string[],
  defaults: GroupDefaults,
): VisualGroupDraft {
  const selected = nodes.filter((node) => selectedNodeIds.includes(node.id))
  if (selected.length < 2) throw new Error('Select at least two nodes to create a group.')

  const bounds = selected.reduce(
    (result, node) => {
      const width = node.measured?.width ?? node.width ?? 220
      const height = node.measured?.height ?? node.height ?? 90
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

  return {
    simulationId: defaults.simulationId,
    groupName: defaults.groupName ?? 'New group',
    memberNodeIds: [...new Set(selectedNodeIds)],
    positionX: bounds.minX - GROUP_PADDING,
    positionY: bounds.minY - GROUP_PADDING,
    width: Math.max(MIN_GROUP_WIDTH, bounds.maxX - bounds.minX + GROUP_PADDING * 2),
    height: Math.max(
      MIN_GROUP_HEIGHT,
      bounds.maxY - bounds.minY + GROUP_PADDING * 2 + GROUP_HEADER_HEIGHT,
    ),
    style: defaults.style ?? { color: '#7c3aed', borderStyle: 'dashed' },
    isCollapsed: defaults.isCollapsed ?? false,
  }
}

export function detachVisualGroupMember<T extends VisualGroupMembership>(
  group: T | null,
  nodeId: string,
): T | null {
  if (!group) return null
  const memberNodeIds = group.memberNodeIds.filter((memberId) => memberId !== nodeId)
  return memberNodeIds.length ? { ...group, memberNodeIds } : null
}

export function attachVisualGroupMember<T extends VisualGroupMembership>(
  groups: T[],
  groupId: string,
  nodeId: string,
): T[] {
  if (!groups.some((group) => group.visualGroupId === groupId)) return groups
  return groups.flatMap((group) => {
    const memberNodeIds =
      group.visualGroupId === groupId
        ? [...new Set([...group.memberNodeIds, nodeId])]
        : group.memberNodeIds.filter((memberId) => memberId !== nodeId)
    return memberNodeIds.length ? [{ ...group, memberNodeIds }] : []
  })
}

export function ungroupVisualGroup<T extends Pick<VisualGroup, 'visualGroupId'>>(
  groups: T[],
  groupId: string,
): T[] {
  return groups.filter((group) => group.visualGroupId !== groupId)
}

export function cleanupVisualGroups<T extends Pick<VisualGroup, 'memberNodeIds'>>(
  groups: T[],
  deletedNodeIds: Set<string>,
): T[] {
  return groups.flatMap((group) => {
    const memberNodeIds = group.memberNodeIds.filter((nodeId) => !deletedNodeIds.has(nodeId))
    return memberNodeIds.length ? [{ ...group, memberNodeIds }] : []
  })
}
