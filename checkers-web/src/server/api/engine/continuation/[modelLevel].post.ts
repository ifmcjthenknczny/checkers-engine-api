import { evaluateBoardRaw, ensureModelLoaded, parseModelLevel } from '#server/utils/model'
import { BodyRequestSchema, parseBodyOrThrow } from '#server/utils/schema'
import { findAllLegalContinuations, applyMove } from '~/helpers/move'
import type { BoardPosition } from '~/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const modelLevel = parseModelLevel(getRouterParam(event, 'modelLevel'))

  await ensureModelLoaded(modelLevel, config.modelsPath)

  const { board, move: playerColor } = await parseBodyOrThrow(event, BodyRequestSchema)
  const boardPosition = board as BoardPosition

  const continuations = findAllLegalContinuations(boardPosition, playerColor)

  if (continuations.length === 0) {
    return { continuation: [] }
  }

  const resultingBoards = continuations.map((continuationMoves) =>
    continuationMoves.reduce(
      (currentBoard, m) => applyMove(currentBoard, m).boardAfter,
      [...boardPosition] as BoardPosition,
    ),
  )

  const evaluations = await Promise.all(
    resultingBoards.map((b) => evaluateBoardRaw(b, playerColor)),
  )

  const isMaximizing = playerColor === 'white'
  const bestIndex = evaluations.reduce(
    (bestIdx, evaluation, index) => {
      if (isMaximizing && evaluation > evaluations[bestIdx]) return index
      if (!isMaximizing && evaluation < evaluations[bestIdx]) return index
      return bestIdx
    },
    0,
  )

  return { continuation: continuations[bestIndex] ?? [] }
})
