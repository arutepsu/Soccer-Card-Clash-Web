import type { WebGameState } from '@/types/WebGameState'
import { nextTick } from 'vue'

export type StreamFrame = { state: WebGameState; meta?: any | null; receivedAt: number }

export type FrameHandlers = {
  applyState: (s: WebGameState) => void
  handleMeta: (meta: any | null | undefined, state: WebGameState) => Promise<void>
  setUiBusy?: (busy: boolean) => void
}

export function createStreamFrameQueue(handlers: FrameHandlers) {
  const q: StreamFrame[] = []
  let running = false

  function enqueue(f: StreamFrame) {
    q.push(f)
    if (!running) void run()
  }

  async function run() {
    running = true
    handlers.setUiBusy?.(true)

    try {
      while (q.length) {
        const frame = q.shift()!

        handlers.applyState(frame.state)

        await nextTick()

        await handlers.handleMeta(frame.meta ?? null, frame.state)

        await nextTick()
      }
    } finally {
      running = false
      handlers.setUiBusy?.(false)
    }
  }

  function clear() {
    q.length = 0
  }

  function isRunning() {
    return running || q.length > 0
  }

  return { enqueue, clear, isRunning }
}
