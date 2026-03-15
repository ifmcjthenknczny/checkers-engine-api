import { applyMove as applyMoveToPosition, movePieceFreely } from '@/helpers/move'
import type { BoardPosition, Move, SquareContent } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { STARTING_BOARD_STATE, EMPTY_BOARD_STATE } from '@/helpers/board'

export const useBoardStore = defineStore('board', () => {
  const board = ref<BoardPosition>(STARTING_BOARD_STATE)
  const isBoardFlipped = ref(false)

  function setBoardFlipped(flipped: boolean) {
    isBoardFlipped.value = flipped
  }

  function toggleBoardFlipped() {
    isBoardFlipped.value = !isBoardFlipped.value
  }

  function setBoardState(newBoardState: BoardPosition) {
    board.value = newBoardState
  }

  function movePiece(fromIndex: number, toIndex: number) {
    board.value = movePieceFreely(board.value, { fromIndex, toIndex } as Move)
    return board.value
  }

  function applyMove(move: Move) {
    const {boardAfter, hasTurnEnded} = applyMoveToPosition(board.value, move)
    board.value = [...boardAfter]
    return { boardAfter: board.value, hasTurnEnded }
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
    isBoardFlipped.value = false
  }

  return {
    board,
    isBoardFlipped,
    setBoardFlipped,
    toggleBoardFlipped,
    setBoardState,
    movePiece,
    applyMove,
    addPiece,
    removePiece,
    removeAllPieces,
    resetToDefault,
  }
})
