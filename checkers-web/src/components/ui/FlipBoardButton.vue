<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
import { useBoardStore } from '@/stores/boardStore'

const boardStore = useBoardStore()
</script>

<template>
  <Button button-type="game" @click="boardStore.toggleBoardFlipped()">
    flip board
  </Button>
</template>
