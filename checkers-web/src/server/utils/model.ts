import * as ort from 'onnxruntime-node'
import { z } from 'zod'
import path from 'node:path'
import { type ModelLevel, MODEL_LEVELS, type Player, type BoardPosition, type Move } from '~/types'
import { findAllLegalContinuations, applyMove } from '~/helpers/move'
import { DEFAULT_MODEL_LEVEL } from '~/config'

type PlayerToMove = -1 | 1

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

export async function evaluateBoardShallow(board: BoardPosition, move: Player): Promise<number> {
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

type ShallowCandidate = { moves: Move[]; resultBoard: BoardPosition; shallowScore: number }

function applyMovesToBoard(board: BoardPosition, moves: Move[]): BoardPosition {
  return moves.reduce(
    (boardPosition, move) => applyMove(boardPosition, move).boardAfter,
    [...board] as BoardPosition,
  )
}

function shouldPruneVariant(args: {
  isMaximizing: boolean
  bestShallowScore: number
  candidateShallowScore: number
  delta: number
}): boolean {
  if (args.isMaximizing) {
    // Maximizing prefers higher scores. Prune if candidate is too far below best.
    return args.bestShallowScore - args.candidateShallowScore >= args.delta
  }
  // Minimizing prefers lower scores. Prune if candidate is too far above best.
  return args.candidateShallowScore - args.bestShallowScore >= args.delta
}

async function buildShallowCandidates(
  board: BoardPosition,
  continuations: Move[][],
  evaluationPlayer: Player,
): Promise<ShallowCandidate[]> {
  return Promise.all(
    continuations.map(async (moves) => {
      const resultBoard = applyMovesToBoard(board, moves)
      const shallowScore = await evaluateBoardShallow(resultBoard, evaluationPlayer)
      return { moves, resultBoard, shallowScore }
    }),
  )
}

function sortCandidatesByShallowInPlace(candidates: ShallowCandidate[], isMaximizing: boolean): void {
  candidates.sort((a, b) => (isMaximizing ? b.shallowScore - a.shallowScore : a.shallowScore - b.shallowScore))
}

function filterCandidatesByDelta(candidates: ShallowCandidate[], isMaximizing: boolean, delta: number): ShallowCandidate[] {
  if (candidates.length === 0) return candidates
  const bestShallowScore = candidates[0].shallowScore
  return candidates.filter((c) => !shouldPruneVariant({
    isMaximizing,
    bestShallowScore,
    candidateShallowScore: c.shallowScore,
    delta,
  }))
}

export async function evaluateBoardDeeply(
  board: BoardPosition,
  currentPlayer: Player,
  depth: number,
  alpha = -Infinity,
  beta = Infinity,
): Promise<number> {
  if (depth === 0) return evaluateBoardShallow(board, currentPlayer)

  const continuations = findAllLegalContinuations(board, currentPlayer)
  if (continuations.length === 0) return currentPlayer === 'white' ? -1 : 1

  const opponent: Player = currentPlayer === 'white' ? 'black' : 'white'
  const isMaximizing = currentPlayer === 'white'

  const SHALLOW_PRUNE_DELTA = 0.4
  const PRUNE_AT_MIN_CONTINUATIONS = 6
  const MAX_CONTINUATIONS_TO_EXPLORE = 6

  if (depth === 1) {
    const shouldPruneByDelta = continuations.length >= PRUNE_AT_MIN_CONTINUATIONS
    let candidates = await buildShallowCandidates(board, continuations, opponent)
    sortCandidatesByShallowInPlace(candidates, isMaximizing)

    if (shouldPruneByDelta) {
      candidates = filterCandidatesByDelta(candidates, isMaximizing, SHALLOW_PRUNE_DELTA)
      candidates = candidates.slice(0, MAX_CONTINUATIONS_TO_EXPLORE)
    }

    let best = isMaximizing ? -Infinity : Infinity
    for (const candidate of candidates) {
      const score = candidate.shallowScore
      if (isMaximizing) {
        best = Math.max(best, score)
        alpha = Math.max(alpha, best)
        if (alpha >= beta) break
      } else {
        best = Math.min(best, score)
        beta = Math.min(beta, best)
        if (alpha >= beta) break
      }
    }
    return best
  }

  const shouldPruneByDelta = continuations.length >= PRUNE_AT_MIN_CONTINUATIONS
  let candidates: ShallowCandidate[] | null = null
  if (shouldPruneByDelta) {
    candidates = await buildShallowCandidates(board, continuations, opponent)
    sortCandidatesByShallowInPlace(candidates, isMaximizing)
    candidates = filterCandidatesByDelta(candidates, isMaximizing, SHALLOW_PRUNE_DELTA)
    candidates = candidates.slice(0, MAX_CONTINUATIONS_TO_EXPLORE)
  }

  let best = isMaximizing ? -Infinity : Infinity
  if (candidates) {
    for (const candidate of candidates) {
      const score = await evaluateBoardDeeply(candidate.resultBoard, opponent, depth - 1, alpha, beta)
      if (isMaximizing) {
        best = Math.max(best, score)
        alpha = Math.max(alpha, best)
        if (alpha >= beta) break
      } else {
        best = Math.min(best, score)
        beta = Math.min(beta, best)
        if (alpha >= beta) break
      }
    }
  } else {
    for (const moves of continuations) {
      const resultBoard = applyMovesToBoard(board, moves)
      const score = await evaluateBoardDeeply(resultBoard, opponent, depth - 1, alpha, beta)
      if (isMaximizing) {
        best = Math.max(best, score)
        alpha = Math.max(alpha, best)
        if (alpha >= beta) break
      } else {
        best = Math.min(best, score)
        beta = Math.min(beta, best)
        if (alpha >= beta) break
      }
    }
  }

  return best
}

export async function pickBestContinuationWithDepth(
  board: BoardPosition,
  player: Player,
  depth: number
): Promise<{moves: Move[], score: number}> {
  const continuations = findAllLegalContinuations(board, player)
  if (continuations.length === 0) {
    return { moves: [], score: player === 'white' ? -1 : 1 }
  }

  const clampedDepth = Math.min(depth, MAX_DEPTH)
  const opponent: Player = player === 'white' ? 'black' : 'white'
  const isMaximizing = player === 'white'

  const SHALLOW_PRUNE_DELTA = 0.4
  const PRUNE_AT_MIN_CONTINUATIONS = 6
  const MAX_CONTINUATIONS_TO_EXPLORE = 8

  const shouldPruneByDelta = continuations.length >= PRUNE_AT_MIN_CONTINUATIONS

  let candidates = await buildShallowCandidates(board, continuations, opponent)
  sortCandidatesByShallowInPlace(candidates, isMaximizing)

  if (shouldPruneByDelta) {
    candidates = filterCandidatesByDelta(candidates, isMaximizing, SHALLOW_PRUNE_DELTA)
  }
  candidates = candidates.slice(0, MAX_CONTINUATIONS_TO_EXPLORE)

  const bestCandidate = candidates[0]
  if (clampedDepth <= 1) {
    return { moves: bestCandidate.moves, score: bestCandidate.shallowScore }
  }

  let alpha = -Infinity
  let beta = Infinity
  let bestMoves: Move[] = bestCandidate.moves
  let bestScore = isMaximizing ? -Infinity : Infinity

  for (const candidate of candidates) {
    const score = await evaluateBoardDeeply(candidate.resultBoard, opponent, clampedDepth - 1, alpha, beta)

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score
        bestMoves = candidate.moves
      }
      alpha = Math.max(alpha, bestScore)
      if (alpha >= beta) break
    } else {
      if (score < bestScore) {
        bestScore = score
        bestMoves = candidate.moves
      }
      beta = Math.min(beta, bestScore)
      if (alpha >= beta) break
    }
  }

  return { moves: bestMoves, score: bestScore }
}

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
