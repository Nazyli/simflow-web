import { apiClient } from './client'
import type { VisualGroup } from '../types/simulation'

export type VisualGroupPayload = Omit<VisualGroup, 'simulationId' | 'visualGroupId'> & {
  visualGroupId?: string
}

export const replaceVisualGroups = (simulationId: string, visualGroups: VisualGroupPayload[]) =>
  apiClient<VisualGroup[]>(
    `/studio/simulations/${encodeURIComponent(simulationId)}/visual-groups`,
    {
      method: 'PUT',
      body: JSON.stringify({ visualGroups }),
    },
  )
