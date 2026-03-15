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
    const outputFile = await playGames(games, modelLevel, random, depth)
    return { result: { outputFile } }
  },
})
