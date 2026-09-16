import { useQuery } from '@tanstack/react-query'

import { getNodeCatalog } from '../../../shared/api/node-catalog'
import type { NodeCatalog, TemplateContract } from '../../../shared/types/simulation'

export function findTemplateContract(
  catalog: NodeCatalog | undefined,
  nodeType: string,
  field: string,
): TemplateContract | undefined {
  return catalog?.nodes
    .find((node) => node.nodeType === nodeType)
    ?.templateContracts?.find((contract) => contract.field === field)
}

export function useTemplateContract(nodeType: string, field: string) {
  const catalogQuery = useQuery({
    queryKey: ['node-catalog'],
    queryFn: getNodeCatalog,
  })
  return {
    ...catalogQuery,
    contract: findTemplateContract(catalogQuery.data, nodeType, field),
  }
}
