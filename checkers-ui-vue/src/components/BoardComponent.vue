<script setup lang="ts">
import { onMounted } from 'vue'
import { BOARD_SIZE } from '../config'
import { range, rangeChar } from '../helpers/utils'
import { useBoardStore } from '@/stores/boardStore'
import CheckersPiece from './PieceComponent.vue'
import CheckersSquare from './BoardSquare.vue'
import { isWhiteSquare, getSquareIndex } from '@/helpers/board'
import type { SquareContent } from '@/types'
import { useDragStore } from '@/stores/dragStore'
import { storeToRefs } from 'pinia'

const cols = rangeChar(BOARD_SIZE, 'a')
const rows = range(BOARD_SIZE, 1).toReversed()

const gridStyles = {
  display: 'grid',
  gridTemplateColumns: `0.2fr repeat(${BOARD_SIZE}, 1fr)`,
  gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr) 0.2fr`,
}

const boardStore = useBoardStore()
const { board, selectedIndex } = storeToRefs(boardStore)
const dragStore = useDragStore()
const { draggedIndex, dragContext } = storeToRefs(dragStore)

const drop = ([col, row, piece]: [number, number, SquareContent?]) => {
  const to = getSquareIndex(row, col)

  if (dragContext.value === 'spawn') {
    if (!piece) {
      return
    }
    boardStore.addPiece(piece, to)
  }

  if (dragContext.value === 'board') {
    const from = draggedIndex.value
    if (from === null) {
      return
    }
    boardStore.movePiece(from, to)
  }

  boardStore.setSelectedIndex(null)
  dragStore.stopDrag()
}

onMounted(() => {
  if (board.value.every((p) => p === 0)) {
    boardStore.resetToDefault()
  }
})
</script>

<template>
  <section class="board" :style="gridStyles">
    <template v-for="(rowName, rowIndex) in rows" :key="'row-' + rowName">
      <div class="grid__square--name-row grid__square--name">
        {{ rowName }}
      </div>

      <CheckersSquare
        v-for="(colName, colIndex) in cols"
        :position="[colIndex, rowIndex]"
        :colName="colName"
        :rowName="rowName"
        :key="`${colName}${rowName}`"
        @drop-piece="drop"
      >
        <CheckersPiece
          v-if="!isWhiteSquare(rowIndex, colIndex)"
          :piece="board[getSquareIndex(rowIndex, colIndex)]!"
          :index="getSquareIndex(rowIndex, colIndex)"
          :is-selected="selectedIndex === getSquareIndex(rowIndex, colIndex)"
          context="board"
        />
      </CheckersSquare>
    </template>

    <div></div>

    <div
      v-for="colName in cols"
      :key="'label-' + colName"
      class="grid__square--name-col grid__square--name"
    >
      {{ colName }}
    </div>
  </section>
</template>

