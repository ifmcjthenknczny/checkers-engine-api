import { z } from 'zod'
import { evaluateBoardRaw } from '#server/utils/model'
import { BoardMoveSchema, DEFAULT_MODEL_LEVEL, ensureModelLoaded, parseBodyOrThrow } from '#server/utils/engine'
import { type ModelLevel, MODEL_LEVELS } from '~/types'

const ModelLevelSchema = z.enum(MODEL_LEVELS.map(level => level.toString()), {
  message: `Model level is invalid. Must be one of: ${MODEL_LEVELS.join(', ')}`,
})

// TODO: get model depth (default is 1) from body
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const modelLevelParam = getRouterParam(event, 'modelLevel')
  const modelLevel = ModelLevelSchema.safeParse(modelLevelParam).data
    ? +modelLevelParam! as ModelLevel
    : DEFAULT_MODEL_LEVEL

  await ensureModelLoaded(modelLevel, config.modelsPath)

  const body = await parseBodyOrThrow(event, BoardMoveSchema)
  const evaluation = await evaluateBoardRaw(body.board, body.move)

  return { evaluation, status: 'success' }
})
