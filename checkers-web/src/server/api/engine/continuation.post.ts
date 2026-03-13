import { z } from 'zod'
import { evaluateBoardRaw } from '#server/utils/model'
import { BoardMoveSchema, DEFAULT_MODEL_LEVEL, ensureModelLoaded, parseBodyOrThrow } from '#server/utils/engine'
import { type ModelLevel, MODEL_LEVELS } from '~/types'
import { findAllLegalContinuations, applyMove } from '~/helpers/move'
import type { BoardPosition, Player } from '~/types'

const ContinuationBodySchema = BoardMoveSchema.extend({
  modelLevel: z.number().int().optional(),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await parseBodyOrThrow(event, ContinuationBodySchema)

  const modelLevel: ModelLevel =
    body.modelLevel != null && (MODEL_LEVELS as readonly number[]).includes(body.modelLevel)
      ? (body.modelLevel as ModelLevel)
      : DEFAULT_MODEL_LEVEL

  await ensureModelLoaded(modelLevel, config.modelsPath)

  const { board, move } = body
  const playerColor: Player = move === 1 ? 'white' : 'black'
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
    resultingBoards.map((b) => evaluateBoardRaw(b as number[], move)),
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
