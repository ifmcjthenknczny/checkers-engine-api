import { z } from 'zod'
import { loadModel, evaluateBoardRaw } from '#server/utils/model'
import { type ModelLevel, MODEL_LEVELS } from '~/types'
import { findAllLegalContinuations, applyMove } from '~/helpers/move'
import type { BoardPosition, Player } from '~/types'

const ALLOWED_PIECES = [0, 1, -1, 3, -3]
const ALLOWED_PLAYERS_TO_MOVE = [-1, 1]

const BodySchema = z.object({
  board: z
    .array(z.number().int())
    .length(32, 'Array must have exactly 32 elements')
    .refine((arr) => arr.every((val) => ALLOWED_PIECES.includes(val)), {
      message: 'Allowed values are: 0 (empty), 1/-1 (pawns), 3/-3 (queens)',
    }),
  move: z.number().int().refine((val) => ALLOWED_PLAYERS_TO_MOVE.includes(val), {
    message: 'Player to move must be 1 (White) or -1 (Black)',
  }),
  modelLevel: z.number().int().optional(),
})

const DEFAULT_MODEL_LEVEL: ModelLevel = MODEL_LEVELS.at(-1)!

let modelLevelLoaded: ModelLevel | null = null

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const modelsPath = config.modelsPath

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

  const modelLevel: ModelLevel =
    body.data.modelLevel != null && (MODEL_LEVELS as readonly number[]).includes(body.data.modelLevel)
      ? (body.data.modelLevel as ModelLevel)
      : DEFAULT_MODEL_LEVEL

  if (modelLevelLoaded !== modelLevel) {
    await loadModel(modelLevel, modelsPath)
    modelLevelLoaded = modelLevel
  }

  const { board, move } = body.data
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
