// frontend/src/game/eventQueue.ts
export function createAsyncQueue() {
  let chain = Promise.resolve()

  function enqueue(task: () => Promise<void> | void) {
    chain = chain.then(async () => {
      await task()
    }).catch((e) => {
      console.warn('[queue] task failed', e)
    })
    return chain
  }

  return { enqueue }
}
