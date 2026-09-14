import type { Node } from '@xyflow/react'
import type { VisualGroup, VisualGroupStyle } from '../../../shared/types/simulation'

export interface VisualGroupNodeData {
  [key: string]: unknown
  group: VisualGroup
  editable: boolean
  onRename?: (groupId: string, name: string) => void
  onDelete?: (groupId: string) => void
  onUngroup?: (groupId: string) => void
  onCycleColor?: (groupId: string) => void
  onToggleCollapsed?: (groupId: string) => void
  onResize?: (groupId: string, width: number, height: number) => void
}

export interface GroupDefaults {
  simulationId: string
  groupName?: string
  style?: VisualGroupStyle
  isCollapsed?: boolean
}

export type VisualGroupNode = Node<VisualGroupNodeData, 'visualGroup'>

export interface VisualGroupDraft {
  visualGroupId?: string
  simulationId: string
  groupName: string
  memberNodeIds: string[]
  positionX: number
  positionY: number
  width: number
  height: number
  style: VisualGroupStyle
  isCollapsed: boolean
}
