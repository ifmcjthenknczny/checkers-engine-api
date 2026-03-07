<script setup lang="ts">
import BoardWrapper from '@/components/BoardWrapper.vue'
import PlayerColorChoice from '@/components/PlayerColorChoice.vue'
import { onMounted, watch } from 'vue'
import { useBoardStore } from '@/stores/boardStore'
import { useGameStore } from '@/stores/gameStore'
import { computerTurn } from '@/helpers/turn'
import { pickBestEngineContinuation } from '@/helpers/ai'
import { storeToRefs } from 'pinia'
import { sleep } from '@/helpers/utils'
import { useGameCallbacks } from '@/hooks/useGameCallbacks'

const boardStore = useBoardStore()
const gameStore = useGameStore()
const { moveCallback, turnOverCallback, gameOverCallback } = useGameCallbacks()
const { humanPlayerColor, currentPlayer, queenMovesWithoutCaptureStreak, gamePhase } =
  storeToRefs(gameStore)

function startGame() {
  boardStore.resetToDefault()
  gameStore.setGamePhase('game')
}

function resetGame() {
  boardStore.resetToDefault()
  gameStore.resetToDefault()
}

onMounted(() => {
  gameStore.resetToDefault()
})

watch(
  () => humanPlayerColor.value,
  (newVal, oldVal) => {
    if (newVal !== null && oldVal === null) {
      startGame()
    }
    if (newVal === null && oldVal !== null) {
      resetGame()
    }
  },
)

watch(
  [() => gamePhase.value, () => currentPlayer.value],
  async () => {
    if (
      gamePhase.value === 'game' &&
      humanPlayerColor.value !== null &&
      humanPlayerColor.value !== currentPlayer.value
    ) {
      await sleep(500)
      computerTurn(boardStore.board, currentPlayer.value, queenMovesWithoutCaptureStreak.value, {
        gameOverCallback,
        moveCallback,
        turnOverCallback,
        movePickingStrategy: pickBestEngineContinuation,
      })
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="play-page">
    <div class="play-page__board-col">
      <PlayerColorChoice v-if="gamePhase === 'color'" />
      <BoardWrapper v-if="['game', 'gameOver'].includes(gamePhase)" context="game" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';

.play-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: inherit;
  width: 100%;
  box-sizing: border-box;
}

.play-page__board-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

@media (min-width: $breakpoint) {
  .play-page {
    flex: 1;
  }

  .play-page__board-col {
    flex: 1;
    justify-content: flex-start;
    width: 100%;
  }
}

@media (max-width: $breakpoint) {
  .play-page__board-col {
    .legal-move {
      border-width: 1.2px;
    }

    .game-info {
      width: $boardSizeVertical;
      font-size: 1.4rem;

      &__who-to-move {
        margin-left: $nameSquareSizeVertical;
      }
    }
  }
}
</style>
