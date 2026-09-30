import type {
  CurrencyAmount,
  DimensionUsage,
  ParticipantUsage,
  TokenCompositionItem,
  UsageEvent,
  UsageFilters,
  UsageSummary,
  UsageTimeBucket,
} from './usage-types'

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function parsedDate(value: string): Date {
  return new Date(/(?:z$|[+-]\d{2}:?\d{2}$)/i.test(value) ? value : `${value}Z`)
}

function dateKey(value: string): string {
  const parts = dateKeyFormatter.formatToParts(parsedDate(value))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

function costTotals(events: UsageEvent[]): CurrencyAmount[] {
  const totals = new Map<string, number>()
  for (const event of events) {
    totals.set(event.currency, (totals.get(event.currency) ?? 0) + event.total_cost)
  }
  return [...totals.entries()]
    .map(([currency, amount]) => ({ currency, amount: Math.round(amount * 1e8) / 1e8 }))
    .sort((left, right) => left.currency.localeCompare(right.currency))
}

function sum(events: UsageEvent[], key: 'input_tokens' | 'output_tokens' | 'total_tokens'): number {
  return events.reduce((total, event) => total + (event[key] ?? 0), 0)
}

export function filterUsageEvents(events: UsageEvent[], filters: UsageFilters): UsageEvent[] {
  return events.filter((event) => {
    const capturedDate = dateKey(event.captured_at)
    return (
      (!filters.from || capturedDate >= filters.from) &&
      (!filters.to || capturedDate <= filters.to) &&
      (!filters.simulationId || event.simulation_id === filters.simulationId) &&
      (!filters.participantId || event.participant_id === filters.participantId) &&
      (!filters.provider || event.provider === filters.provider) &&
      (!filters.model || event.model === filters.model) &&
      (!filters.activityType || event.activity_type === filters.activityType)
    )
  })
}

export function summarizeUsage(events: UsageEvent[]): UsageSummary {
  const totalTokens = sum(events, 'total_tokens')
  return {
    totalTokens,
    totalCostByCurrency: costTotals(events),
    totalRequests: events.length,
    totalParticipants: new Set(events.map((event) => event.participant_id)).size,
    averageTokensPerRequest: events.length ? totalTokens / events.length : 0,
  }
}

export function aggregateParticipants(events: UsageEvent[]): ParticipantUsage[] {
  const participants = new Map<string, UsageEvent[]>()
  for (const event of events) {
    const rows = participants.get(event.participant_id) ?? []
    rows.push(event)
    participants.set(event.participant_id, rows)
  }
  return [...participants.entries()]
    .map(([participantId, rows]) => ({
      participantId,
      requests: rows.length,
      inputTokens: sum(rows, 'input_tokens'),
      outputTokens: sum(rows, 'output_tokens'),
      totalTokens: sum(rows, 'total_tokens'),
      averageTokensPerRequest: sum(rows, 'total_tokens') / rows.length,
      costByCurrency: costTotals(rows),
      lastActivity: rows.reduce(
        (latest, event) =>
          parsedDate(event.captured_at).getTime() > parsedDate(latest).getTime()
            ? event.captured_at
            : latest,
        rows[0].captured_at,
      ),
    }))
    .sort((left, right) => right.totalTokens - left.totalTokens)
}

export function aggregateByDimension(
  events: UsageEvent[],
  dimension: 'simulation' | 'model',
): DimensionUsage[] {
  const groups = new Map<string, UsageEvent[]>()
  for (const event of events) {
    const key =
      dimension === 'simulation'
        ? event.simulation_id
        : `${event.provider ?? 'Unknown provider'}\u0000${event.model ?? 'Unknown model'}`
    const rows = groups.get(key) ?? []
    rows.push(event)
    groups.set(key, rows)
  }
  const totalTokens = sum(events, 'total_tokens')
  return [...groups.entries()]
    .map(([key, rows]) => {
      const first = rows[0]
      return {
        id:
          dimension === 'simulation'
            ? first.simulation_id
            : `${first.provider ?? 'Unknown provider'} / ${first.model ?? 'Unknown model'}`,
        label: dimension === 'simulation' ? first.simulation_id : (first.model ?? 'Unknown model'),
        ...(dimension === 'model' ? { provider: first.provider ?? 'Unknown provider' } : {}),
        requests: rows.length,
        inputTokens: sum(rows, 'input_tokens'),
        outputTokens: sum(rows, 'output_tokens'),
        totalTokens: sum(rows, 'total_tokens'),
        costByCurrency: costTotals(rows),
        contributionPercent: totalTokens ? (sum(rows, 'total_tokens') / totalTokens) * 100 : 0,
        groupKey: key,
      }
    })
    .sort((left, right) => right.totalTokens - left.totalTokens)
    .map(({ groupKey: _groupKey, ...row }) => row)
}

function labelDate(key: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(
    new Date(`${key}T00:00:00Z`),
  )
}

function bucketKey(value: string, interval: 'daily' | 'weekly' | 'monthly'): string {
  const localDay = dateKey(value)
  if (interval === 'monthly') return localDay.slice(0, 7)
  if (interval === 'daily') return localDay

  const date = new Date(`${localDay}T00:00:00Z`)
  const daysSinceMonday = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - daysSinceMonday)
  return date.toISOString().slice(0, 10)
}

export function bucketUsageByTime(
  events: UsageEvent[],
  interval: 'daily' | 'weekly' | 'monthly',
): UsageTimeBucket[] {
  const groups = new Map<string, UsageEvent[]>()
  for (const event of events) {
    const key = bucketKey(event.captured_at, interval)
    const rows = groups.get(key) ?? []
    rows.push(event)
    groups.set(key, rows)
  }
  const keys = [...groups.keys()].sort()
  if (keys.length === 0) return []

  const firstKey = keys[0]
  const lastKey = keys.at(-1)!
  const firstDate = new Date(`${interval === 'monthly' ? `${firstKey}-01` : firstKey}T00:00:00Z`)
  const lastDate = new Date(`${interval === 'monthly' ? `${lastKey}-01` : lastKey}T00:00:00Z`)
  const completeGroups: [string, UsageEvent[]][] = []
  for (const cursor = firstDate; cursor <= lastDate;) {
    const key =
      interval === 'monthly' ? cursor.toISOString().slice(0, 7) : cursor.toISOString().slice(0, 10)
    completeGroups.push([key, groups.get(key) ?? []])
    if (interval === 'monthly') cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    else cursor.setUTCDate(cursor.getUTCDate() + (interval === 'weekly' ? 7 : 1))
  }

  return completeGroups.map(([key, rows]) => ({
    key,
    label:
      interval === 'monthly'
        ? labelDate(`${key}-01`, { month: 'short', year: 'numeric' })
        : labelDate(key, { month: 'short', day: 'numeric' }),
    inputTokens: sum(rows, 'input_tokens'),
    outputTokens: sum(rows, 'output_tokens'),
    totalTokens: sum(rows, 'total_tokens'),
  }))
}

export function getTokenComposition(events: UsageEvent[]): TokenCompositionItem[] {
  const categories: TokenCompositionItem[] = [
    { id: 'input', label: 'Input Tokens', tokens: sum(events, 'input_tokens') },
    { id: 'output', label: 'Output Tokens', tokens: sum(events, 'output_tokens') },
    {
      id: 'cached_input',
      label: 'Cached Input Tokens',
      tokens: events.reduce((total, event) => total + (event.cached_input_tokens ?? 0), 0),
    },
    {
      id: 'reasoning_output',
      label: 'Reasoning Output Tokens',
      tokens: events.reduce((total, event) => total + (event.reasoning_output_tokens ?? 0), 0),
    },
  ]
  return categories.filter((item) => item.tokens > 0)
}

export function formatTokenCount(value: number, compact = false): string {
  if (!compact || Math.abs(value) < 10_000) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
  }
  const absolute = Math.abs(value)
  const scaled = absolute >= 1_000_000 ? value / 1_000_000 : value / 1_000
  const suffix = absolute >= 1_000_000 ? 'M' : 'K'
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(scaled)}${suffix}`
}

export function formatCurrencyAmounts(amounts: CurrencyAmount[]): string[] {
  return amounts.map(({ currency, amount }) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 12,
      }).format(amount)
    } catch {
      return `${currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 12 }).format(amount)}`
    }
  })
}
