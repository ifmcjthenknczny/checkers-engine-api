import { v4 as uuid } from 'uuid'

const pad2 = (n: number): string => String(n).padStart(2, '0')

export function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  if (totalSec < 60) return `${totalSec}s`
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}

export function formatEtaSeconds(etaMs: number): string {
  return `${Math.round(etaMs / 1000)}s`
}

export function formatEtaDateStr(etaMs: number, now = Date.now()): string {
  const d = new Date(now + etaMs)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(
    d.getMinutes(),
  )}:${pad2(d.getSeconds())}`
}

type LogTotalProgressMode = 'bar' | 'line'

const shouldUseProgressBarPage = process.env.PROGRESS_BAR_API_KEY !== undefined && process.env.PROGRESS_BAR_API_URL !== undefined
const scrapeRunUuid = uuid()

export async function logTotalProgress(options: {
  completed: number
  total: number
  startTime: number
  mode: LogTotalProgressMode
  barWidth?: number
}): Promise<void> {
  const { completed, total, startTime, mode } = options
  const barWidth = options.barWidth ?? 24

  const elapsedMs = Date.now() - startTime
  const avgMs = completed > 0 ? elapsedMs / completed : 0
  const remaining = total - completed
  const etaMs = avgMs > 0 ? avgMs * remaining : 0

  const etaDateStr = etaMs > 0 ? formatEtaDateStr(etaMs) : '—'

  if (shouldUseProgressBarPage) {
    const remoteProgressBarUrl = `${process.env.PROGRESS_BAR_API_URL}/${scrapeRunUuid}`
    const body = JSON.stringify({
      completed,
      total,
      startTime
    })
    await fetch(remoteProgressBarUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PROGRESS_BAR_API_KEY!,
      },
      body,
    })
  }

  if (mode === 'bar') {
    const filled = Math.round((completed / total) * barWidth)
    const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled)
    const avgToken = avgMs > 0 ? `${(avgMs / 1000).toFixed(3)}s` : '—'
    const etaStr = etaMs > 0 ? formatDuration(etaMs) : '—'

    process.stdout.write(
      `\r[scrape] [${bar}] ${completed}/${total} | avg: ${avgToken}/game | ETA: ${etaStr} (at ${etaDateStr})   `,
    )
    if (completed === total) {
      process.stdout.write('\n')
    }
    return
  }

  // mode === 'line'
  const avgTokenSec = avgMs > 0 ? (avgMs / 1000).toFixed(4) : '—'
  const etaStr = etaMs > 0 ? formatEtaSeconds(etaMs) : '—'

  console.log(`[scrape] ${completed}/${total} games, avg. ${avgTokenSec} s/game | ETA: ${etaStr} (at ${etaDateStr})`)
}

