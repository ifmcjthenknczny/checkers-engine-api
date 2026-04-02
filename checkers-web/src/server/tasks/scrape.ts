import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { ScrapeModelLevel } from '~/types'
import { playGames } from '#server/utils/scrape'
import { SCRAPE_CONFIG } from '~/config'

type Payload = {
  games: number
  modelLevel: ScrapeModelLevel
  random: number
  depth: number
}

const BAR_WIDTH = 24

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  if (totalSec < 60) return `${totalSec}s`
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}

function createProgressTracker(total: number, cores: number) {
  let completed = 0
  let written = 0
  const startTime = Date.now()

  function log() {
    if (completed !== 1 && completed % SCRAPE_CONFIG.logEvery !== 0 && completed !== total) return

    const elapsedMs = Date.now() - startTime
    const avgMs = written > 0 ? elapsedMs / written : 0
    const remaining = total - completed
    const etaMs = avgMs > 0 ? avgMs * remaining : 0

    const filled = Math.round((completed / total) * BAR_WIDTH)
    const bar = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled)
    const avgStr = avgMs > 0 ? `${(avgMs / 1000).toFixed(3)}s` : '—'
    const etaStr = etaMs > 0 ? formatDuration(etaMs) : '—'

    process.stdout.write(
      `\r[scrape] [${bar}] ${completed}/${total} | avg: ${avgStr}/game | remaining: ${remaining} | ETA: ${etaStr}   `,
    )
    if (completed === total) {
      process.stdout.write('\n')
    }
  }

  return {
    onGameComplete(wasWritten: boolean) {
      completed++
      if (wasWritten) {
        written++
      }
      log()
    },
    summarize() {
      const totalSec = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`[scrape] Done: ${written}/${total} games written in ${totalSec}s across ${cores} core(s).`)
    },
  }
}

export default defineTask({
  meta: {
    name: 'scrape',
    description: 'Play self-play games and save training data',
  },
  async run({ payload }) {
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'development') {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const { games, modelLevel, random, depth } = payload as Payload
    const cores = Math.max(1, +(process.env.CORES ?? 1))

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const folderName = `games_${timestamp}`
    const folder = join(process.cwd(), '..', 'data', folderName)
    mkdirSync(folder, { recursive: true })

    const gamesPerWorker = Math.ceil(games / cores)
    const tracker = createProgressTracker(cores * gamesPerWorker, cores)

    const files = await Promise.all(
      Array.from({ length: cores }, (_, i) =>
        playGames(gamesPerWorker, modelLevel, random, depth, join(folder, `${i + 1}.json`), tracker.onGameComplete),
      ),
    )

    tracker.summarize()
    return { result: { folder, files } }
  },
})
