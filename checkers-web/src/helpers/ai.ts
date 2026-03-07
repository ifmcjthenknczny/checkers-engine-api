import type { BoardPosition, Move, Player } from '../types'
import { evaluateBoard } from './engine'
import { applyMove, findAllLegalContinuations } from './move'
import { chooseRandomly } from './utils'

export type BoardEvaluator = (board: BoardPosition, player: Player) => Promise<number>

export function pickRandomContinuation(
  board: BoardPosition,
  player: Player,
): Move[] {
  const continuations = findAllLegalContinuations(board, player)
  return chooseRandomly(continuations)
}

export async function pickBestContinuation(
  board: BoardPosition,
  player: Player,
  evaluate: BoardEvaluator,
): Promise<Move[]> {
  const continuations = findAllLegalContinuations(board, player)

  const resultingBoards = continuations.map((continuationMoves) =>
    continuationMoves.reduce(
      (currentBoard, move) => applyMove(currentBoard, move),
      [...board] as BoardPosition,
    ),
  )

  const evaluations = await Promise.all(
    resultingBoards.map((board) => evaluate(board, player)),
  )
  const isMaximizing = player === 'white'
  const bestIndex = evaluations.reduce(
    (bestIndex, evaluation, index) => {
      if (isMaximizing && evaluation > evaluations[bestIndex]) {
        return index
      }
      if (!isMaximizing && evaluation < evaluations[bestIndex]) {
        return index
      }
      return bestIndex
    },
    0,
  )
  return continuations[bestIndex] ?? []
}

export async function pickBestEngineContinuation(
  board: BoardPosition,
  player: Player,
): Promise<Move[]> {
  return pickBestContinuation(board, player, evaluateBoard)
}