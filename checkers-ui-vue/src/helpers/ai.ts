import type { BoardPosition, Player } from '@/types'
import { findAllLegalMoves } from './move'

export function pickAMove(
  board: BoardPosition,
  player: Player,
  forbiddenDirection: [boolean | null, boolean | null] = [null, null],
  chainedPieceIndex: number | null = null,
): { fromIndex: number; toIndex: number } | null {
  const legalMoves = findAllLegalMoves(
    board,
    player,
    forbiddenDirection,
    chainedPieceIndex,
  )
  const keys = Object.keys(legalMoves).map(Number)
  if (keys.length === 0) return null
  const fromIndex = keys[Math.floor(Math.random() * keys.length)]!
  const targets = legalMoves[fromIndex]!
  const toIndex =
    targets.length === 1
      ? targets[0]!
      : targets[Math.floor(Math.random() * targets.length)]!
  return { fromIndex, toIndex }
}
