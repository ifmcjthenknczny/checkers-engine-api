<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useBoardStore } from '@/stores/boardStore'
import { useDebouncedWatch } from '@/hooks/useDebouncedWatch'
import { useGameStore } from '@/stores/gameStore'
import { evaluateBoard } from '@/helpers/engine'

const boardStore = useBoardStore()
const { board } = storeToRefs(boardStore)
const gameStore = useGameStore()
const { currentPlayer } = storeToRefs(gameStore)

const evaluation = ref<number | null>(null)
const isLoading = ref(false)

const fetchEvaluation = async () => {
  isLoading.value = true
  try {
    evaluation.value = await evaluateBoard(board.value, currentPlayer.value)
  } catch (error) {
    console.error('Engine error:', error)
  } finally {
    isLoading.value = false
  }
}

useDebouncedWatch([board, currentPlayer], fetchEvaluation, 200)
fetchEvaluation()

const formatEvaluation = (val: number | null) => {
  if (!val) {
    return '0.00'
  }
  const prefix = val > 0 ? '+' : ''
  return `${prefix}${val.toFixed(2)}`
}

const barStyles = computed(() => {
  if (evaluation.value === null) {
    return { height: 50, width: 50 };
  }

  const val = evaluation.value;

  const rawHeight = 50 - val * 50;
  const rawWidth = 50 + val * 50;

  return {
    height: Math.max(0, Math.min(100, rawHeight)),
    width: Math.max(0, Math.min(100, rawWidth))
  };
});
</script>

<template>
  <div class="engine-eval" :class="{ 'is-loading': isLoading }">
    <div class="engine-eval__bar-container">
      <div
        class="engine-eval__bar"
        :style="{
          '--bar-height': `${barStyles.height}%`,
          '--bar-width': `${barStyles.width}%`,
        }"
      ></div>
    </div>
    <div class="engine-eval__value">
      {{ formatEvaluation(evaluation) }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.engine-eval {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  font-family: monospace;
  transition: opacity 0.2s;
  user-select: none;

  &.is-loading {
    opacity: 0.6;
  }

  &__value {
    font-weight: bold;
    font-size: 1.1rem;
    padding: 4px 8px;
    background: #f0f0f0;
    border-radius: 4px;
    border: 1px solid #ddd;
  }

  &__bar-container {
    width: 120px;
    height: 20px;
    background: white;
    border: 1px solid black;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }

  &__bar {
    width: var(--bar-width, 50%);
    height: 100%;
    background: #333;
    position: absolute;
    left: 0;
    top: 0;
    transition: width 0.5s ease-out;
  }
}

@media (min-width: 600px) {
  .engine-eval {
    flex-direction: column;
    gap: 8px;
  }

  .engine-eval__bar-container {
    width: 20px;
    height: 180px;
  }

  .engine-eval__bar {
    width: 100%;
    height: var(--bar-height, 50%);
    left: auto;
    top: auto;
    right: 0;
    bottom: 0;
    transition: height 0.5s ease-out;
  }
}
</style>
