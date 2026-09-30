# AI Token Usage — Frontend Design

## Goal

Add a native SimFlow operations view for inspecting AI token consumption, request
volume, cost, participants, simulations, models, and individual usage events.
This first delivery is frontend-only; no backend route or database behavior is
changed.

## Existing application fit

The frontend is React 19 with React Router, TanStack Query, Recharts, and shared
shadcn primitives. Operations pages use `PageFrame`, `PageHeader`, `SummaryStrip`,
`SurfaceSection`, and `DataTable`. The implementation will reuse those patterns
and the existing SimFlow palette, Plus Jakarta Sans typography, spacing, and
compact density. It will not modify unrelated pages or introduce a new design
system or dependency.

## Routes and navigation

- Add an **AI Token Usage** sidebar entry at `/ai-token-usage`.
- Add a lazy-loaded overview route at `/ai-token-usage`.
- Add a lazy-loaded participant detail route at
  `/ai-token-usage/:participantId`.
- Keep overview filters in URL search parameters so returning from participant
  detail restores the previous date range and filter selections.
- Detail includes a breadcrumb/back link to the overview.

## Data and state

Create a feature-local data adapter with typed usage-event records matching the
provided `trans_ai_usage` fields. Its initial source is clearly labeled mock
data, with deterministic fixtures and aggregation helpers; components consume
the adapter interface rather than fixture constants. This leaves a clear seam
for a later API client without inventing an endpoint contract.

All analytics use `captured_at` for time and `total_tokens` as the total. Input,
output, cached-input, and reasoning tokens are only used in their respective
series/category-comparison views. Events with `is_deleted = 1` remain included. Cost is
read from `total_cost` and displayed with the event's `currency`; totals are
grouped by currency rather than adding unlike currencies together. The mock
adapter exposes loading, error, empty, and ready states so page states can be
reviewed before API integration.

## Overview page

Use a compact page heading and description, followed by inline date-range,
simulation, participant, provider, model, and activity filters. A clear-filters
action resets all filters. Filters scope summary values, charts, and participant
rows consistently.

Show five compact summary values: total tokens, total cost by currency, request
count, distinct participants, and average tokens per request. The main
visualization is a Recharts line chart grouped by daily, weekly, or monthly
`captured_at`, with input, output, and total token series plus readable axis
ticks and tooltips. Supporting visualizations are a horizontal simulation token
bar chart, a compact comparison of the non-zero token fields, and a model token
bar chart with provider context. Cached input and reasoning output can be
subsets of input and output, so compare these reported fields with bars rather
than presenting them as mutually exclusive donut slices. Keep panels flat and
use section boundaries rather than nested or oversized cards.

Below the charts, show participants aggregated by ID, sorted by total tokens
descending by default. Columns are participant, requests, input tokens, output
tokens, total tokens, cost, and last activity. Participant IDs link to detail,
with truncation and a title containing the full ID. The table supports column
sorting, filtering, pagination, horizontal scrolling where needed, and explicit
empty/loading/error states.

## Participant detail page

Show the participant ID, breadcrumb, and compact summary for tokens, cost by
currency, requests, simulation count, and last activity. Include a selectable
time-bucket line chart, usage-by-simulation comparison that adapts to category
count, and non-zero token field comparison. Model/provider breakdown uses a dense
table with requests, token counts, and cost. Finish with a precise usage-event
table containing the requested captured time, simulation, activity, node,
service, provider, model, token, and cost fields. The model table shows all
models without pagination; both tables remain filterable and sortable where the
sort values are comparable. The usage-event table is paginated.

## Responsive and accessibility behavior

On desktop, filters and the two-column chart region use the available width. On
smaller screens filters wrap/collapse, chart panels stack, and wide tables scroll
locally. Labels remain visible, controls work by keyboard, focus indicators are
preserved, chart series have textual legends/tooltips, and reduced-motion
preferences are respected. Loading, no matching data, and error states tell the
user what happened and how to recover where applicable.

## Scope and verification

Only the new feature, its navigation/route registration, and narrowly required
shared adjustments are in scope. No mock values should be presented as live
production usage. Verification will use the existing frontend test, lint, and
build commands after implementation; no API endpoint is assumed or added.
