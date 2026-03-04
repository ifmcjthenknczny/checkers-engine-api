import { applyMove as applyMoveToPosition, movePieceFreely } from '@/helpers/move'
import type { BoardPosition, Move, Player, SquareContent } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { STARTING_BOARD_STATE, EMPTY_BOARD_STATE } from '@/helpers/board'

export const useBoardStore = defineStore('board', () => {
  const board = ref<BoardPosition>(STARTING_BOARD_STATE)

  function setBoardState(newBoardState: BoardPosition) {
    board.value = newBoardState
  }

  function movePiece(fromIndex: number, toIndex: number) {
    return movePieceFreely(board.value, {fromIndex, toIndex} as Move)
  }

  function applyMove(move: Move) {
    board.value = applyMoveToPosition(board.value, move)
    return board.value
  }

  function addPiece(piece: SquareContent, toIndex: number) {
    board.value[toIndex] = piece
  }

  function removePiece(fromIndex: number) {
    board.value[fromIndex] = 0
  }

  function removeAllPieces() {
    board.value = [...EMPTY_BOARD_STATE]
  }

  function resetToDefault() {
    board.value = [...STARTING_BOARD_STATE]
  }

  return {
    board,
    setBoardState,
    movePiece,
    applyMove,
    addPiece,
    removePiece,
    removeAllPieces,
    resetToDefault,
  }
})
