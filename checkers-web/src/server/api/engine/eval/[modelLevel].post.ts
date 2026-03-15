import { evaluateBoardRaw, minimaxScore, ensureModelLoaded, parseModelLevel } from '#server/utils/model'
import { BodyRequestSchema, parseBodyOrThrow } from '#server/utils/schema'
import type { BoardPosition } from '~/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const modelLevel = parseModelLevel(getRouterParam(event, 'modelLevel'))

  await ensureModelLoaded(modelLevel, config.modelsPath)

  const { board, move, depth } = await parseBodyOrThrow(event, BodyRequestSchema)
  const boardPosition = board as BoardPosition

  const evaluation = depth === 0
    ? await evaluateBoardRaw(boardPosition, move)
    : await minimaxScore(boardPosition, move, depth)

  return { evaluation, status: 'success' }
})
