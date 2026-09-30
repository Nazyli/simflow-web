import type {
  AiParticipantUsage,
  AiUsageAggregate,
  AiUsageEvent,
  AiUsageOverview,
  AiUsageParticipant,
  AiUsageSummary,
  AiUsageTrendPoint,
  UsageInterval,
} from '../../shared/api/ai-token-usage'
import type {
  DimensionUsage,
  ParticipantUsage,
  TokenCompositionItem,
  UsageEvent,
  UsageSummary,
  UsageTimeBucket,
} from './usage-types'

export function adaptSummary(summary: AiUsageSummary): UsageSummary {
  return {
    totalTokens: summary.totalTokens,
    totalCostByCurrency: summary.costs,
    totalRequests: summary.requestCount,
    totalParticipants: summary.participantCount,
    averageTokensPerRequest: summary.averageTokensPerRequest,
  }
}

export function adaptParticipants(rows: AiUsageParticipant[]): ParticipantUsage[] {
  return rows.map((row) => ({
    participantId: row.participantId,
    requests: row.requestCount,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    totalTokens: row.totalTokens,
    averageTokensPerRequest: row.averageTokensPerRequest,
  }))
}

function displayBucketLabel(value: string, interval: UsageInterval): string {
  const dateValue = value.length === 7 ? `${value}-01` : value
  const date = new Date(`${dateValue}T00:00:00Z`)
  const options: Intl.DateTimeFormatOptions =
    interval === 'monthly'
      ? { month: 'short', year: 'numeric' }
      : { month: 'short', day: 'numeric' }
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(date)
}

export function adaptTrend(rows: AiUsageTrendPoint[], interval: UsageInterval): UsageTimeBucket[] {
  return rows.map((row) => ({
    key: row.date,
    label: displayBucketLabel(row.date, interval),
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    totalTokens: row.totalTokens,
  }))
}

export function adaptDimensions(
  rows: AiUsageAggregate[],
  dimension: 'simulation' | 'model',
  totalTokens: number,
): DimensionUsage[] {
  return rows.map((row) => ({
    id:
      dimension === 'simulation'
        ? (row.simulationId ?? 'unknown-simulation')
        : `${row.provider ?? 'unknown-provider'}\u0000${row.model ?? 'unknown-model'}\u0000${row.serviceType ?? 'unknown-service'}`,
    label:
      dimension === 'simulation'
        ? (row.simulationId ?? 'Unknown simulation')
        : (row.model ?? 'Unknown model'),
    ...(dimension === 'model' ? { provider: row.provider ?? undefined } : {}),
    requests: row.requestCount,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    totalTokens: row.totalTokens,
    costByCurrency: row.costs,
    contributionPercent: totalTokens ? (row.totalTokens / totalTokens) * 100 : 0,
  }))
}

export function adaptComposition(
  response: AiUsageOverview | AiParticipantUsage,
): TokenCompositionItem[] {
  const values: TokenCompositionItem[] = [
    { id: 'input', label: 'Input Tokens', tokens: response.summary.inputTokens },
    { id: 'output', label: 'Output Tokens', tokens: response.summary.outputTokens },
    {
      id: 'cached_input',
      label: 'Cached Input Tokens',
      tokens: response.tokenCategories.cachedInputTokens,
    },
    {
      id: 'reasoning_output',
      label: 'Reasoning Output Tokens',
      tokens: response.tokenCategories.reasoningOutputTokens,
    },
  ]
  return values.filter((item) => item.tokens > 0)
}

export function adaptEvent(row: AiUsageEvent): UsageEvent {
  return {
    usage_id: row.usageId,
    execution_id: row.executionId,
    simulation_id: row.simulationId,
    node_execution_id: row.nodeExecutionId,
    participant_call_session_id: row.participantCallSessionId,
    participant_id: row.participantId,
    activity_type: row.activityType,
    node_type: row.nodeType,
    service_type: row.serviceType,
    provider: row.provider,
    model: row.model,
    input_tokens: row.inputTokens,
    output_tokens: row.outputTokens,
    total_tokens: row.totalTokens,
    cached_input_tokens: row.cachedInputTokens,
    reasoning_output_tokens: row.reasoningOutputTokens,
    audio_duration_seconds: row.audioDurationSeconds,
    character_count: row.characterCount,
    total_cost: row.totalCost,
    currency: row.currency,
    usage_event_id: row.usageEventId,
    captured_at: row.capturedAt,
  }
}
