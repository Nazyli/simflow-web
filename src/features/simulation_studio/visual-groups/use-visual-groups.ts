import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Node } from '@xyflow/react'
import type { VisualGroup } from '../../../shared/types/simulation'
import {
  cleanupVisualGroups,
  createVisualGroup,
  detachVisualGroupMember,
  ungroupVisualGroup,
} from './visual-group-actions'
import { projectWorkflowNodes } from './visual-group-projection'
import type { GroupDefaults, VisualGroupNode } from './visual-group-types'

interface UseVisualGroupsOptions {
  simulationId: string | null
  initialGroups: VisualGroup[]
  editable: boolean
  save: (groups: VisualGroup[]) => Promise<unknown>
}

export function useVisualGroups({
  simulationId,
  initialGroups,
  editable,
  save,
}: UseVisualGroupsOptions) {
  const [groups, setGroups] = useState<VisualGroup[]>(initialGroups)

  useEffect(() => {
    setGroups(initialGroups)
  }, [initialGroups, simulationId])

  const commitGroups = useCallback(
    async (nextGroups: VisualGroup[]) => {
      setGroups(nextGroups)
      await save(nextGroups)
    },
    [save],
  )

  const createGroup = useCallback(
    async (nodes: Node[], selectedNodeIds: string[], defaults: GroupDefaults) => {
      if (!editable) return
      const draft = createVisualGroup(nodes, selectedNodeIds, defaults)
      const group: VisualGroup = {
        visualGroupId: crypto.randomUUID(),
        ...draft,
      }
      await commitGroups([...groups, group])
    },
    [commitGroups, editable, groups],
  )

  const detachMember = useCallback(
    async (groupId: string, nodeId: string) => {
      if (!editable) return
      const current = groups.find((group) => group.visualGroupId === groupId)
      const next = detachVisualGroupMember(current ?? null, nodeId)
      await commitGroups(
        next
          ? groups.map((group) => (group.visualGroupId === groupId ? next : group))
          : ungroupVisualGroup(groups, groupId),
      )
    },
    [commitGroups, editable, groups],
  )

  const ungroup = useCallback(
    async (groupId: string) => {
      if (!editable) return
      await commitGroups(ungroupVisualGroup(groups, groupId))
    },
    [commitGroups, editable, groups],
  )

  const deleteNodeMembership = useCallback(
    async (nodeId: string) => {
      if (!editable) return
      await commitGroups(cleanupVisualGroups(groups, new Set([nodeId])))
    },
    [commitGroups, editable, groups],
  )

  const toggleCollapsed = useCallback(
    async (groupId: string) => {
      if (!editable) return
      await commitGroups(
        groups.map((group) =>
          group.visualGroupId === groupId ? { ...group, isCollapsed: !group.isCollapsed } : group,
        ),
      )
    },
    [commitGroups, editable, groups],
  )

  const updateGroup = useCallback(
    async (groupId: string, patch: Partial<VisualGroup>) => {
      if (!editable) return
      await commitGroups(
        groups.map((group) =>
          group.visualGroupId === groupId ? { ...group, ...patch, visualGroupId: groupId } : group,
        ),
      )
    },
    [commitGroups, editable, groups],
  )

  const cycleColor = useCallback(
    async (groupId: string) => {
      const palette = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626']
      const group = groups.find((item) => item.visualGroupId === groupId)
      if (!group) return
      const currentIndex = palette.indexOf(group.style.color)
      const color = palette[(currentIndex + 1) % palette.length]
      await updateGroup(groupId, { style: { ...group.style, color } })
    },
    [groups, updateGroup],
  )

  const projectNodes = useCallback(
    (workflowNodes: Node[]): Node[] => projectWorkflowNodes(workflowNodes, groups),
    [groups],
  )

  const groupNodes = useMemo<VisualGroupNode[]>(
    () =>
      groups.map((group) => ({
        id: group.visualGroupId,
        type: 'visualGroup',
        position: { x: group.positionX, y: group.positionY },
        style: { width: group.width, height: group.height },
        draggable: editable,
        connectable: false,
        selectable: true,
        zIndex: 0,
        dragHandle: '.visual-group-header',
        data: {
          group,
          editable,
          onDelete: (groupId) => void ungroup(groupId),
          onUngroup: (groupId) => void ungroup(groupId),
          onRename: (groupId, name) => void updateGroup(groupId, { groupName: name }),
          onCycleColor: (groupId) => void cycleColor(groupId),
          onToggleCollapsed: (groupId) => void toggleCollapsed(groupId),
          onResize: (groupId, width, height) =>
            void updateGroup(groupId, { width: Math.round(width), height: Math.round(height) }),
        },
      })),
    [cycleColor, editable, groups, toggleCollapsed, ungroup, updateGroup],
  )

  return {
    groups,
    groupNodes,
    projectNodes,
    createGroup,
    detachMember,
    deleteNodeMembership,
    ungroup,
    toggleCollapsed,
    updateGroup,
    commitGroups,
  }
}

export function groupNodeToApiPosition(groupNode: Node): { x: number; y: number } {
  return { x: Math.round(groupNode.position.x), y: Math.round(groupNode.position.y) }
}
