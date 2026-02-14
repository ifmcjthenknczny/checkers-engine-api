<script lang="ts" setup>
import { isWhiteSquare } from '@/boardHelpers'
import type { SquareContent } from '@/types'

interface Props {
  position: [number, number]
  rowName: number
  colName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{ dropPiece: [[number, number, SquareContent?]] }>()
const allowDrop = (e: DragEvent) => {
  if (!isWhiteSquare(rowIndex, colIndex)) {
    e.preventDefault()
  }
  const piece = e.dataTransfer?.getData('piece')

  if (piece) {
    emit('dropPiece', [colIndex, rowIndex, +piece as SquareContent])
    return
  }
  e.preventDefault()
}

const drop = (e: DragEvent) => {
  if (isWhiteSquare(rowIndex, colIndex)) {
    return
  }

  const piece = e.dataTransfer?.getData('piece')
  if (piece) {
    emit('dropPiece', [colIndex, rowIndex, +piece as SquareContent])
  } else {
    emit('dropPiece', [colIndex, rowIndex])
  }
}

const [colIndex, rowIndex] = props.position
</script>

<template>
  <div
    :key="colName + rowName"
    :id="colName + rowName"
    :class="[
      'grid__square',
      isWhiteSquare(rowIndex, colIndex) ? 'grid__square--white' : 'grid__square--black',
    ]"
    @dragover="allowDrop"
    @drop="drop"
  >
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.grid__square {
  aspect-ratio: 1;
  border: 0.8px solid $borderColor;

  display: flex;
  align-items: center;
  justify-content: center;

  &--black {
    background-color: $blackSquareColor;
  }

  &--white {
    background-color: $whiteSquareColor;
  }
}
</style>
