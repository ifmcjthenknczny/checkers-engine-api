import { useBoardStore } from '@/stores/boardStore'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'
import { getPieceColor, isQueen } from '@/helpers/board'
import { determineGameResult } from '@/helpers/gameOver'
import type { Move } from '@/types'


export function useGameCallbacks() {
  const boardStore = useBoardStore()
  const gameStore = useGameStore()
  const { currentPlayer, queenMovesWithoutCaptureStreak } = storeToRefs(gameStore)
  const {board} = storeToRefs(boardStore)

  function moveCallback(move: Move) {
    const newBoard = boardStore.applyMove(move)
    if (move.isPromotion) {
      const color = getPieceColor(newBoard[move.toIndex])
      if (color) {
        gameStore.incrementPromotionsCount(color)
      }
    }
    if (!move.isCapture && isQueen(newBoard[move.toIndex])) {
      gameStore.incrementQueenMovesWithoutCaptureStreak()
      return
    }
    gameStore.resetQueenMovesWithoutCaptureStreak()
  }

  function turnOverCallback() {
    gameStore.switchPlayer()
    gameStore.incrementTurn()
  }

  function gameOverCallback() {
    gameStore.setGameResult(
      determineGameResult(board.value, currentPlayer.value, queenMovesWithoutCaptureStreak.value),
    )
    gameStore.setGamePhase('gameOver')
  }

  return { moveCallback, turnOverCallback, gameOverCallback }
}
