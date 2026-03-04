import type { BoardPosition, Move, Player } from '../types'
import { evaluateBoard } from './engine'
import { applyMove, findAllLegalContinuations, findAllLegalMoves } from './move'

export function pickARandomMove(
  player: Player,
  board: BoardPosition,
): Move | null {
  const legalMoves = findAllLegalMoves(board, player)
  if (legalMoves.length === 0) {
    return null
  }
  return legalMoves[Math.floor(Math.random() * legalMoves.length)]!
}

export async function pickBestEngineContinuation(
  board: BoardPosition,
  player: Player,
): Promise<Move[]> {
  const continuations = findAllLegalContinuations(board, player)

  const resultingBoards = continuations.map((continuationMoves) =>
    continuationMoves.reduce(
      (currentBoard, move) => applyMove(currentBoard, move),
      [...board] as BoardPosition,
    ),
  )

  const evaluations = await Promise.all(
    resultingBoards.map((board) => evaluateBoard(board, player)),
  )
  const bestIndex = evaluations.reduce(
    (bestIndex, evaluation, index) => (evaluation > evaluations[bestIndex]! ? index : bestIndex),
    0,
  )
  return continuations[bestIndex] ?? []
}