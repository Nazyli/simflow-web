import { apiClient } from './client'

export type UsageInterval = 'daily' | 'weekly' | 'monthly'

export interface CurrencyAmount {
  currency: string
  amount: number
}

export interface AiUsageSummary {
  requestCount: number
  totalTokens: number
  inputTokens: number
  outputTokens: number
  averageTokensPerRequest: number
  participantCount: number
  costs: CurrencyAmount[]
}

export interface AiUsageTrendPoint {
  date: string
  requestCount: number
  totalTokens: number
  inputTokens: number
  outputTokens: number
}

export interface AiUsageAggregate {
  simulationId: string | null
  provider: string | null
  model: string | null
  serviceType: string | null
  requestCount: number
  totalTokens: number
  inputTokens: number
  outputTokens: number
  averageTokensPerRequest: number
  costs: CurrencyAmount[]
}

export interface AiUsageParticipant {
  participantId: string
  requestCount: number
  totalTokens: number
  inputTokens: number
  outputTokens: number
  averageTokensPerRequest: number
}

export interface AiUsageEvent {
  usageId: string
  executionId: string
  simulationId: string
  nodeExecutionId: string | null
  participantCallSessionId: string | null
  participantId: string
  activityType: string
  nodeType: string | null
  serviceType: string
  provider: string | null
  model: string | null
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cachedInputTokens: number | null
  reasoningOutputTokens: number | null
  audioDurationSeconds: number | null
  characterCount: number | null
  totalCost: number
  currency: string
  usageEventId: string
  capturedAt: string
}

export interface AiUsagePage<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface AiUsageFilterOptions {
  simulationIds: string[]
  providers: string[]
  models: string[]
  activityTypes: string[]
}

export interface AiUsageOverview {
  summary: AiUsageSummary
  trend: AiUsageTrendPoint[]
  bySimulation: AiUsageAggregate[]
  byModel: AiUsageAggregate[]
  tokenCategories: {
    cachedInputTokens: number
    reasoningOutputTokens: number
  }
  participants: AiUsagePage<AiUsageParticipant>
  filterOptions: AiUsageFilterOptions
}

export interface AiParticipantUsage {
  participantId: string
  summary: AiUsageSummary
  trend: AiUsageTrendPoint[]
  bySimulation: AiUsageAggregate[]
  byModel: AiUsageAggregate[]
  tokenCategories: {
    cachedInputTokens: number
    reasoningOutputTokens: number
  }
  events: AiUsagePage<AiUsageEvent>
}

export interface AiUsageFilters {
  from?: string
  to?: string
  simulationId?: string
  participantId?: string
  provider?: string
  model?: string
  activityType?: string
}

function queryString(filters: AiUsageFilters, values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...filters, ...values })) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  return params.toString()
}

export function getAiUsageOverview(
  filters: AiUsageFilters,
  interval: UsageInterval,
  page: number,
  pageSize: number,
) {
  const query = queryString(filters, { interval, page, pageSize })
  return apiClient<AiUsageOverview>(`/admin/ai-token-usage?${query}`)
}

export function getAiParticipantUsage(
  participantId: string,
  page: number,
  pageSize: number,
) {
  const query = queryString({}, { page, pageSize })
  return apiClient<AiParticipantUsage>(
    `/admin/ai-token-usage/participants/${encodeURIComponent(participantId)}?${query}`,
  )
}
