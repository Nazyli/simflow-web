import type { NodeCatalog, NodeDefinition } from '../../shared/types/simulation'

export const PALETTE_NODE_TYPE_DATA = 'application/simulation-builder-node-type'
export const PALETTE_NODE_PARAMETERS_DATA = 'application/simulation-builder-node-parameters'

export interface NodePaletteEntry {
  definition: NodeDefinition
  parameters: Record<string, unknown>
}

export interface NodePaletteGroup {
  id: string
  label: string
  entries: NodePaletteEntry[]
  density: 'compact' | 'regular'
}

export function readPaletteDragParameters(
  dataTransfer: Pick<DataTransfer, 'getData'>,
): Record<string, unknown> | undefined {
  const serialized = dataTransfer.getData(PALETTE_NODE_PARAMETERS_DATA)
  if (!serialized) return undefined

  try {
    const parsed: unknown = JSON.parse(serialized)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined
    return parsed as Record<string, unknown>
  } catch {
    return undefined
  }
}

export function buildNodePaletteGroups(catalog: NodeCatalog | undefined): NodePaletteGroup[] {
  if (!catalog) return []

  return catalog.paletteGroups
    .map((group) => {
      const entries = catalog.nodes
        .filter((definition) => definition.paletteGroups.includes(group.id))
        .map((definition) => ({
          definition,
          parameters: {
            ...definition.parameters,
            ...(definition.paletteParameters[group.id] ?? {}),
          },
        }))
      const density: NodePaletteGroup['density'] = entries.length >= 6 ? 'compact' : 'regular'

      return {
        ...group,
        entries,
        density,
      }
    })
    .filter((group) => group.entries.length > 0)
}
