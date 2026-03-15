import { ensureModelLoaded, parseModelLevel, pickBestContinuationWithDepth } from '#server/utils/model'
import { BodyRequestSchema, parseBodyOrThrow } from '#server/utils/schema'
import type { BoardPosition } from '~/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const modelLevel = parseModelLevel(getRouterParam(event, 'modelLevel'))

  await ensureModelLoaded(modelLevel, config.modelsPath)

  const { board, move: playerColor, depth } = await parseBodyOrThrow(event, BodyRequestSchema)

  const continuation = await pickBestContinuationWithDepth(board as BoardPosition, playerColor, depth)

  return { continuation }
})
