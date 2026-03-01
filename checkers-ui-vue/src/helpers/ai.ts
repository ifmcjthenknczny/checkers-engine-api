import type { BoardPosition, Move, Player } from '../types'
import { findAllLegalMoves } from './move'

export function pickARandomMove(
  player: Player,
  board: BoardPosition,
): Move | null {
  const legalMoves = findAllLegalMoves(board, player)
  if (legalMoves.length === 0) return null
  return legalMoves[Math.floor(Math.random() * legalMoves.length)]!
}