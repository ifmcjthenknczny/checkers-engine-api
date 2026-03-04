<script setup lang="ts">
import BoardWrapper from '@/components/BoardWrapper.vue';
import PlayerColorChoice from '@/components/PlayerColorChoice.vue';
import { ref, watch } from 'vue';
import { useBoardStore } from '@/stores/boardStore';
import { useGameStore } from '@/stores/gameStore';
import { computerTurn } from '@/helpers/turn';
import type { GamePhase, Move } from '@/types';
import { isQueen } from '@/helpers/board';
import { pickBestEngineContinuation } from '@/helpers/ai';
import { storeToRefs } from 'pinia';

const gamePhase = ref<GamePhase>('color')

const boardStore = useBoardStore()
const gameStore = useGameStore()
const { humanPlayerColor, currentPlayer, queenMovesWithoutCaptureStreak } = storeToRefs(gameStore)

function startGame() {
    boardStore.resetToDefault()
    gamePhase.value = 'game'
}

function resetGame() {
    boardStore.resetToDefault()
    gameStore.resetToDefault()
    gamePhase.value = 'color'
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
  }
)

function moveCallback(move: Move) {
  const newBoard = boardStore.applyMove(move)

  if (!move.isCapture && isQueen(newBoard[move.toIndex])) {
    gameStore.incrementQueenMovesWithoutCaptureStreak()
  } else {
    gameStore.resetQueenMovesWithoutCaptureStreak()
  }
}

function turnOverCallback() {
  gameStore.switchPlayer()
  gameStore.incrementTurn()
}

function gameOverCallback() {
  // TODO: if game is over, then highlight pieces that won and show message that game is over
  gamePhase.value = 'gameOver'
}

watch(
  [() => gamePhase.value, () => humanPlayerColor.value],
  () => {
    if (gamePhase.value === 'game' && humanPlayerColor.value !== null && humanPlayerColor.value !== currentPlayer.value) {
      computerTurn(boardStore.board, currentPlayer.value, queenMovesWithoutCaptureStreak.value, {
        gameOverCallback,
        moveCallback,
        turnOverCallback,
        movePickingStrategy: pickBestEngineContinuation,
      })
    // TODO: animacja ruchu
    }
  },
  { immediate: true },
)

</script>

<template>
    <div class="play-page">
        <PlayerColorChoice v-if="gamePhase === 'color'" />

        <BoardWrapper v-if="['game', 'gameOver'].includes(gamePhase)" context="game" />
    </div>
  </template>

<style lang="scss" scoped>
@use 'sass:color';

.play-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
}

@media (max-width: 700px) {
  .play-page {
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