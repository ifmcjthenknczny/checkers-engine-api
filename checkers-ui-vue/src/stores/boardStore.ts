import type { BoardPosition, Player, SquareContent } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

/** Zawsze zwraca nową tablicę – stan startowy (12 czarnych, 8 pustych, 12 białych). */
export function getStartingBoardState(): BoardPosition {
  return [
    ...Array(12).fill(-1),
    ...Array(8).fill(0),
    ...Array(12).fill(1),
  ] as BoardPosition
}

/** Dla kompatybilności wstecznej (np. PlayPage). */
export const STARTING_BOARD_STATE = getStartingBoardState()

const EMPTY_BOARD_STATE = Array(32).fill(0) as BoardPosition

export const useBoardStore = defineStore('board', () => {
  const board = ref<BoardPosition>(getStartingBoardState())
  const currentPlayer = ref<Player>('white')
  const selectedIndex = ref<number | null>(null)

  function setBoardState(newBoardState: BoardPosition) {
    board.value = newBoardState
  }

  function setSelectedIndex(index: number | null) {
    selectedIndex.value = index
  }

  function switchPlayer() {
    currentPlayer.value = currentPlayer.value === 'white' ? 'black' : 'white'
  }

  function movePiece(fromIndex: number, toIndex: number) {
    const piece = board.value[fromIndex]
    if (!piece) {
      return
    }
    board.value[toIndex] = piece
    board.value[fromIndex] = 0
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
    board.value = getStartingBoardState()
    selectedIndex.value = null
  }

  return {
    board,
    currentPlayer,
    selectedIndex,
    setBoardState,
    setSelectedIndex,
    switchPlayer,
    movePiece,
    addPiece,
    removePiece,
    removeAllPieces,
    resetToDefault,
  }
})
