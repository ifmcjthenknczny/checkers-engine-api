import type { BoardPosition, GameResult, PieceColor, Player } from "@/types"
import { findAllLegalMoves } from "./move"

const QUEEN_MOVES_WITHOUT_CAPTURE_COUNT_DRAW_THRESHOLD: number = 30

function hasPlayerLost(board: BoardPosition, player: Player): boolean {
  const hasPieces = board.some((p) => player === 'white' ? p > 0 : p < 0)
  const canMove = findAllLegalMoves(board, player).length > 0
  return !hasPieces || !canMove
}
 
  export function determineGameResult(
    board: BoardPosition,
    playerOnMove: Player,
    queenMovesWithoutCaptureCount: number,
  ): GameResult | null {
    if (hasPlayerLost(board, playerOnMove)) {
      return playerOnMove === 'white' ? 'black' : 'white'
    }
    return queenMovesWithoutCaptureCount >= QUEEN_MOVES_WITHOUT_CAPTURE_COUNT_DRAW_THRESHOLD ? 'draw' : null
  }
  