import type { GameResult, PieceColor, Player } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const DEFAULT_STATE = {
    currentPlayer: 'white' as Player,
    humanPlayerColor: null,
    turn: 1,
    promotionsCount: { white: 0, black: 0 },
    queenMovesWithoutCaptureStreak: 0,
    gameResult: null,
}

export const useGameStore = defineStore('game', () => {
  const currentPlayer = ref<Player>(DEFAULT_STATE.currentPlayer)
  const humanPlayerColor = ref<Player | null>(DEFAULT_STATE.humanPlayerColor)
  const turn = ref<number>(DEFAULT_STATE.turn)
  const promotionsCount = ref<Record<PieceColor, number>>(DEFAULT_STATE.promotionsCount)
  const queenMovesWithoutCaptureStreak = ref<number>(0)
  const gameResult = ref<GameResult | null>(null)

  function switchPlayer() {
    currentPlayer.value = currentPlayer.value === 'white' ? 'black' : 'white'
  }

  function setCurrentPlayer(player: Player) {
    currentPlayer.value = player
  }

  function chooseColor(color: Player) {
    humanPlayerColor.value = color
  }

  function incrementPromotionsCount(color: PieceColor) {
    promotionsCount.value[color]++
  }

  function incrementQueenMovesWithoutCaptureStreak() {
    queenMovesWithoutCaptureStreak.value++
  }

  function resetQueenMovesWithoutCaptureStreak() {
    queenMovesWithoutCaptureStreak.value = 0
  }

  function resetToDefault() {
    currentPlayer.value = DEFAULT_STATE.currentPlayer
    humanPlayerColor.value = DEFAULT_STATE.humanPlayerColor
    turn.value = DEFAULT_STATE.turn
    promotionsCount.value = DEFAULT_STATE.promotionsCount
    queenMovesWithoutCaptureStreak.value = DEFAULT_STATE.queenMovesWithoutCaptureStreak
    gameResult.value = DEFAULT_STATE.gameResult
  }

  function incrementTurn() {
    turn.value++
  }

  return {
    currentPlayer,
    setCurrentPlayer,
    switchPlayer,
    humanPlayerColor,
    chooseColor,
    turn,
    incrementTurn,
    promotionsCount,
    queenMovesWithoutCaptureStreak,
    incrementPromotionsCount,
    incrementQueenMovesWithoutCaptureStreak,
    resetQueenMovesWithoutCaptureStreak,
    resetToDefault,
    gameResult
  }
})
