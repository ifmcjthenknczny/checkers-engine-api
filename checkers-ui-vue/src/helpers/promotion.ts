import type { BoardPosition, SquareContent } from "@/types"
import { isQueen, getPieceColor, indexToRowCol } from "./board"
import { BOARD_SIZE } from "@/config"

export function shouldPromotePiece(
    board: BoardPosition,
    toIndex: number,
    piece: SquareContent,
  ): boolean {
    if (isQueen(piece)) {
        return false
    }
    const { row } = indexToRowCol(toIndex)
    const isWhitePiece = getPieceColor(piece) === 'white'
    return (
      (isWhitePiece && row === BOARD_SIZE - 1) || (!isWhitePiece && row === 0)
    )
  }
  
  export function applyPromotion(board: BoardPosition, atIndex: number): BoardPosition {
    const next = [...board] as BoardPosition
    const p = next[atIndex]
    if (p === 1) next[atIndex] = 3
    else if (p === -1) next[atIndex] = -3
    return next
  }