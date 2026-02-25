type Tuple<T, N extends number, R extends T[] = []> = R['length'] extends N
  ? R
  : Tuple<T, N, [T, ...R]>

// TODO: make it human readable (white pawn, black pawn, white queen, black queen)
export type SquareContent = -3 | -1 | 0 | 1 | 3

export type BoardPosition = Tuple<SquareContent, 32>

export type PieceColor = 'white' | 'black'
export type Player = 'white' | 'black'

export type Piece = Exclude<SquareContent, 0>

export type SquareCoords = {
  row: number
  col: number
}

export type Move ={
  fromIndex: number
  toIndex: number
  isPromotion: boolean
} & ({isCapture: false} | {isCapture: true, captureIndex: number})

export type GameResult = -1 | 0 | 1