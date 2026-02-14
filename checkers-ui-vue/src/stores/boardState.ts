import type { BoardPosition, PlayerOnMove } from '@/types'

const STARTING_BOARD_STATE = [
  ...Array(12).fill(1),
  ...Array(8).fill(0),
  ...Array(12).fill(-1),
] as BoardPosition

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBoardStore = defineStore('board', () => {
  const board = ref<BoardPosition>(STARTING_BOARD_STATE)

  const currentPlayer = ref<PlayerOnMove>('white')

  function setBoardState(newBoardState: BoardPosition) {
    board.value = newBoardState
  }

  function switchPlayer() {
    currentPlayer.value = currentPlayer.value === 'white' ? 'black' : 'white'
  }

  return { board, setBoardState, currentPlayer, switchPlayer }
})
