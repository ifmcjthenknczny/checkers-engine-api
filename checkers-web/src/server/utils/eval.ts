import * as ort from 'onnxruntime-node'
import { type Player, type BoardPosition, type Move } from '~/types'
import { findAllLegalContinuations, applyMovesToBoard } from '~/helpers/move'
import { PRUNE_CONFIG } from '~/config'
import { session } from './model'
import { type ShallowCandidate, buildSortedShallowCandidates, filterCandidatesByDelta } from './prune'

type PlayerToMove = -1 | 1

type AlphaBetaOptions = { alpha?: number; beta?: number; useAlphaBeta: boolean }

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

// TODO: simplify logic of this function insides
async function evaluateBoardDeeplyWithBounds(
  board: BoardPosition,
  currentPlayer: Player,
  depth: number,
  bounds: AlphaBetaOptions = { useAlphaBeta: true },
): Promise<number> {
  if (depth === 0) {
      return evaluateBoardShallow(board, currentPlayer)
  }

  let alpha = bounds.alpha ?? -Infinity
  let beta = bounds.beta ?? Infinity

  const continuations = findAllLegalContinuations(board, currentPlayer)
  if (continuations.length === 0) {
    return currentPlayer === 'white' ? -1 : 1
  }

  const opponent: Player = currentPlayer === 'white' ? 'black' : 'white'
  const isMaximizing = currentPlayer === 'white'

  if (depth === 1) {
    const shouldPruneByDelta = bounds.useAlphaBeta && continuations.length >= PRUNE_CONFIG.maxBestContinuations
    let candidates = await buildSortedShallowCandidates(board, continuations, opponent)

    if (shouldPruneByDelta) {
      candidates = filterCandidatesByDelta(candidates, isMaximizing, PRUNE_CONFIG.delta).slice(0, PRUNE_CONFIG.maxBestContinuations)
    }

    let best = isMaximizing ? -Infinity : Infinity
    for (const candidate of candidates) {
      const score = candidate.shallowScore
      if (isMaximizing) {
        best = Math.max(best, score)
        if (bounds.useAlphaBeta) {
          alpha = Math.max(alpha, best)
          if (alpha >= beta) {
              break
          }
        }
      } else {
        best = Math.min(best, score)
        if (bounds.useAlphaBeta) {
          beta = Math.min(beta, best)
          if (alpha >= beta) {
              break
          }
        }
      }
    }
    return best
  }

  const shouldPruneByDelta = bounds.useAlphaBeta && continuations.length >= PRUNE_CONFIG.maxBestContinuations
  const candidates: ShallowCandidate[] | null = shouldPruneByDelta ? filterCandidatesByDelta(await buildSortedShallowCandidates(board, continuations, opponent), isMaximizing, PRUNE_CONFIG.delta).slice(0, PRUNE_CONFIG.maxBestContinuations) : null

  let best = isMaximizing ? -Infinity : Infinity
  if (candidates) {
    for (const candidate of candidates) {
      const score = await evaluateBoardDeeplyWithBounds(candidate.resultBoard, opponent, depth - 1, bounds)
      if (isMaximizing) {
        best = Math.max(best, score)
        if (bounds.useAlphaBeta) {
          alpha = Math.max(alpha, best)
          if (alpha >= beta) {
              break
          }
        }
      } else {
        best = Math.min(best, score)
        if (bounds.useAlphaBeta) {
          beta = Math.min(beta, best)
          if (alpha >= beta) {
              break
          }
        }
      }
    }
  } else {
    for (const moves of continuations) {
      const resultBoard = applyMovesToBoard(board, moves)
      const score = await evaluateBoardDeeplyWithBounds(resultBoard, opponent, depth - 1, bounds)
      if (isMaximizing) {
        best = Math.max(best, score)
        if (bounds.useAlphaBeta) {
          alpha = Math.max(alpha, best)
          if (alpha >= beta) {
              break
          }
        }
      } else {
        best = Math.min(best, score)
        if (bounds.useAlphaBeta) {
          beta = Math.min(beta, best)
          if (alpha >= beta) {
              break
          }
        }
      }
    }
  }

  return best
}

export async function evaluateBoardDeeply(
  board: BoardPosition,
  currentPlayer: Player,
  depth: number,
  bounds: AlphaBetaOptions = { useAlphaBeta: true, alpha: -Infinity, beta: Infinity },
): Promise<number> {
  return evaluateBoardDeeplyWithBounds(board, currentPlayer, depth, bounds)
}

export async function pickBestContinuationWithDepth(
  board: BoardPosition,
  player: Player,
  depth: number,
  useAlphaBeta: boolean = true,
): Promise<{moves: Move[], score: number}> {
  const continuations = findAllLegalContinuations(board, player)
  if (continuations.length === 0) {
    return { moves: [], score: player === 'white' ? -1 : 1 }
  }

  const opponent: Player = player === 'white' ? 'black' : 'white'
  const isMaximizing = player === 'white'

  const shouldPruneByDelta = useAlphaBeta && continuations.length >= PRUNE_CONFIG.maxBestContinuations

  let candidates = await buildSortedShallowCandidates(board, continuations, opponent)

  if (shouldPruneByDelta) {
    candidates = filterCandidatesByDelta(candidates, isMaximizing, PRUNE_CONFIG.delta)
  }
  candidates = candidates.slice(0, PRUNE_CONFIG.maxBestContinuations)

  const bestCandidate = candidates[0]
  if (depth <= 1) {
    return { moves: bestCandidate.moves, score: bestCandidate.shallowScore }
  }

  let alpha = -Infinity
  let beta = Infinity
  let bestMoves: Move[] = bestCandidate.moves
  let bestScore = isMaximizing ? -Infinity : Infinity

  for (const candidate of candidates) {
    const score = await evaluateBoardDeeplyWithBounds(candidate.resultBoard, opponent, depth - 1, {useAlphaBeta, alpha, beta})

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score
        bestMoves = candidate.moves
      }
      if (useAlphaBeta) {
        alpha = Math.max(alpha, bestScore)
        if (alpha >= beta) {
          break
        }
      }
    } else {
      if (score < bestScore) {
        bestScore = score
        bestMoves = candidate.moves
      }
      if (useAlphaBeta) {
        beta = Math.min(beta, bestScore)
        if (alpha >= beta) {
          break
        }
      }
    }
  }

  return { moves: bestMoves, score: bestScore }
}