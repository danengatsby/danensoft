/** Un singur lot activ per proces; lease-ul SQLite protejează și între procese. */
export function createMailWorker({ queue, sendMail, isConfigured, now = () => new Date(),
  pollMs = 10_000, leaseMs = 120_000 }) {
  let active = null
  let timer = null
  let stopped = false

  async function processBatch() {
    for (let count = 0; count < 10 && !stopped && isConfigured(); count++) {
      const job = queue.claim(now(), leaseMs)
      if (!job) break
      const heartbeat = setInterval(() => {
        try { queue.renew(job, now(), leaseMs) }
        catch { console.error('[danen-api] Reînnoirea rezervării e-mail a eșuat.') }
      }, Math.floor(leaseMs / 3))
      heartbeat.unref()
      try {
        let result
        try { result = await sendMail(JSON.parse(job.payload)) }
        catch { result = { error: true } }
        if (result?.id) queue.sent(job, result.id, now())
        else queue.failed(job, now(), { skipped: Boolean(result?.skipped) })
      } finally {
        clearInterval(heartbeat)
      }
    }
  }

  function drain() {
    if (stopped) return Promise.resolve()
    if (!active) active = processBatch().finally(() => { active = null })
    return active
  }
  function wake() {
    void drain().catch(() => console.error('[danen-api] Procesarea cozii e-mail a eșuat; va fi reluată.'))
  }
  return {
    drain,
    wake,
    start() {
      if (timer || stopped) return
      timer = setInterval(wake, pollMs)
      timer.unref()
      wake()
    },
    async stop() {
      stopped = true
      clearInterval(timer)
      await active
    },
  }
}
