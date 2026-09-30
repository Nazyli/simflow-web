export interface UsageEvent {
  usage_id: string
  execution_id: string
  simulation_id: string
  node_execution_id: string | null
  participant_call_session_id: string | null
  participant_id: string
  activity_type: string
  node_type: string | null
  service_type: string
  provider: string | null
  model: string | null
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cached_input_tokens: number | null
  reasoning_output_tokens: number | null
  audio_duration_seconds: number | null
  character_count: number | null
  total_cost: number
  currency: string
  usage_event_id: string
  captured_at: string
}

export interface UsageFilters {
  from?: string
  to?: string
  simulationId?: string
  participantId?: string
  provider?: string
  model?: string
  activityType?: string
}

export interface CurrencyAmount {
  currency: string
  amount: number
}

export interface UsageSummary {
  totalTokens: number
  totalCostByCurrency: CurrencyAmount[]
  totalRequests: number
  totalParticipants: number
  averageTokensPerRequest: number
}

export interface ParticipantUsage {
  participantId: string
  requests: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  averageTokensPerRequest: number
  costByCurrency?: CurrencyAmount[]
  lastActivity?: string
}

export interface DimensionUsage {
  id: string
  label: string
  provider?: string
  requests: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costByCurrency: CurrencyAmount[]
  contributionPercent: number
}

export interface UsageTimeBucket {
  key: string
  label: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface TokenCompositionItem {
  id: 'input' | 'output' | 'cached_input' | 'reasoning_output'
  label: string
  tokens: number
}
