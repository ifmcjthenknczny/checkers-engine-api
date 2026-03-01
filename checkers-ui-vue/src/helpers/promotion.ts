import type { BoardPosition, SquareContent } from "@/types"
import { isQueen, getPieceColor, indexToRowCol } from "./board"
import { BOARD_SIZE } from "@/config"

export function shouldPromotePiece(
    board: BoardPosition,
    fromIndex: number,
    toIndex: number,
  ): boolean {
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
  
  export function applyPromotion(board: BoardPosition, atIndex: number): BoardPosition {
    const next = [...board] as BoardPosition
    const p = next[atIndex]
    if (p === 1) {
      next[atIndex] = 3
    }
    else if (p === -1) {
      next[atIndex] = -3
    }
    return next
  }