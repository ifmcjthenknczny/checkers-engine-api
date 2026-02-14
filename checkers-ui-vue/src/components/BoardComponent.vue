<script setup lang="ts">
import { BOARD_SIZE } from '../config'
import { range, rangeChar } from '../helpers'
import { useBoardStore } from '@/stores/boardState'
import CheckersPiece from './PieceComponent.vue'
import CheckersSquare from './BoardSquare.vue'
import { isWhiteSquare, getPieceIndex } from '@/boardHelpers'
import type { SquareContent } from '@/types'
import { useDragStore } from '@/stores/dragState'
import { storeToRefs } from 'pinia'

const cols = rangeChar(BOARD_SIZE, 'a')
const rows = range(BOARD_SIZE, 1).toReversed()

const gridStyles = {
  display: 'grid',
  gridTemplateColumns: `0.2fr repeat(${BOARD_SIZE}, 1fr)`,
  gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr) 0.2fr`,
}

const { board, movePiece, addPiece } = useBoardStore()
const dragStore = useDragStore()
const { draggedIndex, dragContext } = storeToRefs(dragStore)

const drop = ([col, row, piece]: [number, number, SquareContent?]) => {
  const to = getPieceIndex(row, col)

  if (dragContext.value === 'spawn') {
    if (!piece) {
      return
    }
    addPiece(piece, to)
  }

  if (dragContext.value === 'board') {
    const from = draggedIndex.value
    if (from === null) {
      return
    }
    movePiece(from, to)
  }

  dragStore.stopDrag()
}
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
          :piece="board[getPieceIndex(rowIndex, colIndex)]"
          :index="getPieceIndex(rowIndex, colIndex)"
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

<style lang="scss" scoped>
.board {
  display: grid;
  grid-auto-flow: row;
  width: $boardSizeHorizontal;
  height: $boardSizeHorizontal;
}

.grid__square--name {
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
  font-family: $secondaryFont;
  user-select: none;

  &-col {
    text-transform: uppercase;
  }

  &-row {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@media (max-width: 700px) {
  .board {
    width: $boardSizeVertical;
    height: $boardSizeVertical;
  }
}
</style>
