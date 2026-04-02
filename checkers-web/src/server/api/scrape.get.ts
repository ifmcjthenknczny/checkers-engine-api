import { z } from 'zod'
import { type ScrapeModelLevel, MODEL_LEVELS } from '~/types'
import { DEPTH_CONFIG } from '~/config'

const QuerySchema = z.object({
  games: z.coerce.number().int().min(1).default(1_000),
  modelLevel: z.coerce.number().refine((n) => ([0, ...MODEL_LEVELS] as readonly number[]).includes(n), { message: `modelLevel must be one of: ${MODEL_LEVELS.join(', ')}` }),
  random: z.coerce.number().min(0, 'random must be ≥ 0').max(1, 'random must be ≤ 1'),
  depth: z.coerce.number().int().min(0).max(DEPTH_CONFIG.max).default(0),
})

export default defineEventHandler((event) => {
  if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'development') {
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

  const { games, modelLevel, random, depth } = parsed.data

  runTask('scrape', { payload: { games, modelLevel: modelLevel as ScrapeModelLevel, random, depth } }).catch(
    (error) => console.error('[scrape] Fatal error:', error),
  )

  return { status: 'started', games, modelLevel, random, depth }
})
