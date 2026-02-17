<script setup lang="ts">
import { useBoardStore } from '@/stores/boardStore'
import { useDragStore } from '@/stores/dragStore'
import { storeToRefs } from 'pinia'

const dragStore = useDragStore()
const { draggedIndex } = storeToRefs(dragStore)
const { removePiece } = useBoardStore()

const allow = (e: DragEvent) => e.preventDefault()

const drop = () => {
  if (draggedIndex.value === null) {
    return
  }
  removePiece(draggedIndex.value)
  dragStore.stopDrag()
}
</script>

<template>
  <div
    class="trash"
    @dragover="allow"
    @drop="drop"
    title="Upuść pionek, aby usunąć"
  >
    <svg class="trash-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  </div>
</template>

<style lang="scss" scoped>
.trash {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.trash-icon {
  width: $pieceSize;
  height: $pieceSize;
  color: red;
}

.trash--black .trash-icon {
  color: #fff;
}

.trash--white .trash-icon {
  color: #333;
}
</style>
