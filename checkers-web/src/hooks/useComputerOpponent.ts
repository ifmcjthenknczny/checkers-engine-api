import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useBoardStore } from '@/stores/boardStore'
import { useGameStore } from '@/stores/gameStore'
import { useComputerMoveStore } from '~/stores/computerMoveStore'
import { useGameCallbacks } from '@/hooks/useGameCallbacks'
import { computerTurn } from '@/helpers/turn'
import { pickBestEngineContinuation } from '@/helpers/ai'
import { determineGameResult } from '@/helpers/gameOver'
import { sleep } from '@/helpers/utils'
import type { Move } from '@/types'

const MOVE_ANIMATION_MS = 500

export function useComputerOpponent() {
  const boardStore = useBoardStore()
  const gameStore = useGameStore()
  const { setIsAnimating, setAnimatingMove, setIsThinking } = useComputerMoveStore()
  const { moveCallback, turnOverCallback, gameOverCallback } = useGameCallbacks()
  const { humanPlayerColor, currentPlayer, queenMovesWithoutCaptureStreak, gamePhase } =
    storeToRefs(gameStore)

  onMounted(() => {
    gameStore.resetToDefault()
  })

  watch(
    [gamePhase, currentPlayer],
    async () => {
      if (
        gamePhase.value === 'game' &&
        humanPlayerColor.value !== null &&
        humanPlayerColor.value !== currentPlayer.value
      ) {
        setIsThinking(true)
        await sleep(100)
        setIsAnimating(true)
        try {
          await computerTurn(boardStore.board, currentPlayer.value, queenMovesWithoutCaptureStreak.value, {
            gameOverCallback,
            moveCallback,
            turnOverCallback,
            movePickingStrategy: pickBestEngineContinuation,
            beforeMoveCallback: async (move: Move) => {
              setIsThinking(false)
              setAnimatingMove(move)
              await sleep(MOVE_ANIMATION_MS)
            },
            afterMoveCallback: () => {
              setAnimatingMove(null)
            },
          })
        } finally {
          setIsAnimating(false)
        }
      }
    },
    { immediate: true },
  )

  watch(
    [gamePhase, currentPlayer],
    () => {
      if (
        gamePhase.value === 'game' &&
        humanPlayerColor.value !== null &&
        humanPlayerColor.value === currentPlayer.value
      ) {
        const result = determineGameResult(boardStore.board, currentPlayer.value, queenMovesWithoutCaptureStreak.value)
        if (result) {
          gameOverCallback(result)
        }
      }
    },
  )

  return {
    boardStore,
    gameStore,
    humanPlayerColor,
    currentPlayer,
    queenMovesWithoutCaptureStreak,
    gamePhase,
    moveCallback,
    turnOverCallback,
    gameOverCallback,
  }
}
