import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { PageFrame } from '../../components/layout/page-frame'
import { PageHeader } from '../../components/layout/page-header'
import { SummaryStrip } from '../../components/layout/summary-strip'
import { SurfaceSection } from '../../components/layout/surface-section'
import { EmptyState, ErrorState, LoadingState } from '../../shared/components/async-state'
import { getAiUsageOverview } from '../../shared/api/ai-token-usage'
import {
  adaptComposition,
  adaptDimensions,
  adaptParticipants,
  adaptSummary,
  adaptTrend,
} from './usage-api-adapters'
import { formatCurrencyAmounts, formatTokenCount } from './usage-logic'
import { UsageComparisonChart, UsageCompositionChart, UsageTrendChart } from './usage-charts'
import { UsageFiltersBar } from './usage-filters'
import { ParticipantUsageTable } from './usage-tables'
import type { UsageFilters } from './usage-types'
import type { UsageInterval } from '../../shared/api/ai-token-usage'

const PAGE_SIZE = 25
const EMPTY_FILTER_OPTIONS = {
  simulationIds: [],
  providers: [],
  models: [],
  activityTypes: [],
}

const filterParams: [keyof UsageFilters, string][] = [
  ['from', 'from'],
  ['to', 'to'],
  ['simulationId', 'simulation'],
  ['participantId', 'participant'],
  ['provider', 'provider'],
  ['model', 'model'],
  ['activityType', 'activity'],
]

function readFilters(params: URLSearchParams): UsageFilters {
  return Object.fromEntries(
    filterParams.flatMap(([key, param]) => {
      const value = params.get(param)
      return value ? [[key, value]] : []
    }),
  ) as UsageFilters
}

function writeFilters(filters: UsageFilters): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, param] of filterParams) {
    const value = filters[key]
    if (value) params.set(param, value)
  }
  return params
}

function costSummary(costs: { currency: string; amount: number }[]): string {
  return formatCurrencyAmounts(costs).join(' / ') || '—'
}

export function AiTokenUsagePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchKey = searchParams.toString()
  const filters = useMemo(() => readFilters(new URLSearchParams(searchKey)), [searchKey])
  const [interval, setInterval] = useState<UsageInterval>('daily')
  const [participantPage, setParticipantPage] = useState(1)
  const query = useQuery({
    queryKey: ['ai-token-usage', 'overview', filters, interval, participantPage],
    queryFn: () => getAiUsageOverview(filters, interval, participantPage, PAGE_SIZE),
  })
  const data = query.data
  const summary = data ? adaptSummary(data.summary) : null
  const participants = data ? adaptParticipants(data.participants.items) : []
  const simulations = data
    ? adaptDimensions(data.bySimulation, 'simulation', data.summary.totalTokens)
    : []
  const models = data ? adaptDimensions(data.byModel, 'model', data.summary.totalTokens) : []
  const trend = data ? adaptTrend(data.trend, interval) : []
  const composition = data ? adaptComposition(data) : []
  const options = {
    simulationId: data?.filterOptions.simulationIds ?? EMPTY_FILTER_OPTIONS.simulationIds,
    provider: data?.filterOptions.providers ?? EMPTY_FILTER_OPTIONS.providers,
    model: data?.filterOptions.models ?? EMPTY_FILTER_OPTIONS.models,
    activityType: data?.filterOptions.activityTypes ?? EMPTY_FILTER_OPTIONS.activityTypes,
  }

  useEffect(() => {
    setParticipantPage(1)
  }, [searchKey])

  function updateFilters(nextFilters: UsageFilters) {
    setParticipantPage(1)
    setSearchParams(writeFilters(nextFilters), { replace: true })
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <PageFrame mode="operations" className="ai-token-usage-page">
      <PageHeader
        title="AI Token Usage"
        description="Monitor AI token consumption, requests, and cost across participants and simulations."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            {query.isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      <UsageFiltersBar
        filters={filters}
        options={options}
        onChange={updateFilters}
        onClear={() => updateFilters({})}
      />

      {query.isError ? (
        <ErrorState
          message="Unable to load AI usage from the server. Check the API connection and try again."
          action={
            <Button type="button" size="xs" variant="outline" onClick={() => void query.refetch()}>
              Retry
            </Button>
          }
        />
      ) : query.isPending ? (
        <LoadingState label="Loading AI usage analytics" />
      ) : !data || data.summary.requestCount === 0 ? (
        <EmptyState
          title={hasFilters ? 'No matching usage' : 'No AI usage records'}
          description={
            hasFilters
              ? 'No recorded AI usage matches these filters. Adjust or clear the filters to try again.'
              : 'The server has not recorded any AI usage yet.'
          }
          action={
            hasFilters ? (
              <Button type="button" size="xs" variant="outline" onClick={() => updateFilters({})}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <SummaryStrip
            items={[
              {
                label: 'Total tokens',
                value: formatTokenCount(summary!.totalTokens, true),
                tone: 'accent',
              },
              { label: 'Total cost', value: costSummary(summary!.totalCostByCurrency) },
              { label: 'Total requests', value: summary!.totalRequests.toLocaleString('en-US') },
              { label: 'Participants', value: summary!.totalParticipants.toLocaleString('en-US') },
              {
                label: 'Avg tokens / request',
                value: formatTokenCount(summary!.averageTokensPerRequest, true),
              },
            ]}
          />

          <SurfaceSection
            title="Usage analytics"
            description="Time trend and distribution for the selected filters."
          >
            <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-4 rounded-md border border-slate-200 bg-white px-3.5 sm:px-4 xl:grid-cols-2">
              <UsageTrendChart data={trend} interval={interval} onIntervalChange={setInterval} />
              <UsageComparisonChart data={simulations} dimension="simulation" />
              <UsageCompositionChart data={composition} />
              <UsageComparisonChart data={models} dimension="model" />
            </div>
          </SurfaceSection>

          <SurfaceSection
            title="Participant usage"
            description="Participants ranked by recorded total tokens."
          >
            <ParticipantUsageTable
              rows={participants}
              search={searchKey ? `?${searchKey}` : ''}
              page={data.participants.page}
              totalPages={data.participants.totalPages}
              totalItems={data.participants.totalItems}
              onPageChange={setParticipantPage}
            />
          </SurfaceSection>
        </>
      )}
    </PageFrame>
  )
}
