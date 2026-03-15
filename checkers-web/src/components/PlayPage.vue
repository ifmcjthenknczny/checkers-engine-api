<script setup lang="ts">
import GameBoardLayout from '@/components/board/GameBoardLayout.vue'
import PlayerColorChoice from '@/components/game/PlayerColorChoice.vue'
import { watch } from 'vue'
import { useComputerOpponent } from '@/hooks/useComputerOpponent'

const { boardStore, gameStore, humanPlayerColor, gamePhase } = useComputerOpponent()

function startGame() {
  boardStore.resetToDefault()
  gameStore.setGamePhase('game')
}

function resetGame() {
  boardStore.resetToDefault()
  gameStore.resetToDefault()
}

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
</script>

<template>
  <div class="play-page">
    <div class="play-page__board-col">
      <PlayerColorChoice v-if="gamePhase === 'color'" />
      <GameBoardLayout v-if="['game', 'gameOver'].includes(gamePhase)" context="game" />
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
</style>
