<script setup lang="ts">
import { inject, type ComputedRef } from 'vue'
import { useBoardStore } from '@/stores/boardStore'

const tileColor = inject<ComputedRef<'black' | 'white'> | undefined>('tileColor')
const { removeAllPieces } = useBoardStore()

const handleArmageddon = () => {
  removeAllPieces()
}
</script>

<template>
  <button
    class="armageddon-btn"
    :class="tileColor ? `armageddon-btn--${tileColor.value}` : ''"
    @click="handleArmageddon"
    title="Usuń wszystkie pionki"
  >
    <svg class="armageddon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  </button>
</template>

<style lang="scss" scoped>
.armageddon-btn {
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

.armageddon-icon {
  width: $pieceSize;
  height: $pieceSize;
  color: #333;
}

.armageddon-btn--black .armageddon-icon {
  color: #fff;
}

.armageddon-btn--white .armageddon-icon {
  color: #333;
}
</style>
