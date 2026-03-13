import { z } from 'zod'
import type { H3Event } from 'h3'
import { type ModelLevel, MODEL_LEVELS } from '~/types'
import { loadModel } from './model'

const ALLOWED_PIECES = [0, 1, -1, 3, -3]
const ALLOWED_PLAYERS_TO_MOVE = [-1, 1]

export const BoardMoveSchema = z.object({
  board: z
    .array(z.number().int())
    .length(32, 'Array must have exactly 32 elements')
    .refine((arr) => arr.every((val) => ALLOWED_PIECES.includes(val)), {
      message: 'Allowed values are: 0 (empty), 1/-1 (pawns), 3/-3 (queens)',
    }),
  move: z.number().int().refine((val) => ALLOWED_PLAYERS_TO_MOVE.includes(val), {
    message: 'Player to move must be 1 (White) or -1 (Black)',
  }),
})

export const DEFAULT_MODEL_LEVEL: ModelLevel = MODEL_LEVELS.at(-1)!

let modelLevelLoaded: ModelLevel | null = null

export async function ensureModelLoaded(modelLevel: ModelLevel, modelsPath: string): Promise<void> {
  if (modelLevelLoaded !== modelLevel) {
    await loadModel(modelLevel, modelsPath)
    modelLevelLoaded = modelLevel
  }
}

export async function parseBodyOrThrow<T>(event: H3Event, schema: z.ZodSchema<T>): Promise<T> {
  const result = schema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }
  return result.data
}
