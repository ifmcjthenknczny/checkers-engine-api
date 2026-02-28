import { BOARD_SIZE } from '../config'
import type { BoardPosition, Piece, PieceColor, SquareCoords, SquareContent } from '../types'

export const isWhiteSquare = (rowIndex: number, colIndex: number): boolean =>
  (rowIndex + colIndex) % 2 === 0

export const getSquareIndex = (rowIndex: number, colIndex: number): number =>
  Math.floor((rowIndex * BOARD_SIZE + colIndex) / 2)

export const indexToRowCol = (index: number): SquareCoords => {
  const row = Math.floor(index / (BOARD_SIZE / 2))
  const col =
    row % 2 === 0
      ? 1 + (index % (BOARD_SIZE / 2)) * 2
      : (index % (BOARD_SIZE / 2)) * 2
  return { row, col }
}

export const rowColToIndex = (row: number, col: number): number =>
  row * (BOARD_SIZE / 2) + (row % 2 === 0 ? (col - 1) / 2 : col / 2)

export const isQueen = (piece?: SquareContent): piece is -3 | 3 => {
  return !!piece && Math.abs(piece) === 3
}

export const getPieceColor = (piece?: SquareContent): PieceColor | null => {
  if (!piece) {
    return null
  }
  return piece < 0 ? 'black' : 'white'
}

export function isSameColor(a: SquareContent, b: SquareContent): boolean {
  return (a > 0 && b > 0) || (a < 0 && b < 0)
}

export function diagonalDeltas(
  colIncrease: boolean,
  rowIncrease: boolean,
): [number, number] {
  return [colIncrease ? 1 : -1, rowIncrease ? 1 : -1]
}

export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

export function isPlayableSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 1
}

export function getPiecesOfColor(board: BoardPosition, color: PieceColor): {index: number, piece: Piece}[] {
  return board
  .map((p, i) => ({ index: i, piece: p }))
  .filter(
    (p): p is { index: number; piece: Piece } =>
      p.piece !== 0 && (p.piece > 0) === (color === 'white'),
  )
}