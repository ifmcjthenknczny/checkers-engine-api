<template>
    <section class="captured-pieces">
        <div
        v-for="n in Array.from({ length: capturedQueensCount })"
        :key="'t-q-' + n"
        :class="[
            'mini-piece',
            'mini-piece--queen',
            `mini-piece--${props.pieceColor}`
        ]"
        />
        <div
        v-for="n in Array.from({ length: capturedNormalPiecesCount })"
        :key="'t-p-' + n"
        :class="[
            'mini-piece',
            `mini-piece--${props.pieceColor}`
        ]"
        />
    </section>
</template>

<script setup lang="ts">
import type { PieceColor } from '@/types';
import { useGameStore } from '@/stores/gameStore';
import { getPiecesOfColor, isQueen, STARTING_BOARD_STATE } from '@/helpers/board';
import { computed } from 'vue';
import { useBoardStore } from '@/stores/boardStore';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  pieceColor: PieceColor
}>()

const boardStore = useBoardStore()
const { board } = storeToRefs(boardStore)

const gameStore = useGameStore()
const {promotionsCount} = storeToRefs(gameStore)

const startingPiecesCount = getPiecesOfColor(STARTING_BOARD_STATE, props.pieceColor).length

const capturedQueensCount = computed(() => {
  const currentQueens = getPiecesOfColor(board.value, props.pieceColor).filter(({ piece }) => isQueen(piece)).length
  return Math.max(0, promotionsCount.value[props.pieceColor] - currentQueens)
})

const capturedNormalPiecesCount = computed(() => {
  const currentPiecesCount = getPiecesOfColor(board.value, props.pieceColor).length
  const totalCaptured = startingPiecesCount - currentPiecesCount
  return Math.max(0, totalCaptured - capturedQueensCount.value)
})
</script>

<style lang="scss" scoped>
@use 'sass:color';
  .captured-pieces {
    height: $minipieceSize;
    margin: $minipieceSize;
    display: flex;
    flex-flow: row;
  }

  .mini-piece {
    width: $minipieceSize;
    height: $minipieceSize;
    border-radius: 50%;
    border: 0.6px solid black;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 1px;

    &--white {
      background-color: white;
    }

    &--black {
      background-color: black;
      border-color: grey;
    }

    &--queen {
      background-color: color.mix(darkgrey, black);
    }
  }
</style>