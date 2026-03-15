type Tuple<T, N extends number, R extends T[] = []> = R['length'] extends N
  ? R
  : Tuple<T, N, [T, ...R]>

// TODO: make it human readable (white pawn, black pawn, white queen, black queen)

export const ALLOWED_SQUARE_CONTENT = [0, 1, -1, 3, -3] as const

export type SquareContent = typeof ALLOWED_SQUARE_CONTENT[number]

export type BoardPosition = Tuple<SquareContent, 32>

export const COLORS = ['white', 'black'] as const

export type PieceColor = typeof COLORS[number]
export type Player = typeof COLORS[number]

export type Piece = Exclude<SquareContent, 0>

export type SquareCoords = {
  row: number
  col: number
}

export type Direction = -1 | 1

export type Move = {
  fromIndex: number
  toIndex: number
  isPotentialPromotion: boolean
} & ({isCapture: false} | {isCapture: true, captureIndex: number, followingChainedCaptureForbiddenDirection: [Direction, Direction]})

export type GameResult = Player | 'draw'

export type GamePhase = 'color' | 'game' | 'gameOver'

export type BoardContext = 'game' | 'analysis'

export const MODEL_LEVELS = [1, 2, 3] as const

export type ModelLevel = typeof MODEL_LEVELS[number]

export type ScrapeModelLevel = 0 | ModelLevel