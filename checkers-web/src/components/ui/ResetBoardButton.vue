<script setup lang="ts">
import { computed, inject, type ComputedRef } from 'vue'
import { useBoardStore } from '@/stores/boardStore'

const tileColor = inject<ComputedRef<'black' | 'white'> | undefined>('tileColor')
const { resetToDefault } = useBoardStore()

const handleReset = () => {
  resetToDefault()
}

const dynamicClass = computed(() => {
  return tileColor ? `btn--${tileColor.value}` : ''
})
</script>

<template>
  <button
    class="btn"
    :class="dynamicClass"
    @click="handleReset"
    title="Reset to default position"
  >
    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  </button>
</template>

<style lang="scss" scoped>
.btn {
  all: unset;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;

  &:hover {
    filter: brightness(1.2);
    transform: scale(1.02);
  }
}

.btn-icon {
  width: $pieceSize;
  height: $pieceSize;
  color: #333;
}

.btn--black .btn-icon {
  color: #fff;
}

.btn--white .btn-icon {
  color: #333;
}
</style>
