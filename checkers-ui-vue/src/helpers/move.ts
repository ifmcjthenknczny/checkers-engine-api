import type { BoardPosition, PieceColor, Player } from '../types'
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


export function findLegalCapturesOfPiece(
  board: BoardPosition,
  fromIndex: number,
  forbiddenDirection: [boolean | null, boolean | null] = [null, null],
): number[] {
  const piece = board[fromIndex]
  if (!piece) return []
  const isQueen = isQueenPiece(piece)
  const friend = piece
  const { row: startRow, col: startCol } = indexToRowCol(fromIndex)
  const targets: number[] = []

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

      while (isInBounds(r, c) && isPlayableSquare(r, c)) {
        const idx = rowColToIndex(r, c)
        const content = board[idx]
        if (content !== 0) {
          if (foundEnemy) break
          if (isSameColor(content ?? 0, friend)) break
          foundEnemy = true
        } else if (foundEnemy) {
          targets.push(idx)
        }
        r += dRow
        c += dCol
        if (!isQueen && Math.abs(r - startRow) > 2) break
      }
    }
  }
  return targets
}

export function findLegalNormalMovesOfPiece(
  board: BoardPosition,
  pieceIndex: number,
): number[] {
  const piece = board[pieceIndex]
  if (!piece) {
    return []
  }
  const isQueen = isQueenPiece(piece)
  const isWhitePiece = getPieceColor(piece) === 'white'
  const rowDirs = isQueen ? [true, false] : isWhitePiece ? [true] : [false]
  const { row: startRow, col: startCol } = indexToRowCol(pieceIndex)
  const targets: number[] = []

  for (const rowsInc of rowDirs) {
    for (const colsInc of [true, false]) {
      const [dCol, dRow] = diagonalDeltas(colsInc, rowsInc)
      let r = startRow + dRow
      let c = startCol + dCol

      while (isInBounds(r, c) && isPlayableSquare(r, c)) {
        const idx = rowColToIndex(r, c)
        if (board[idx] !== 0) break
        targets.push(idx)
        if (!isQueen) break
        r += dRow
        c += dCol
      }
    }
  }
  return targets
}

export function playerHasCapturePossibility(
  board: BoardPosition,
  playerColor: Player,
): boolean {
  const pieces = getPiecesOfColor(board, playerColor)

  return pieces.some((piece) => findLegalCapturesOfPiece(board, piece.index).length > 0)
}

export function findAllLegalMoves(
  board: BoardPosition,
  piecesColor: PieceColor,
  forbiddenDirection: [boolean | null, boolean | null] = [null, null],
  chainedPieceIndex: number | null = null,
): Record<number, number[]> {
  const isCapturePossible = playerHasCapturePossibility(board, piecesColor)
  const pieces = getPiecesOfColor(board, piecesColor)
  const result: Record<number, number[]> = {}

  if (chainedPieceIndex !== null) {
    const targets = findLegalCapturesOfPiece(board, chainedPieceIndex, forbiddenDirection)
    if (targets.length > 0) result[chainedPieceIndex] = targets
    return result
  }

  for (const piece of pieces) {
    const targets = isCapturePossible
      ? findLegalCapturesOfPiece(board, piece.index)
      : findLegalNormalMovesOfPiece(board, piece.index)
    if (targets.length > 0) result[piece.index] = targets
  }
  return result
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


