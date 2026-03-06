import { z } from 'zod'
import { loadModel, evaluateBoardRaw } from '#server/utils/model'
import { type ModelLevel, MODEL_LEVELS } from '~/types'

// TODO: Map them from human form
const ALLOWED_PIECES = [0, 1, -1, 3, -3]
const ALLOWED_MOVES = [-1, 1]

const BodySchema = z.object({
  board: z
    .array(z.number().int())
    .length(32, 'Array must have exactly 32 elements')
    .refine((arr) => arr.every((val) => ALLOWED_PIECES.includes(val)), {
      message: 'Allowed values are: 0 (empty), 1/-1 (pawns), 3/-3 (queens)',
    }),
  move: z.number().int().refine((val) => ALLOWED_MOVES.includes(val), {
    message: 'Move must be 1 (White) or -1 (Black)',
  }),
})

const ModelLevelSchema = z.enum(MODEL_LEVELS.map(level => level.toString()), {
  message: `Model level is invalid. Must be one of: ${MODEL_LEVELS.join(', ')}`,
})

let modelLevelLoaded: ModelLevel | null = null

export const DEFAULT_MODEL_LEVEL = MODEL_LEVELS.at(-1)!

// TODO: get model depth (default is 1) from body
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const modelsPath = config.modelsPath
  const modelLevelParam = getRouterParam(event, 'modelLevel')
  const modelLevel = ModelLevelSchema.safeParse(modelLevelParam).data ? +modelLevelParam! as ModelLevel : DEFAULT_MODEL_LEVEL

  if (modelLevelLoaded !== modelLevel) {
    await loadModel(modelLevel, modelsPath)
    modelLevelLoaded = modelLevel
  }

  const body = BodySchema.safeParse(await readBody(event))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: body.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }

  const evaluation = await evaluateBoardRaw(body.data.board, body.data.move)

  return {
    evaluation,
    status: 'success',
  }
})
