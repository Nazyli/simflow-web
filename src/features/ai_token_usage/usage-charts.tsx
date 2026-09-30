import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ReactNode } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { EmptyState } from '../../shared/components/async-state'
import { formatCurrencyAmounts, formatTokenCount } from './usage-logic'
import type { DimensionUsage, TokenCompositionItem, UsageTimeBucket } from './usage-types'

const seriesColors = {
  input: '#64748B',
  output: '#0F766E',
  total: '#2563EB',
  cached: '#94A3B8',
  reasoning: '#B45309',
  model: '#475569',
}

function formatTokens(value: number | string | undefined): string {
  return formatTokenCount(Number(value ?? 0))
}

function ChartFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 border-b border-slate-200 pb-4 last:border-b-0" aria-label={title}>
      <h3 className="mb-2 text-sm font-semibold text-slate-800">{title}</h3>
      {children}
    </section>
  )
}

export function UsageTrendChart({
  data,
  interval,
  onIntervalChange,
}: {
  data: UsageTimeBucket[]
  interval: 'daily' | 'weekly' | 'monthly'
  onIntervalChange?: (interval: 'daily' | 'weekly' | 'monthly') => void
}) {
  return (
    <ChartFrame title="Token usage over time">
      <>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="m-0 text-xs text-slate-500">
            Input, output, and recorded total tokens · WIB
          </p>
          {onIntervalChange && (
            <Select
              value={interval}
              onValueChange={(value) => onIntervalChange(value as typeof interval)}
            >
              <SelectTrigger aria-label="Time interval" className="h-7 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        {data.length ? (
          <div
            className="h-64 min-w-0"
            role="img"
            aria-label="Line chart of input, output, and total tokens over time"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={formatTokens}
                  width={54}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value, name) => [formatTokens(value as number), name]}
                  labelStyle={{ color: '#172033', fontWeight: 600 }}
                  contentStyle={{ borderColor: '#DBE3EC', borderRadius: 6, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="inputTokens"
                  name="Input Tokens"
                  stroke={seriesColors.input}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="outputTokens"
                  name="Output Tokens"
                  stroke={seriesColors.output}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalTokens"
                  name="Total Tokens"
                  stroke={seriesColors.total}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-14 text-center text-xs text-slate-500">No usage in this time range.</p>
        )}
      </>
    </ChartFrame>
  )
}

export function UsageComparisonChart({
  data,
  dimension,
}: {
  data: DimensionUsage[]
  dimension: string
}) {
  return (
    <ChartFrame title={`Usage by ${dimension}`}>
      {data.length ? (
        <div
          className="min-w-0"
          role="img"
          aria-label={`Horizontal bar chart comparing total tokens by ${dimension}`}
          style={{ height: Math.max(192, data.length * 34) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 2, right: 24, left: 4, bottom: 2 }}
            >
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={formatTokens}
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={145}
                tick={{ fontSize: 11, fill: '#475569' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value, name) => [formatTokens(value as number), name]}
                labelFormatter={(label, payload) => {
                  const row = payload?.[0]?.payload as DimensionUsage | undefined
                  return row?.provider ? `${label} · ${row.provider}` : String(label)
                }}
                content={({ active, payload, label }) => {
                  const row = payload?.[0]?.payload as DimensionUsage | undefined
                  if (!active || !row) return null
                  return (
                    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
                      <p className="mb-1 font-semibold text-slate-900">{label}</p>
                      {row.provider && <p className="m-0 text-slate-500">{row.provider}</p>}
                      <p className="m-0 text-slate-700 tabular-nums">
                        {formatTokens(row.totalTokens)} tokens ·{' '}
                        {row.contributionPercent.toFixed(1)}%
                      </p>
                      <p className="m-0 text-slate-500">
                        {row.requests.toLocaleString('en-US')} requests
                      </p>
                      <p className="m-0 text-slate-500">
                        {formatCurrencyAmounts(row.costByCurrency).join(' / ') ||
                          'Cost unavailable'}
                      </p>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="totalTokens"
                name="Total Tokens"
                fill={seriesColors.model}
                barSize={17}
                radius={[0, 3, 3, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-12 text-center text-xs text-slate-500">
          No {dimension} usage for this selection.
        </p>
      )}
    </ChartFrame>
  )
}

export function UsageCompositionChart({ data }: { data: TokenCompositionItem[] }) {
  return (
    <ChartFrame title="Reported token categories">
      {data.length ? (
        <div className="min-w-0">
          <div
            className="h-48 min-w-0"
            role="img"
            aria-label="Horizontal bar chart comparing input, output, cached input, and reasoning token fields"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 4, bottom: 0 }}
              >
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={formatTokens}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={152}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip formatter={(value) => [formatTokens(value as number), 'Tokens']} />
                <Bar dataKey="tokens" name="Tokens" barSize={18} radius={[0, 3, 3, 0]}>
                  {data.map((item) => (
                    <Cell
                      key={item.id}
                      fill={
                        item.id === 'input'
                          ? seriesColors.input
                          : item.id === 'output'
                            ? seriesColors.output
                            : item.id === 'cached_input'
                              ? seriesColors.cached
                              : seriesColors.reasoning
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 mb-0 text-xs text-slate-500">
            Reported counts are compared directly; cached input and reasoning output can be subsets
            of input and output.
          </p>
        </div>
      ) : (
        <EmptyState
          title="No token details"
          description="This usage range has no token composition values to compare."
        />
      )}
    </ChartFrame>
  )
}

export function SimulationShareChart({ data }: { data: DimensionUsage[] }) {
  const colors = ['#475569', '#0F766E', '#2563EB', '#B45309', '#64748B']
  return (
    <ChartFrame title="Usage by simulation">
      {data.length ? (
        <div className="grid min-w-0 grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(180px,0.8fr)_minmax(0,1fr)]">
          <div
            className="h-48 min-w-0"
            role="img"
            aria-label="Donut chart of participant token usage by simulation"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="totalTokens"
                  nameKey="label"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                >
                  {data.map((row, index) => (
                    <Cell key={row.id} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatTokens(value as number), 'Total tokens']}
                  content={({ active, payload, label }) => {
                    const row = payload?.[0]?.payload as DimensionUsage | undefined
                    if (!active || !row) return null
                    return (
                      <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
                        <p
                          className="mb-1 max-w-48 truncate font-semibold text-slate-900"
                          title={String(label)}
                        >
                          {label}
                        </p>
                        <p className="m-0 text-slate-700 tabular-nums">
                          {formatTokens(row.totalTokens)} tokens ·{' '}
                          {row.contributionPercent.toFixed(1)}%
                        </p>
                      </div>
                    )
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="m-0 grid list-none gap-2 p-0 text-xs">
            {data.map((row, index) => (
              <li key={row.id} className="flex min-w-0 items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-slate-600">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="truncate" title={row.label}>
                    {row.label}
                  </span>
                </span>
                <strong className="shrink-0 text-slate-800 tabular-nums">
                  {row.contributionPercent.toFixed(1)}%
                </strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="py-12 text-center text-xs text-slate-500">
          No simulation usage for this participant.
        </p>
      )}
    </ChartFrame>
  )
}
