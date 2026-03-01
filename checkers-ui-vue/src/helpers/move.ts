import type { BoardPosition, Move, Piece, PieceColor, Player } from '../types'
import {
  indexToRowCol,
  isQueen as isQueenPiece,
  rowColToIndex,
  getPieceColor,
  diagonalDeltas,
  isSameColor,
  isInBounds,
  isPlayableSquare,
  getPiecesOfColor,
} from './board'
import { shouldPromotePiece } from './promotion'

export function findLegalCapturesOfPiece(
  board: BoardPosition,
  fromIndex: number,
  forbiddenDirection: [boolean | null, boolean | null] = [null, null],
): Move[] {
  const piece = board[fromIndex]
  if (!piece) return []
  const isQueen = isQueenPiece(piece)
  const { row: startRow, col: startCol } = indexToRowCol(fromIndex)
  const moves: Move[] = []

  for (const rowsInc of [true, false]) {
    for (const colsInc of [true, false]) {
      if (
        isQueen &&
        forbiddenDirection[0] === colsInc &&
        forbiddenDirection[1] === rowsInc
      )
        continue
      const [dCol, dRow] = diagonalDeltas(colsInc, rowsInc)
      let r = startRow + dRow
      let c = startCol + dCol
      let foundEnemy = false
      let captureIndex: number | null = null

      while (isInBounds(r, c) && isPlayableSquare(r, c)) {
        const idx = rowColToIndex(r, c)
        const content = board[idx]
        if (content !== 0) {
          if (isSameColor(content ?? 0, piece)) break
          foundEnemy = true
          captureIndex = idx
        } else if (foundEnemy && captureIndex !== null) {
          const toIndex = idx
          moves.push({
            fromIndex,
            toIndex,
            isCapture: true,
            captureIndex,
            isPromotion: shouldPromotePiece(board, fromIndex, toIndex),
          })
        }
        r += dRow
        c += dCol
        if (!isQueen && Math.abs(r - startRow) > 2) break
      }
    }
  }
  return moves
}

export function findLegalNormalMovesOfPiece(
  board: BoardPosition,
  pieceIndex: number,
): Move[] {
  const piece = board[pieceIndex]
  if (!piece) {
    return []
  }
  const isQueen = isQueenPiece(piece)
  const isWhitePiece = getPieceColor(piece) === 'white'
  const rowDirections = isQueen ? [true, false] : [!isWhitePiece]
  const { row: startRow, col: startCol } = indexToRowCol(pieceIndex)
  const moves: Move[] = []

  for (const rowsInc of rowDirections) {
    for (const colsInc of [true, false]) {
      const [dCol, dRow] = diagonalDeltas(colsInc, rowsInc)
      let r = startRow + dRow
      let c = startCol + dCol

      while (isInBounds(r, c) && isPlayableSquare(r, c)) {
        const idx = rowColToIndex(r, c)
        if (board[idx] !== 0) break
        const toIndex = idx
        moves.push({
          fromIndex: pieceIndex,
          toIndex,
          isCapture: false,
          isPromotion: shouldPromotePiece(board, pieceIndex, toIndex),
        })
        if (!isQueen) break
        r += dRow
        c += dCol
      }
    }
  }
  return moves
}

export function findLegalMovesOfPiece(
  board: BoardPosition,
  pieceIndex: number,
  isCapturePossible: boolean,
): Move[] {
  return isCapturePossible
    ? findLegalCapturesOfPiece(board, pieceIndex)
    : findLegalNormalMovesOfPiece(board, pieceIndex)
}

export function playerHasCapturePossibility(
  board: BoardPosition,
  playerColor: Player,
): boolean {
  const pieces = getPiecesOfColor(board, playerColor)

  return pieces.some(
    (piece) => findLegalCapturesOfPiece(board, piece.index).length > 0,
  )
}

export function findAllLegalMoves(
  board: BoardPosition,
  piecesColor: PieceColor,
): Move[] {
  const isCapturePossible = playerHasCapturePossibility(board, piecesColor)
  const pieces = getPiecesOfColor(board, piecesColor)
  const moves: Move[] = []
  for (const piece of pieces) {
    moves.push(
      ...findLegalMovesOfPiece(board, piece.index, isCapturePossible),
    )
  }
  return moves
}

export function findQueenChainedCaptureForbiddenDirection(
  fromIndex: number,
  toIndex: number,
): [boolean, boolean] {
  const { row: sr, col: sc } = indexToRowCol(fromIndex)
  const { row: tr, col: tc } = indexToRowCol(toIndex)
  return [tc < sc, tr < sr]
}

export function findCapturedPieceIndex(
  board: BoardPosition,
  fromIndex: number,
  toIndex: number,
  playerToMove: Player,
): number | undefined {
  const { row: sr, col: sc } = indexToRowCol(fromIndex)
  const { row: tr, col: tc } = indexToRowCol(toIndex)
  const dRow = tr > sr ? 1 : -1
  const dCol = tc > sc ? 1 : -1
  let r = sr + dRow
  let c = sc + dCol
  const isWhite = playerToMove === 'white'
  while (r !== tr || c !== tc) {
    const idx = rowColToIndex(r, c)
    const content = board[idx]
    if (content !== 0 && ((isWhite && (content ?? 0) < 0) || (!isWhite && (content ?? 0) > 0)))
      return idx
    r += dRow
    c += dCol
  }
  return undefined
}

export function applyMove(
  board: BoardPosition,
  fromIndex: number,
  toIndex: number,
  captureIndex?: number,
): BoardPosition {
  const next = [...board] as BoardPosition
  const piece = board[fromIndex]
  next[fromIndex] = 0
  next[toIndex] = piece!
  if (captureIndex !== undefined) next[captureIndex] = 0
  return next
}


