import * as ort from 'onnxruntime-node'
import { z } from 'zod'
import path from 'node:path'
import { type ModelLevel, MODEL_LEVELS, type Player, type BoardPosition, type Move } from '~/types'
import { findAllLegalContinuations, applyMove } from '~/helpers/move'

type PlayerToMove = -1 | 1

export const DEFAULT_DEPTH = 6
export const MAX_DEPTH = 20

let session: ort.InferenceSession | null = null

export async function loadModel(level: ModelLevel, modelsPath: string): Promise<void> {
  try {
    const modelPath = path.isAbsolute(modelsPath)
      ? path.join(modelsPath, `engine_${level}.onnx`)
      : path.join(process.cwd(), modelsPath, `engine_${level}.onnx`)
    session = await ort.InferenceSession.create(modelPath)
  } catch (e) {
    console.error(`[ERROR] Loading model ${level} was unsuccessful:`, e)
    throw e
  }
}

function toPlayerToMove(player: Player): PlayerToMove {
  return player === 'white' ? 1 : -1
}

export async function evaluateBoardRaw(board: BoardPosition, move: Player): Promise<number> {
  try {
    if (!session) {
      throw new Error('ONNX Session not initialized')
    }
    const combinedData = new Float32Array(33)
    combinedData.set(board)
    combinedData[32] = toPlayerToMove(move)
    const tensor = new ort.Tensor('float32', combinedData, [1, 33])
    const feeds = { [session.inputNames[0]]: tensor }
    const results = await session.run(feeds)
    return (results[session.outputNames[0]] as ort.Tensor).data[0] as number
  } catch (error) {
    console.error('Evaluation failed:', error)
    throw error
  }
}

export async function minimaxScore(
  board: BoardPosition,
  currentPlayer: Player,
  depth: number,
): Promise<number> {
  if (depth === 0) {
    return evaluateBoardRaw(board, currentPlayer)
  }

  const continuations = findAllLegalContinuations(board, currentPlayer)

  if (continuations.length === 0) {
    return currentPlayer === 'white' ? -1 : 1
  }

  const opponent: Player = currentPlayer === 'white' ? 'black' : 'white'

  const scores = await Promise.all(
    continuations.map((moves) => {
      const resultBoard = moves.reduce(
        (boardPosition, move) => applyMove(boardPosition, move).boardAfter,
        [...board] as BoardPosition,
      )
      return minimaxScore(resultBoard, opponent, depth - 1)
    }),
  )

  return currentPlayer === 'white' ? Math.max(...scores) : Math.min(...scores)
}

export async function pickBestContinuationWithDepth(
  board: BoardPosition,
  player: Player,
  depth: number
): Promise<Move[]> {
  const continuations = findAllLegalContinuations(board, player)

  if (continuations.length === 0) {
    return []
  }
  if (continuations.length === 1) {
    return continuations[0]
  }

  const clampedDepth = Math.min(depth, MAX_DEPTH)
  const opponent: Player = player === 'white' ? 'black' : 'white'
  const isMaximizing = player === 'white'

  const scores = await Promise.all(
    continuations.map((moves) => {
      const resultBoard = moves.reduce(
        (boardPosition, move) => applyMove(boardPosition, move).boardAfter,
        [...board] as BoardPosition,
      )
      if (clampedDepth <= 1) {
        return evaluateBoardRaw(resultBoard, player)
      }
      return minimaxScore(resultBoard, opponent, clampedDepth - 1)
    }),
  )

  const bestIndex = scores.reduce((bestIdx, score, index) => {
    if (isMaximizing) {
      return score > scores[bestIdx] ? index : bestIdx
    }
    return score < scores[bestIdx] ? index : bestIdx
  }, 0)

  return continuations[bestIndex] ?? []
}

export const DEFAULT_MODEL_LEVEL: ModelLevel = MODEL_LEVELS.at(-1)!

export const ModelLevelSchema = z.enum(MODEL_LEVELS.map(level => level.toString()), {
  message: `Model level is invalid. Must be one of: ${MODEL_LEVELS.join(', ')}`,
})

let modelLevelLoaded: ModelLevel | null = null

export async function ensureModelLoaded(modelLevel: ModelLevel, modelsPath: string): Promise<void> {
  if (modelLevelLoaded !== modelLevel) {
    await loadModel(modelLevel, modelsPath)
    modelLevelLoaded = modelLevel
  }
}

export function parseModelLevel(param: string | undefined): ModelLevel {
  return ModelLevelSchema.safeParse(param).data ? +param! as ModelLevel : DEFAULT_MODEL_LEVEL
}
