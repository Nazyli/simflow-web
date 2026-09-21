function padTimestampPart(value: number): string {
  return String(value).padStart(2, '0')
}

export function buildWorkflowExportFileName(
  simulationName: string,
  exportedAt: Date = new Date(),
): string {
  const safeName = simulationName.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '')
  const timestamp = [
    exportedAt.getFullYear(),
    padTimestampPart(exportedAt.getMonth() + 1),
    padTimestampPart(exportedAt.getDate()),
  ].join('')
  const time = [
    padTimestampPart(exportedAt.getHours()),
    padTimestampPart(exportedAt.getMinutes()),
    padTimestampPart(exportedAt.getSeconds()),
  ].join('')

  return `${safeName || 'simflow-workflow'}-${timestamp}-${time}.json`
}
