import type {
  BoardPosition,
  Direction,
  Move,
  PieceColor,
  Player,
} from '../types'
import {
  indexToRowCol,
  isQueen as isQueenPiece,
  rowColToIndex,
  getPieceColor,
  isSameColor,
  isInBounds,
  isPlayableSquare,
  getPiecesOfColor,
} from './board'
import { applyPiecePromotion, shouldPotentiallyPromotePiece } from './promotion'

const DIAGONAL_DIRECTIONS: [Direction, Direction][] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]

function buildCaptureDirections(
  forbiddenDirection: readonly [Direction | null, Direction | null],
): [Direction, Direction][] {
  const [forbiddenDCol, forbiddenDRow] = forbiddenDirection
  if (forbiddenDCol === null && forbiddenDRow === null) { 
    return DIAGONAL_DIRECTIONS
  }
  return DIAGONAL_DIRECTIONS.filter(
    ([dCol, dRow]) => dCol !== forbiddenDCol || dRow !== forbiddenDRow,
  )
}

function reverseDirection(direction: Direction): Direction {
  return direction === 1 ? -1 : 1
}

export function findLegalCapturesOfPiece(
  board: BoardPosition,
  fromIndex: number,
  forbiddenDirection: readonly [Direction | null, Direction | null] = [null, null],
): Move[] {
  const piece = board[fromIndex];
  if (!piece) {
    return [];
  }

  const isQueen = isQueenPiece(piece);
  const { row: startRow, col: startCol } = indexToRowCol(fromIndex);
  const moves: Move[] = [];

  for (const [dCol, dRow] of buildCaptureDirections(forbiddenDirection)) {
    let row = startRow + dRow;
    let col = startCol + dCol;

    while (isInBounds(row, col) && board[rowColToIndex(row, col)] === 0 && isQueen) {
      row += dRow;
      col += dCol;
    }

    if (!isInBounds(row, col)) {
      continue;
    }

    const targetIdx = rowColToIndex(row, col);
    const targetPiece = board[targetIdx];

    if (!targetPiece || isSameColor(targetPiece, piece)) {
      continue
    }

    row += dRow;
    col += dCol;

    while (isInBounds(row, col) && board[rowColToIndex(row, col)] === 0) {
      const landingIdx = rowColToIndex(row, col);
      
      moves.push({
        fromIndex,
        toIndex: landingIdx,
        isCapture: true,
        captureIndex: targetIdx,
        isPromotion: shouldPotentiallyPromotePiece(board, fromIndex, landingIdx),
        followingChainedCaptureForbiddenDirection: [reverseDirection(dCol), reverseDirection(dRow)],
      });

      if (!isQueen) {
        break;
      }

      row += dRow;
      col += dCol;
    }
  }

  return moves;
}

function buildNormalMoveDirections(
  isQueen: boolean,
  pieceColor: PieceColor,
): [Direction, Direction][] {
  if (isQueen) {
    return DIAGONAL_DIRECTIONS
  }
  const dRow: Direction = pieceColor === 'white' ? -1 : 1
  return [
    [1, dRow],
    [-1, dRow],
  ]
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
  const pieceColor = getPieceColor(piece)!
  const { row: startRow, col: startCol } = indexToRowCol(pieceIndex)
  const directions = buildNormalMoveDirections(isQueen, pieceColor)
  const moves: Move[] = []

  for (const [dCol, dRow] of directions) {
    let row = startRow + dRow
    let col = startCol + dCol

    while (isInBounds(row, col) && isPlayableSquare(row, col)) {
      const toIndex = rowColToIndex(row, col)
      if (board[toIndex] !== 0) {
        break
      }
      moves.push({
        fromIndex: pieceIndex,
        toIndex,
        isCapture: false,
        isPromotion: shouldPotentiallyPromotePiece(board, pieceIndex, toIndex),
      })
      if (!isQueen) {
        break
      }
      row += dRow
      col += dCol
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

function buildCaptureChains(board: BoardPosition, lastMove: Move): Move[][] {
  const nextCaptures = findImmediateChainedCaptures(board, lastMove)

  if (nextCaptures.length === 0) {
    return [[]]
  }

  const chains: Move[][] = []
  for (const capture of nextCaptures) {
    const nextBoard = applyMove([...board], capture)
    for (const subChain of buildCaptureChains(nextBoard, capture)) {
      chains.push([capture, ...subChain])
    }
  }
  return chains
}

export function findAllLegalContinuations(board: BoardPosition, piecesColor: PieceColor): Move[][] {
  const moves = findAllLegalMoves(board, piecesColor)

  const continuations: Move[][] = []
  for (const move of moves) {
    if (!move.isCapture) {
      continuations.push([move])
      continue
    }

    const nextBoard = applyMove([...board], move)
    for (const chain of buildCaptureChains(nextBoard, move)) {
      continuations.push([move, ...chain])
    }
  }
  return continuations
}

export function movePieceFreely(board: BoardPosition, {fromIndex, toIndex}: Move): BoardPosition {
  const piece = board[fromIndex]
  if (!piece) {
    return board
  }
  const nextBoard: BoardPosition = [...board]
  nextBoard[fromIndex] = 0
  nextBoard[toIndex] = piece
  return nextBoard
}

export function applyMove(board: BoardPosition, move: Move): BoardPosition {
  const piece = board[move.fromIndex]
  if (!piece) {
    return board
  }
  const nextBoard: BoardPosition = movePieceFreely(board, move)
  if (move.isCapture) {
    nextBoard[move.captureIndex] = 0
  }
  const isDuringChainedCapture = isChainedCapturePossible(nextBoard, move)
  const movedPiece = move.isPromotion && !isDuringChainedCapture ? applyPiecePromotion(piece) : piece
  nextBoard[move.toIndex] = movedPiece
  return nextBoard
}

export const isChainedCapturePossible = (boardAfterMove: BoardPosition, move: Move) => {
  const immediateChainedCaptures = findImmediateChainedCaptures(boardAfterMove, move)
  return immediateChainedCaptures.length > 0
}

export const findImmediateChainedCaptures = (boardAfterMove: BoardPosition, move: Move): Move[] => {
  if (!move.isCapture) {
    return []
  }
  return findLegalCapturesOfPiece(boardAfterMove, move.toIndex, move.followingChainedCaptureForbiddenDirection)
}

export const getLegalMove = (board: BoardPosition, move: Partial<Pick<Move, 'fromIndex' | 'toIndex'>>): Move | null => {
  if (move.fromIndex == null || move.toIndex == null) {
    return null
  }
  const legalMoves = findAllLegalMoves(board, getPieceColor(board[move.fromIndex])!)
  return legalMoves.find(legalMove => legalMove.fromIndex === move.fromIndex && legalMove.toIndex === move.toIndex) ?? null
}