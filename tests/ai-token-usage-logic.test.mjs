import assert from 'node:assert/strict'
import test from 'node:test'

const {
  aggregateByDimension,
  aggregateParticipants,
  bucketUsageByTime,
  filterUsageEvents,
  formatCurrencyAmounts,
  formatTokenCount,
  getTokenComposition,
  summarizeUsage,
} = await import('../src/features/ai_token_usage/usage-logic.ts')

function usage(overrides = {}) {
  const usageId = overrides.usage_id ?? 'usage-1'
  return {
    usage_id: usageId,
    session_id: 'session-1',
    execution_id: 'execution-1',
    simulation_id: 'simulation-1',
    node_execution_id: 'node-execution-1',
    participant_call_session_id: null,
    participant_id: 'participant-1',
    activity_type: 'classification',
    node_type: 'ai_classification',
    service_type: 'text',
    provider: 'openai',
    model: 'model-a',
    input_tokens: 80,
    output_tokens: 20,
    total_tokens: 100,
    cached_input_tokens: 0,
    reasoning_output_tokens: 0,
    audio_duration_seconds: null,
    character_count: null,
    total_cost: 0.01,
    currency: 'USD',
    pricing_snapshot: {},
    usage_event_id: `event-${usageId}`,
    captured_at: '2026-09-10T12:00:00+07:00',
    created_by: null,
    created_date: '2026-09-10T12:00:00+07:00',
    modified_by: null,
    modified_date: null,
    is_deleted: 0,
    ...overrides,
  }
}

test('filters captured_at by inclusive Jakarta calendar dates', () => {
  const rows = [
    usage({ usage_id: 'first', captured_at: '2026-09-09T17:00:00Z' }),
    usage({ usage_id: 'last', captured_at: '2026-09-10T16:59:59Z' }),
    usage({ usage_id: 'outside', captured_at: '2026-09-10T17:00:00Z' }),
  ]

  assert.deepEqual(
    filterUsageEvents(rows, { from: '2026-09-10', to: '2026-09-10' }).map((row) => row.usage_id),
    ['first', 'last'],
  )
})

test('applies each requested categorical filter', () => {
  const rows = [
    usage({ usage_id: 'match' }),
    usage({
      usage_id: 'other',
      simulation_id: 'simulation-2',
      participant_id: 'participant-2',
      provider: 'anthropic',
      model: 'model-b',
      activity_type: 'call',
    }),
  ]

  for (const [key, value] of [
    ['simulationId', 'simulation-1'],
    ['participantId', 'participant-1'],
    ['provider', 'openai'],
    ['model', 'model-a'],
    ['activityType', 'classification'],
  ]) {
    assert.deepEqual(
      filterUsageEvents(rows, { [key]: value }).map((row) => row.usage_id),
      ['match'],
    )
  }
})

test('includes deleted usage records and trusts total_tokens as stored', () => {
  const rows = [usage({ usage_id: 'deleted', is_deleted: 1, total_tokens: 900 })]
  const summary = summarizeUsage(rows)

  assert.equal(summary.totalTokens, 900)
  assert.equal(summary.totalRequests, 1)
})

test('summarizes participants and cost separately for each currency', () => {
  const summary = summarizeUsage([
    usage({ usage_id: 'one', total_cost: 1.25, currency: 'USD' }),
    usage({
      usage_id: 'two',
      participant_id: 'participant-2',
      total_cost: 3.5,
      currency: 'EUR',
      total_tokens: 200,
    }),
    usage({ usage_id: 'three', total_cost: 0.75, currency: 'USD' }),
  ])

  assert.equal(summary.totalTokens, 400)
  assert.equal(summary.totalRequests, 3)
  assert.equal(summary.totalParticipants, 2)
  assert.equal(summary.averageTokensPerRequest, 400 / 3)
  assert.deepEqual(summary.totalCostByCurrency, [
    { currency: 'EUR', amount: 3.5 },
    { currency: 'USD', amount: 2 },
  ])
})

test('aggregates participants in total-token descending order', () => {
  const participants = aggregateParticipants([
    usage({ usage_id: 'one', participant_id: 'low', total_tokens: 25 }),
    usage({ usage_id: 'two', participant_id: 'high', total_tokens: 100 }),
    usage({ usage_id: 'three', participant_id: 'high', total_tokens: 60 }),
  ])

  assert.deepEqual(
    participants.map(({ participantId, totalTokens, requests }) => ({
      participantId,
      totalTokens,
      requests,
    })),
    [
      { participantId: 'high', totalTokens: 160, requests: 2 },
      { participantId: 'low', totalTokens: 25, requests: 1 },
    ],
  )
})

test('selects last activity by instant when timestamps have different offsets', () => {
  const rows = aggregateParticipants([
    usage({
      usage_id: 'earlier',
      participant_id: 'person',
      captured_at: '2026-09-10T14:00:00+07:00',
    }),
    usage({ usage_id: 'later', participant_id: 'person', captured_at: '2026-09-10T08:30:00Z' }),
  ])

  assert.equal(rows[0].lastActivity, '2026-09-10T08:30:00Z')
})

test('aggregates simulation/model dimensions and contribution percentages', () => {
  const rows = [
    usage({ usage_id: 'one', total_tokens: 300 }),
    usage({ usage_id: 'two', simulation_id: 'simulation-2', model: 'model-b', total_tokens: 100 }),
  ]

  assert.deepEqual(
    aggregateByDimension(rows, 'simulation').map(({ id, totalTokens, contributionPercent }) => ({
      id,
      totalTokens,
      contributionPercent,
    })),
    [
      { id: 'simulation-1', totalTokens: 300, contributionPercent: 75 },
      { id: 'simulation-2', totalTokens: 100, contributionPercent: 25 },
    ],
  )
  assert.deepEqual(
    aggregateByDimension(rows, 'model').map(({ label, totalTokens }) => ({
      id: label,
      totalTokens,
    })),
    [
      { id: 'model-a', totalTokens: 300 },
      { id: 'model-b', totalTokens: 100 },
    ],
  )
})

test('keeps the same model separate across providers for table row identity', () => {
  const models = aggregateByDimension(
    [
      usage({ usage_id: 'one', model: 'shared-model', provider: 'OpenAI', total_tokens: 100 }),
      usage({ usage_id: 'two', model: 'shared-model', provider: 'Anthropic', total_tokens: 50 }),
    ],
    'model',
  )

  assert.equal(models.length, 2)
  assert.notEqual(models[0].id, models[1].id)
  assert.deepEqual(
    models.map(({ provider, totalTokens }) => ({ provider, totalTokens })),
    [
      { provider: 'OpenAI', totalTokens: 100 },
      { provider: 'Anthropic', totalTokens: 50 },
    ],
  )
})

test('buckets captured token values daily, weekly, and monthly', () => {
  const rows = [
    usage({ usage_id: 'monday', captured_at: '2026-09-07T08:00:00Z', total_tokens: 100 }),
    usage({ usage_id: 'tuesday', captured_at: '2026-09-08T08:00:00Z', total_tokens: 50 }),
    usage({ usage_id: 'next-month', captured_at: '2026-10-01T08:00:00Z', total_tokens: 25 }),
  ]

  assert.equal(bucketUsageByTime(rows, 'daily').length, 25)
  assert.deepEqual(
    bucketUsageByTime(rows, 'weekly').map(({ key, totalTokens }) => ({ key, totalTokens })),
    [
      { key: '2026-09-07', totalTokens: 150 },
      { key: '2026-09-14', totalTokens: 0 },
      { key: '2026-09-21', totalTokens: 0 },
      { key: '2026-09-28', totalTokens: 25 },
    ],
  )
  assert.deepEqual(
    bucketUsageByTime(rows, 'monthly').map(({ key, totalTokens }) => ({ key, totalTokens })),
    [
      { key: '2026-09', totalTokens: 150 },
      { key: '2026-10', totalTokens: 25 },
    ],
  )
})

test('fills missing daily trend buckets with zero tokens between events', () => {
  const rows = [
    usage({ usage_id: 'first', captured_at: '2026-09-10T08:00:00Z', total_tokens: 30 }),
    usage({ usage_id: 'last', captured_at: '2026-09-12T08:00:00Z', total_tokens: 20 }),
  ]

  assert.deepEqual(
    bucketUsageByTime(rows, 'daily').map(({ key, totalTokens }) => ({ key, totalTokens })),
    [
      { key: '2026-09-10', totalTokens: 30 },
      { key: '2026-09-11', totalTokens: 0 },
      { key: '2026-09-12', totalTokens: 20 },
    ],
  )
})

test('omits zero-value token composition categories', () => {
  assert.deepEqual(
    getTokenComposition([
      usage({
        input_tokens: 100,
        output_tokens: 25,
        cached_input_tokens: 0,
        reasoning_output_tokens: 8,
      }),
    ]),
    [
      { id: 'input', label: 'Input Tokens', tokens: 100 },
      { id: 'output', label: 'Output Tokens', tokens: 25 },
      { id: 'reasoning_output', label: 'Reasoning Output Tokens', tokens: 8 },
    ],
  )
})

test('formats full and compact token counts readably', () => {
  assert.equal(formatTokenCount(1240), '1,240')
  assert.equal(formatTokenCount(12_400, true), '12.4K')
  assert.equal(formatTokenCount(1_200_000, true), '1.2M')
})

test('formats costs with the currency code and keeps currencies separate', () => {
  assert.deepEqual(
    formatCurrencyAmounts([
      { currency: 'USD', amount: 12.5 },
      { currency: 'EUR', amount: 3.5 },
    ]),
    ['$12.50', '€3.50'],
  )
  assert.deepEqual(formatCurrencyAmounts([{ currency: 'USD', amount: 0.0015 }]), ['$0.0015'])
})
