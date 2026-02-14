import { BOARD_SIZE } from './config'

export const isWhiteSquare = (rowIndex: number, colIndex: number) => {
  return (rowIndex + colIndex) % 2 === 0
}

export const getPieceIndex = (rowIndex: number, colIndex: number) => {
  return Math.floor((rowIndex * BOARD_SIZE + colIndex) / 2)
}
