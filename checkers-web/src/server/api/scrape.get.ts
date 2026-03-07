import { z } from 'zod'
import { type ModelLevel, type ScrapeModelLevel, MODEL_LEVELS } from '~/types'
import { playGames } from '#server/utils/scrape'

const MAX_GAMES = 100_000

const QuerySchema = z.object({
  games: z.coerce.number().int().min(1).max(MAX_GAMES).default(1_000),

  modelLevel: z.coerce.number().refine((n) => ([0, ...MODEL_LEVELS] as readonly number[]).includes(n), { message: `modelLevel must be one of: ${MODEL_LEVELS.join(', ')}` }),

  random: z.coerce.number().min(0, 'random must be ≥ 0').max(1, 'random must be ≤ 1'),
})

export default defineEventHandler((event) => {
  if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'local') {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)

  const parsed = QuerySchema.safeParse(query)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const message = Object.entries(first)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('; ')
    throw createError({ statusCode: 400, statusMessage: message })
  }

  const { games, modelLevel, random } = parsed.data

  playGames(games, modelLevel as ScrapeModelLevel, random).catch((error) =>
    console.error('[scrape] Fatal error:', error),
  )

  return { status: 'started', games, modelLevel, random }
})
