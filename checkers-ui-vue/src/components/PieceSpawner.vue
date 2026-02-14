<script setup lang="ts">
import type { SquareContent } from '@/types'

const emit = defineEmits<{
  spawn: [SquareContent]
}>()

const spawnPiece = (piece: SquareContent) => (e: DragEvent) => {
  e.dataTransfer?.setData('piece', String(piece))
  emit('spawn', piece)
}
</script>

<template>
  <div class="piece-spawner">
    <div class="piece piece--white" draggable="true" @dragstart="spawnPiece(1)" />
    <div class="piece piece--black" draggable="true" @dragstart="spawnPiece(-1)" />
    <div class="piece piece--white" draggable="true" @dragstart="spawnPiece(3)" />
    <div class="piece piece--black" draggable="true" @dragstart="spawnPiece(-3)" />
  </div>
</template>
