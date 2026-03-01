<script setup lang="ts">
import { BOARD_SIZE } from '../config'
import { range, rangeChar } from '../helpers/utils'
import { useBoardStore } from '@/stores/boardStore'
import CheckersPiece from './PieceComponent.vue'
import CheckersSquare from './BoardSquare.vue'
import { isWhiteSquare, getSquareIndex, getPieceColor } from '@/helpers/board'
import type { SquareContent } from '@/types'
import { useDragStore } from '@/stores/dragStore'
import { storeToRefs } from 'pinia'
import { findLegalMovesOfPiece, playerHasCapturePossibility } from '@/helpers/move'
import { computed } from 'vue'
import PossibleMoveMarker from './PossibleMoveMarker.vue'

const props = withDefaults(
  defineProps<{
    followGameBehavior?: boolean
  }>(),
  {
    followGameBehavior: true,
  }
)

const cols = rangeChar(BOARD_SIZE, 'a')
const rows = range(BOARD_SIZE, 1).toReversed()

const gridStyles = {
  display: 'grid',
  gridTemplateColumns: `0.2fr repeat(${BOARD_SIZE}, 1fr)`,
  gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr) 0.2fr`,
}

const boardStore = useBoardStore()
const { board } = storeToRefs(boardStore)
const dragStore = useDragStore()
const { draggedIndex, dragContext } = storeToRefs(dragStore)

const possibleMovesForDraggedPiece = computed(() => {
  if (!props.followGameBehavior || draggedIndex.value === null || dragContext.value !== 'board') {
    return []
  }
  const draggedPieceColor = getPieceColor(board.value[draggedIndex.value!])
  if (!draggedPieceColor) {
    return []
  }
  const legalMovesOfPiece = findLegalMovesOfPiece(board.value, draggedIndex.value!, playerHasCapturePossibility(board.value, draggedPieceColor!))
  console.log({legalMovesOfPiece})
  return legalMovesOfPiece
})

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
          :piece="board[getSquareIndex(rowIndex, colIndex)]!"
          :index="getSquareIndex(rowIndex, colIndex)"
          context="board"
        />
        <PossibleMoveMarker v-if="possibleMovesForDraggedPiece.some(m => m.toIndex === getSquareIndex(rowIndex, colIndex)) && !isWhiteSquare(rowIndex, colIndex)" :key="(getSquareIndex(rowIndex, colIndex))" />
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
