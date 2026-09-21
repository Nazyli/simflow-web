import type { NodeCatalog, NodeDefinition } from '../../shared/types/simulation'

export interface NodePaletteEntry {
  definition: NodeDefinition
  parameters: Record<string, unknown>
}

export interface NodePaletteGroup {
  id: string
  label: string
  entries: NodePaletteEntry[]
}

export function buildNodePaletteGroups(catalog: NodeCatalog | undefined): NodePaletteGroup[] {
  if (!catalog) return []

  return catalog.paletteGroups
    .map((group) => ({
      ...group,
      entries: catalog.nodes
        .filter((definition) => definition.paletteGroups.includes(group.id))
        .map((definition) => ({
          definition,
          parameters: {
            ...definition.parameters,
            ...(definition.paletteParameters[group.id] ?? {}),
          },
        })),
    }))
    .filter((group) => group.entries.length > 0)
}
