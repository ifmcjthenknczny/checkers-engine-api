import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { ScrapeModelLevel } from '~/types'
import { playGames } from '#server/utils/scrape'
import { logTotalProgress } from '#server/utils/log'
import { SCRAPE_CONFIG } from '~/config'

type Payload = {
  games: number
  modelLevel: ScrapeModelLevel
  random: number
  depth: number
}

const BAR_WIDTH = 24

function createProgressTracker(total: number, cores: number) {
  let completed = 0
  let written = 0
  const startTime = Date.now()

  return {
    onGameComplete(wasWritten: boolean) {
      completed++
      if (wasWritten) {
        written++
      }
      const shouldLogProgress = (
        completed === 1 ||
        completed % SCRAPE_CONFIG.progressLogEveryCompletedGames === 0 ||
        completed === total
      )
      if (shouldLogProgress) {
        logTotalProgress({
          completed,
          total,
          startTime,
          mode: 'bar',
          barWidth: BAR_WIDTH,
        })
      }
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
