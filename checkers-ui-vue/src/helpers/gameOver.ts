import type { BoardPosition, GameResult, PieceColor, Player } from "@/types"
import { findAllLegalMoves } from "./move"

function hasPlayerLost(board: BoardPosition, player: Player): boolean {
  const hasPieces = board.some((p) => player === 'white' ? p > 0 : p < 0)
  const canMove = Object.keys(findAllLegalMoves(board, player)).length > 0
  return !hasPieces || (hasPieces && !canMove)
}

export function determineWinner(
  board: BoardPosition,
  playerOnMove: Player,
): PieceColor | null {
  if (hasPlayerLost(board, playerOnMove)) {
    return playerOnMove === 'white' ? 'black' : 'white'
  }
  return null
}
  
  export function determineGameResult(
    board: BoardPosition,
    playerOnMove: Player,
    queenMovesWithoutCaptureCount: number,
  ): GameResult | null {
    const QUEEN_MOVES_WITHOUT_CAPTURE_COUNT_DRAW_THRESHOLD = 30
    if (hasPlayerLost(board, playerOnMove)) {
      return playerOnMove === 'white' ? -1 : 1
    }
    return queenMovesWithoutCaptureCount >= QUEEN_MOVES_WITHOUT_CAPTURE_COUNT_DRAW_THRESHOLD ? 0 : null
  }
  