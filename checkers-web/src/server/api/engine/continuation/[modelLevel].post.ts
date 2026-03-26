import { ensureModelLoaded, parseModelLevel } from '#server/utils/model'
import { BodyRequestSchema, parseBodyOrThrow } from '#server/utils/schema'
import type { BoardPosition } from '~/types'
import { pickBestContinuationWithDepth } from '~/server/utils/eval'
import { USE_ALPHA_BETA } from '~/config'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const modelLevel = parseModelLevel(getRouterParam(event, 'modelLevel'))

  await ensureModelLoaded(modelLevel, config.modelsPath)

  const { board, move: playerColor, depth } = await parseBodyOrThrow(event, BodyRequestSchema)

  const { moves } = await pickBestContinuationWithDepth(board as BoardPosition, playerColor, depth, {useAlphaBeta: USE_ALPHA_BETA})

  return {continuation: moves}
})
