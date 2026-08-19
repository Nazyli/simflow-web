export type NodeAutosaveStatus = 'pending' | 'saving' | 'saved' | 'error'

type QueueEntry<Payload> = {
  payload: Payload
  queued: boolean
  saving: boolean
  timer: ReturnType<typeof setTimeout> | undefined
}

type NodeAutosaveQueueOptions<Payload> = {
  delayMs: number
  save: (nodeId: string, payload: Payload) => Promise<unknown>
  onStatusChange?: (nodeId: string, status: NodeAutosaveStatus) => void
}

export class NodeAutosaveQueue<Payload> {
  private readonly entries = new Map<string, QueueEntry<Payload>>()
  private readonly options: NodeAutosaveQueueOptions<Payload>

  constructor(options: NodeAutosaveQueueOptions<Payload>) {
    this.options = options
  }

  enqueue(nodeId: string, payload: Payload) {
    const entry = this.entries.get(nodeId)
    if (entry) {
      entry.payload = payload
      entry.queued = true
      if (entry.timer) clearTimeout(entry.timer)
      this.options.onStatusChange?.(nodeId, 'pending')
      if (!entry.saving) this.schedule(nodeId, entry)
      return
    }

    const nextEntry = { payload, queued: true, saving: false, timer: undefined }
    this.entries.set(nodeId, nextEntry)
    this.options.onStatusChange?.(nodeId, 'pending')
    this.schedule(nodeId, nextEntry)
  }

  retry(nodeId: string) {
    const entry = this.entries.get(nodeId)
    if (!entry || entry.saving) return
    this.options.onStatusChange?.(nodeId, 'pending')
    this.schedule(nodeId, entry)
  }

  dispose() {
    this.entries.forEach((entry) => {
      if (entry.timer) clearTimeout(entry.timer)
    })
    this.entries.clear()
  }

  private schedule(nodeId: string, entry: QueueEntry<Payload>) {
    entry.timer = setTimeout(() => {
      entry.timer = undefined
      void this.save(nodeId, entry)
    }, this.options.delayMs)
  }

  private async save(nodeId: string, entry: QueueEntry<Payload>) {
    if (entry.saving) return
    entry.saving = true
    entry.queued = false
    this.options.onStatusChange?.(nodeId, 'saving')

    try {
      await this.options.save(nodeId, entry.payload)
      this.options.onStatusChange?.(nodeId, entry.queued ? 'pending' : 'saved')
    } catch {
      if (!entry.queued) this.options.onStatusChange?.(nodeId, 'error')
    } finally {
      entry.saving = false
    }

    if (entry.queued && !entry.timer) this.schedule(nodeId, entry)
  }
}
