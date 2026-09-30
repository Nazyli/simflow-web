import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { PageFrame } from '../../components/layout/page-frame'
import { PageHeader } from '../../components/layout/page-header'
import { SummaryStrip } from '../../components/layout/summary-strip'
import { SurfaceSection } from '../../components/layout/surface-section'
import { EmptyState, ErrorState, LoadingState } from '../../shared/components/async-state'
import { ApiError } from '../../shared/api/client'
import { getAiParticipantUsage } from '../../shared/api/ai-token-usage'
import {
  adaptComposition,
  adaptDimensions,
  adaptEvent,
  adaptSummary,
  adaptTrend,
} from './usage-api-adapters'
import { formatCurrencyAmounts, formatTokenCount } from './usage-logic'
import {
  SimulationShareChart,
  UsageComparisonChart,
  UsageCompositionChart,
  UsageTrendChart,
} from './usage-charts'
import { ModelUsageTable, ServerPagination, UsageEventsTable } from './usage-tables'

const EVENT_PAGE_SIZE = 25

function costSummary(costs: { currency: string; amount: number }[]): string {
  return formatCurrencyAmounts(costs).join(' / ') || '—'
}

export function ParticipantAiUsagePage() {
  const { participantId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const queryString = searchParams.toString()
  const [eventPage, setEventPage] = useState(1)
  const query = useQuery({
    queryKey: ['ai-token-usage', 'participant', participantId, eventPage],
    queryFn: () => getAiParticipantUsage(participantId, eventPage, EVENT_PAGE_SIZE),
    enabled: Boolean(participantId),
  })
  const data = query.data
  const summary = data ? adaptSummary(data.summary) : null
  const simulations = data
    ? adaptDimensions(data.bySimulation, 'simulation', data.summary.totalTokens)
    : []
  const models = data ? adaptDimensions(data.byModel, 'model', data.summary.totalTokens) : []
  const composition = data ? adaptComposition(data) : []
  const trend = data ? adaptTrend(data.trend, 'daily') : []
  const events = data ? data.events.items.map(adaptEvent) : []
  const simulationLink = queryString ? `/ai-token-usage?${queryString}` : '/ai-token-usage'
  const notFound = query.error instanceof ApiError && query.error.status === 404

  return (
    <PageFrame mode="operations" className="ai-token-usage-page">
      <PageHeader
        eyebrow={
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
            <Link
              className="rounded-sm text-violet-700 underline decoration-violet-200 underline-offset-2 hover:text-violet-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
              to={simulationLink}
            >
              AI Token Usage
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-slate-600">Participant</span>
          </nav>
        }
        title="Participant usage"
        metadata={
          <span
            className="min-w-0 font-mono text-xs break-all text-slate-700"
            title={participantId}
          >
            {participantId}
          </span>
        }
      />

      {query.isError && notFound ? (
        <EmptyState
          title="No participant usage found"
          description="The server has no recorded AI usage for this participant."
          action={
            <Button asChild type="button" size="xs" variant="outline">
              <Link to={simulationLink}>Back to AI Token Usage</Link>
            </Button>
          }
        />
      ) : query.isError ? (
        <ErrorState
          message="Unable to load participant AI usage from the server. Check the API connection and try again."
          action={
            <Button type="button" size="xs" variant="outline" onClick={() => void query.refetch()}>
              Retry
            </Button>
          }
        />
      ) : query.isPending ? (
        <LoadingState label="Loading participant AI usage" />
      ) : !data || !summary ? null : (
        <>
          <SummaryStrip
            items={[
              {
                label: 'Total tokens',
                value: formatTokenCount(summary.totalTokens, true),
                tone: 'accent',
              },
              { label: 'Input tokens', value: formatTokenCount(data.summary.inputTokens, true) },
              { label: 'Output tokens', value: formatTokenCount(data.summary.outputTokens, true) },
              { label: 'Total cost', value: costSummary(summary.totalCostByCurrency) },
              { label: 'Requests', value: summary.totalRequests.toLocaleString('en-US') },
              { label: 'Simulations', value: simulations.length.toLocaleString('en-US') },
              { label: 'Models', value: models.length.toLocaleString('en-US') },
            ]}
          />

          <SurfaceSection
            title="Usage by model"
            description="Requests, token counts, provider, and recorded cost by model."
          >
            <ModelUsageTable rows={models} />
          </SurfaceSection>

          <SurfaceSection
            title="Usage events"
            description="Precise usage records for inspection and debugging."
          >
            <UsageEventsTable rows={events} />
            <ServerPagination
              page={data.events.page}
              totalPages={data.events.totalPages}
              totalItems={data.events.totalItems}
              onPageChange={setEventPage}
            />
          </SurfaceSection>

          <SurfaceSection
            title="Usage analytics"
            description="Trends and breakdowns for this participant's recorded usage."
          >
            <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-4 xl:grid-cols-2">
              <UsageTrendChart data={trend} interval="daily" />
              {simulations.length <= 5 ? (
                <SimulationShareChart data={simulations} />
              ) : (
                <UsageComparisonChart data={simulations} dimension="simulation" />
              )}
              <UsageCompositionChart data={composition} />
            </div>
          </SurfaceSection>
        </>
      )}
    </PageFrame>
  )
}
