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
        title={<span className="break-all">Participant {participantId}</span>}
        description={
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
            <Link
              className="text-violet-700 underline decoration-violet-200 underline-offset-2"
              to={simulationLink}
            >
              AI Token Usage
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-slate-500">Participant</span>
          </nav>
        }
        actions={
          <Button asChild type="button" variant="outline" size="sm">
            <Link to={simulationLink}>Back to overview</Link>
          </Button>
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
              { label: 'Total cost', value: costSummary(summary.totalCostByCurrency) },
              { label: 'Requests', value: summary.totalRequests.toLocaleString('en-US') },
              { label: 'Simulations', value: simulations.length.toLocaleString('en-US') },
              { label: 'Models', value: models.length.toLocaleString('en-US') },
            ]}
          />

          <SurfaceSection
            title="Participant analytics"
            description="Usage history and distribution for this participant."
          >
            <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-4 rounded-md border border-slate-200 bg-white px-3.5 sm:px-4 xl:grid-cols-2">
              <UsageTrendChart data={trend} interval="daily" />
              {simulations.length <= 5 ? (
                <SimulationShareChart data={simulations} />
              ) : (
                <UsageComparisonChart data={simulations} dimension="simulation" />
              )}
              <UsageCompositionChart data={composition} />
            </div>
          </SurfaceSection>

          <SurfaceSection
            title="Usage by model"
            description="Requests, token counts, provider, and recorded cost."
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
        </>
      )}
    </PageFrame>
  )
}
