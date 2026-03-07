import type { BoardPosition, Piece, SquareContent } from "@/types"
import { isQueen, getPieceColor, indexToRowCol } from "./board"
import { BOARD_SIZE } from "@/config"

export function shouldPotentiallyPromotePiece(
    board: BoardPosition,
    fromIndex: number,
    toIndex: number,
  ): boolean {
    // the exception to this is when the piece is during a chained capture
    const piece = board[fromIndex]
    if (!piece || isQueen(piece)) {
        return false
    }
    const { row } = indexToRowCol(toIndex)
    const pieceColor = getPieceColor(piece)
    return (
      (pieceColor === 'white' && row === 0) || (pieceColor === 'black' && row === BOARD_SIZE - 1)
    )
  }
  
  export function applyPiecePromotion(piece: Piece): Piece {
    return piece > 0 ? 3 : -3
  }