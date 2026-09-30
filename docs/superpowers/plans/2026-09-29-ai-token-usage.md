# AI Token Usage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build frontend-only AI Token Usage overview and participant detail pages backed by replaceable mock data.

**Architecture:** A feature-local typed adapter exposes mock usage events; pure logic applies filters, aggregations, bucketing, and formatting; two route pages render shared SimFlow operations primitives, Recharts visualizations, and dense tables. URL search parameters hold overview filters and are carried to participant detail and back.

**Tech Stack:** React 19, TypeScript, React Router, TanStack Query, Recharts, shadcn primitives, Tailwind CSS, existing `tsx --test` runner.

**Spec:** `simflow-web/docs/superpowers/specs/2026-09-29-ai-token-usage-design.md`

## Global Constraints

- Frontend only; do not add an API endpoint or assume an endpoint contract.
- Use `captured_at` for time analytics and the persisted `total_tokens` value for totals.
- Include records where `is_deleted = 1`.
- Use `total_cost` and `currency`; never combine different currencies into one amount.
- Reuse SimFlow operations components and tokens; add no dependency and do not redesign unrelated pages.
- Keep loading, error, empty, and ready states visible; preserve overview filters when navigating back from participant detail.

## Review Focus

- A soft-deleted usage row remains part of every relevant aggregate. Test in Task 1 with `is_deleted: 1`.
- A row whose `total_tokens` differs from input plus output retains the stored total. Test in Task 1 with deliberately inconsistent token values.
- Mixed currencies remain distinct in summaries and tables. Test in Task 1 with USD and EUR records.
- Date filtering includes the selected end date using `captured_at` consistently. Test in Task 1 at the start and end boundaries.
- A direct detail URL for a participant with no events shows an empty state and keeps a working overview link. Cover the page state and navigation in Task 3.

---

## File Map

- `simflow-web/src/features/ai_token_usage/usage-types.ts` — usage event, filter, and aggregate types.
- `simflow-web/src/features/ai_token_usage/mock-usage.ts` — deterministic fixture events and the mock adapter functions.
- `simflow-web/src/features/ai_token_usage/usage-logic.ts` — filtering, summaries, groupings, time buckets, sort defaults, and currency-aware formatters.
- `simflow-web/src/features/ai_token_usage/usage-filters.tsx` — compact labeled filter controls shared by overview and detail.
- `simflow-web/src/features/ai_token_usage/usage-charts.tsx` — trend, simulation/model comparisons, token-category bars, and tooltips.
- `simflow-web/src/features/ai_token_usage/usage-tables.tsx` — participant, model, and event table column definitions.
- `simflow-web/src/features/ai_token_usage/ai-token-usage-page.tsx` — filtered overview query, summary, charts, and participant table.
- `simflow-web/src/features/ai_token_usage/participant-ai-usage-page.tsx` — participant summary, time controls, charts, model breakdown, and event table.
- `simflow-web/src/app/routes/app-routes.tsx` — lazy route registration for overview and participant detail.
- `simflow-web/src/app/layouts/navigation.ts` — sidebar entry and breadcrumb label.
- `simflow-web/src/app/layouts/app-sidebar.tsx` — place the new item in the existing Build & operate group.
- `simflow-web/src/app/layouts/app-shell.tsx` — use the Participant label in the existing shell breadcrumb for participant detail routes.
- `simflow-web/src/index.css` — include the feature page class in the existing full-width operations shell selector.
- `simflow-web/tests/ai-token-usage-logic.test.mjs` — pure logic contract tests run by `npm test`.

## Task 1: Define the mock adapter and tested analytics logic

**Files:**

- Create: `simflow-web/src/features/ai_token_usage/usage-types.ts`
- Create: `simflow-web/src/features/ai_token_usage/mock-usage.ts`
- Create: `simflow-web/src/features/ai_token_usage/usage-logic.ts`
- Test: `simflow-web/tests/ai-token-usage-logic.test.mjs`

**Interfaces:**

- Produces `UsageEvent`, containing the provided usage columns with nullable correlation IDs represented as `string | null` and date values as ISO strings.
- Produces `UsageFilters` with optional `from`, `to`, `simulationId`, `participantId`, `provider`, `model`, and `activityType` strings.
- Produces `CurrencyAmount = { currency: string; amount: number }`, `UsageSummary = { totalTokens: number; totalCostByCurrency: CurrencyAmount[]; totalRequests: number; totalParticipants: number; averageTokensPerRequest: number }`, `ParticipantUsage = { participantId: string; requests: number; inputTokens: number; outputTokens: number; totalTokens: number; costByCurrency: CurrencyAmount[]; lastActivity: string }`, `DimensionUsage = { id: string; label: string; provider?: string; requests: number; inputTokens: number; outputTokens: number; totalTokens: number; costByCurrency: CurrencyAmount[]; contributionPercent: number }`, `UsageTimeBucket = { key: string; label: string; inputTokens: number; outputTokens: number; totalTokens: number }`, and `TokenCompositionItem = { id: 'input' | 'output' | 'cached_input' | 'reasoning_output'; label: string; tokens: number }`.
- Produces `listMockUsageEvents(): Promise<UsageEvent[]>` and `getMockParticipantUsage(participantId: string): Promise<UsageEvent[]>`.
- Produces `filterUsageEvents(events: UsageEvent[], filters: UsageFilters): UsageEvent[]`, `summarizeUsage(events: UsageEvent[]): UsageSummary`, `aggregateParticipants(events: UsageEvent[]): ParticipantUsage[]`, `aggregateByDimension(events: UsageEvent[], dimension: 'simulation' | 'model'): DimensionUsage[]`, `bucketUsageByTime(events: UsageEvent[], interval: 'daily' | 'weekly' | 'monthly'): UsageTimeBucket[]`, and `getTokenComposition(events: UsageEvent[]): TokenCompositionItem[]`.
- Produces `formatTokenCount(value: number, compact?: boolean): string` and currency-aware cost formatters returning one formatted amount per currency.

- [ ] **Step 1: Add failing tests** for inclusive `captured_at` date filters, all six filter dimensions, deleted-row inclusion, stored `total_tokens`, distinct participants/request counts, mixed-currency totals, default participant ordering, per-dimension aggregation, daily/weekly/monthly bucket boundaries, and non-zero token-category comparisons.
- [ ] **Step 2: Run `cd simflow-web; npm test -- --test-name-pattern="AI token usage"`** and confirm the new tests fail because the feature logic is not implemented.
- [ ] **Step 3: Implement the types, fixtures, and pure functions** in the three feature files. Keep the fixture deterministic and include enough participants, simulations, providers, models, dates, token categories, and currencies to exercise filters and charts. Do not filter out `is_deleted`; do not derive `total_tokens` from other columns.
- [ ] **Step 4: Run the focused test file** with `cd simflow-web; npx tsx --test tests/ai-token-usage-logic.test.mjs` and confirm all aggregation and formatting assertions pass.

## Task 2: Build reusable filters, chart, and table presentations

**Files:**

- Create: `simflow-web/src/features/ai_token_usage/usage-filters.tsx`
- Create: `simflow-web/src/features/ai_token_usage/usage-charts.tsx`
- Create: `simflow-web/src/features/ai_token_usage/usage-tables.tsx`

**Interfaces:**

- Consumes Task 1 types and logic exports.
- `UsageFiltersBar` accepts `filters: UsageFilters`, option lists derived from current events, `onChange(filters: UsageFilters): void`, and `onClear(): void`.
- `UsageTrendChart` accepts `data: UsageTimeBucket[]` and controlled `interval: 'daily' | 'weekly' | 'monthly'` with `onIntervalChange`.
- `UsageComparisonChart` accepts simulation/model `DimensionUsage[]` and a dimension label.
- `UsageCompositionChart` accepts `TokenCompositionItem[]` and compares reported categories as bars because cached/reasoning values may overlap input/output; it renders an explanatory empty state if there are no categories.
- Table column exports accept `navigate` and `search` only where participant links need them; detail tables consume their corresponding aggregate row types.

- [ ] **Step 1: Implement labeled compact filter controls** using existing `Select`, `Input`, and buttons; include date bounds, the five categorical filters, a clear action, keyboard-operable controls, and responsive wrapping.
- [ ] **Step 2: Implement chart components** with existing Recharts, readable tick formatting, textual legends, accessible summaries, and tooltips showing precise values. Use line charts for time series, horizontal bars for simulation/model comparison and reported token fields (cached/reasoning values can overlap input/output), omitting zero-value categories. Simulation comparison on participant detail uses a donut for at most five simulations and horizontal bars above five; dimension tooltips include contribution percentage.
- [ ] **Step 3: Implement table column definitions** for participant aggregates, model/provider aggregates, and usage events, with tabular number formatting, full-value titles for truncated IDs, sortable numeric/date keys, no pagination for the small model table, and local horizontal overflow supplied by page/table wrappers.
- [ ] **Step 4: Review keyboard and responsive behavior** for filters, range selectors, chart interval selectors, links, sort headers, and pagination using existing shared components; keep visual styling within existing SimFlow classes/tokens.

## Task 3: Assemble routes and operational pages

**Files:**

- Create: `simflow-web/src/features/ai_token_usage/ai-token-usage-page.tsx`
- Create: `simflow-web/src/features/ai_token_usage/participant-ai-usage-page.tsx`
- Modify: `simflow-web/src/app/routes/app-routes.tsx`
- Modify: `simflow-web/src/app/layouts/navigation.ts`
- Modify: `simflow-web/src/app/layouts/app-sidebar.tsx`
- Modify: `simflow-web/src/app/layouts/app-shell.tsx`
- Modify: `simflow-web/src/index.css`

**Interfaces:**

- Consumes Task 1 adapter, types, and logic plus Task 2 presentation components.
- Overview reads/writes date and categorical filter keys from `useSearchParams`; participant detail carries the same query string to its overview breadcrumb and return link.
- Both pages use TanStack Query with the adapter functions and render existing `LoadingState`, `ErrorState`, and `EmptyState`/explicit empty messaging.
- Sidebar entry is **AI Token Usage** at `/ai-token-usage` using the existing primary operations navigation group.

- [ ] **Step 1: Assemble the overview** with the compact header/description, URL-synchronized filters, five summary metrics, daily/weekly/monthly token trend, simulation and model comparisons, token-category comparison, and participant table sorted by total tokens descending initially.
- [ ] **Step 2: Assemble participant detail** with breadcrumb, full participant ID, summary metrics, selected time range, time trend, simulation usage comparison, token-category comparison, model/provider breakdown table, and detailed event table. Unknown participant IDs render the page empty state.
- [ ] **Step 3: Register lazy routes and navigation** for `/ai-token-usage` and `/ai-token-usage/:participantId`; add the sidebar entry to `primaryPaths` so it appears in the existing Build & operate section and add its title to `pageNames`.
- [ ] **Step 4: Integrate with the app shell** by applying the existing full-width content treatment to `.ai-token-usage-page`; avoid global style changes beyond adding this feature class to the existing selector.
- [ ] **Step 5: Verify application quality** from `simflow-web`: run `npm test`, `npm run lint`, and `npm run build`; resolve regressions without reformatting or altering unrelated dirty files.

## Task 4: Visual and interaction review

**Files:**

- Modify only the new `simflow-web/src/features/ai_token_usage/` files and narrowly required feature-specific class/style.

**Interfaces:**

- Consumes the assembled overview and participant detail routes from Task 3.

- [ ] **Step 1: Review both routes at desktop, tablet, and narrow widths**; confirm filters wrap, chart columns stack, local table scrolling works, summary values remain readable, and no page-level horizontal overflow appears.
- [ ] **Step 2: Review state and navigation behavior** for loading, query failure, no events, no filter matches, unknown participant, clear filters, participant navigation, and return with overview query parameters restored.
- [ ] **Step 3: Correct only feature-specific issues** and rerun `npm run lint` and `npm run build` after visual adjustments.
