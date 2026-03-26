import { ensureModelLoaded, parseModelLevel } from '#server/utils/model'
import { BodyRequestSchema, parseBodyOrThrow } from '#server/utils/schema'
import type { BoardPosition } from '~/types'
import { evaluateBoardDeeply } from '~/server/utils/eval'
import { USE_ALPHA_BETA } from '~/config'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const modelLevel = parseModelLevel(getRouterParam(event, 'modelLevel'))

  await ensureModelLoaded(modelLevel, config.modelsPath)

  const { board, move, depth } = await parseBodyOrThrow(event, BodyRequestSchema)
  const boardPosition = board as BoardPosition

  const evaluation = await evaluateBoardDeeply(boardPosition, move, depth, {useAlphaBeta: USE_ALPHA_BETA})

  return { evaluation, status: 'success' }
})
