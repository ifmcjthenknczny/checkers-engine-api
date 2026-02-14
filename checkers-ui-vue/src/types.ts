type Tuple<T, N extends number, R extends T[] = []> = R['length'] extends N
  ? R
  : Tuple<T, N, [T, ...R]>

// TOTO: make it human readable
export type SquareContent = -3 | -1 | 0 | 1 | 3

export type BoardPosition = Tuple<SquareContent, 32>

export type PlayerOnMove = 'white' | 'black'
