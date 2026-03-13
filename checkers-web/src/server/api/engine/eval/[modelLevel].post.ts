import { evaluateBoardRaw, ensureModelLoaded, parseModelLevel } from '#server/utils/model'
import { BodyRequestSchema, parseBodyOrThrow } from '#server/utils/schema'
import type { BoardPosition } from '~/types'

// TODO: get model depth (default is 1) from body
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const modelLevel = parseModelLevel(getRouterParam(event, 'modelLevel'))

  await ensureModelLoaded(modelLevel, config.modelsPath)

  const body = await parseBodyOrThrow(event, BodyRequestSchema)
  const evaluation = await evaluateBoardRaw(body.board as BoardPosition, body.move)

  return { evaluation, status: 'success' }
})
