import { expect, test } from '@playwright/test'

const apiPath = '/api/v1/admin/studio/group-simulations'

test('creates a simulation through the real API and opens it in Studio', async ({ page }) => {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  const runId = `${timestamp}-${Math.random().toString(36).slice(2, 7)}`
  const groupName = `E2E onboarding ${runId}`
  const simulationName = `Main workflow ${runId}`

  await page.goto('/studio')
  await expect(page.getByRole('button', { name: 'New simulation' })).toBeVisible()

  const groupCreateResponse = page.waitForResponse((response) => {
    const request = response.request()
    return request.method() === 'POST' && new URL(response.url()).pathname === apiPath
  })

  await page.getByRole('button', { name: 'New simulation' }).click()
  await page.getByLabel('Group simulation name').fill(groupName)
  await page.getByLabel('Initial simulation name').fill(simulationName)

  const simulationCreateResponse = page.waitForResponse((response) => {
    const request = response.request()
    const path = new URL(response.url()).pathname
    return request.method() === 'POST' && path.startsWith(`${apiPath}/`) && path.endsWith('/simulations')
  })

  await page.getByRole('button', { name: 'Create simulation' }).click()

  const groupResponse = await groupCreateResponse
  expect(groupResponse.status(), 'The real API should create the simulation group').toBe(201)
  const groupEnvelope = await groupResponse.json()
  const group = groupEnvelope.data
  expect(group.groupSimulationName).toBe(groupName)
  expect(group.groupSimulationId).toBeTruthy()

  const simulationResponse = await simulationCreateResponse
  expect(simulationResponse.status(), 'The real API should create the initial simulation').toBe(201)
  const simulationEnvelope = await simulationResponse.json()
  const simulation = simulationEnvelope.data
  expect(simulation.simulationName).toBe(simulationName)
  expect(simulation.groupSimulationId).toBe(group.groupSimulationId)
  expect(simulation.simulationId).toBeTruthy()

  await expect(page).toHaveURL(new RegExp(`/studio/${simulation.simulationId}$`))
  await expect(page.getByRole('heading', { name: groupName })).toBeVisible()
  await expect(page.locator('.studio-top-header').getByRole('combobox')).toHaveValue(
    simulation.simulationId,
  )
})
