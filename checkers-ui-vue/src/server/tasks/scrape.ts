import type { ScrapeModelLevel } from '~/types'
import { playGames } from '#server/utils/scrape'

type Payload = {
  games: number
  modelLevel: ScrapeModelLevel
  random: number
}

export default defineTask({
  meta: {
    name: 'scrape',
    description: 'Play self-play games and save training data',
  },
  async run({ payload }) {
    const { games, modelLevel, random } = payload as Payload
    const outputFile = await playGames(games, modelLevel, random)
    return { result: { outputFile } }
  },
})
