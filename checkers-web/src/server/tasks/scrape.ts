import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { ScrapeModelLevel } from '~/types'
import { playGames } from '#server/utils/scrape'

type Payload = {
  games: number
  modelLevel: ScrapeModelLevel
  random: number
  depth: number
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
    const cores = Math.max(1, parseInt(process.env.CORES ?? '1', 10))

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const folderName = `games_${timestamp}`
    const folder = join(process.cwd(), '..', 'data', folderName)
    mkdirSync(folder, { recursive: true })

    const gamesPerWorker = Math.ceil(games / cores)

    const files = await Promise.all(
      Array.from({ length: cores }, (_, i) =>
        playGames(gamesPerWorker, modelLevel, random, depth, join(folder, `${i + 1}.json`)),
      ),
    )

    return { result: { folder, files } }
  },
})
