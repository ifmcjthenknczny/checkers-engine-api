<script setup lang="ts">
import { BOARD_SIZE } from '../config'
import { range, rangeChar } from '../helpers/utils'
import { useBoardStore } from '@/stores/boardStore'
import CheckersPiece from './PieceComponent.vue'
import CheckersSquare from './BoardSquare.vue'
import { isWhiteSquare, getSquareIndex, getPieceColor } from '@/helpers/board'
import type { BoardContext, Move, SquareContent } from '@/types'
import { useDragStore } from '@/stores/dragStore'
import { storeToRefs } from 'pinia'
import { findLegalMovesOfPiece, playerHasCapturePossibility } from '@/helpers/move'
import { computed } from 'vue'
import PossibleMoveMarker from './PossibleMoveMarker.vue'
import { useGameStore } from '@/stores/gameStore'

const props = withDefaults(
  defineProps<{
    isBoardFlipped?: boolean
    context: BoardContext
  }>(),
  {
    isBoardFlipped: false,
  }
)

const cols = computed(() => props.isBoardFlipped ? rangeChar(BOARD_SIZE, 'a').toReversed() : rangeChar(BOARD_SIZE, 'a'))

const rows = computed(() => props.isBoardFlipped ? range(BOARD_SIZE, 1) : range(BOARD_SIZE, 1).toReversed())

const getDisplaySquareIndex = (rowIndex: number, colIndex: number) => {
  const boardRow = props.isBoardFlipped ? BOARD_SIZE - 1 - rowIndex : rowIndex
  const boardCol = props.isBoardFlipped ? BOARD_SIZE - 1 - colIndex : colIndex
  return getSquareIndex(boardRow, boardCol)
}

const gridStyles = {
  display: 'grid',
  gridTemplateColumns: `0.2fr repeat(${BOARD_SIZE}, 1fr)`,
  gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr) 0.2fr`,
}

const boardStore = useBoardStore()
const { board } = storeToRefs(boardStore)
const dragStore = useDragStore()
const { draggedIndex, dragContext } = storeToRefs(dragStore)
const gameStore = useGameStore()
const { currentPlayer, humanPlayerColor } = storeToRefs(gameStore)

const possibleMovesForDraggedPieceMap = computed(() => {
  if (props.context === 'analysis' || draggedIndex.value === null || dragContext.value !== 'board') {
    return []
  }
  const draggedPieceColor = getPieceColor(board.value[draggedIndex.value])
  if (!draggedPieceColor) {
    return []
  }
  const legalMovesOfPiece = findLegalMovesOfPiece(board.value, draggedIndex.value, playerHasCapturePossibility(board.value, draggedPieceColor))
  return legalMovesOfPiece.reduce((acc, move) => {
    acc[move.toIndex] = move
    return acc
  }, {} as Record<number, Move>)
})

const drop = ([col, row, piece]: [number, number, SquareContent?]) => {
  const toIndex = getDisplaySquareIndex(row, col)
  // const pieceColor = getPieceColor(piece)

  // if (pieceColor === boardStore.currentPlayer) {
  //   boardStore.switchPlayer()
  // }

  if (dragContext.value === 'spawn' && props.context === 'analysis') {
    if (!piece) {
      return
    }
    boardStore.addPiece(piece, toIndex)
  }

  if (dragContext.value === 'board') {
    const fromIndex = draggedIndex.value
    if (fromIndex === null) {
      return
    }
    if (props.context === 'game') {
      if (!possibleMovesForDraggedPieceMap.value[toIndex]) {
        return
      }
      boardStore.applyMove(possibleMovesForDraggedPieceMap.value[toIndex])
      return
    }
    boardStore.movePiece(fromIndex, toIndex)
  }

  dragStore.stopDrag()
}

function shouldShowPossibleMoveMarker(rowIndex: number, colIndex: number) {
  const displaySquareIndex = getDisplaySquareIndex(rowIndex, colIndex)
  const belongsToDraggedPiece = Object.keys(possibleMovesForDraggedPieceMap.value).some(toIndex => +toIndex === displaySquareIndex)
  const isPlayableSquare = !isWhiteSquare(rowIndex, colIndex)
  const isPlayersTurn = currentPlayer.value === humanPlayerColor.value

  return belongsToDraggedPiece && isPlayableSquare && isPlayersTurn
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
        :board-index="getDisplaySquareIndex(rowIndex, colIndex)"
        :colName="colName"
        :rowName="rowName"
        :key="`${colName}${rowName}`"
        @drop-piece="drop"
        :context="context"
      >
        <CheckersPiece
          v-if="!isWhiteSquare(rowIndex, colIndex)"
          :piece="board[getDisplaySquareIndex(rowIndex, colIndex)]!"
          :index="getDisplaySquareIndex(rowIndex, colIndex)"
          context="board"
        />
        <PossibleMoveMarker v-if="shouldShowPossibleMoveMarker(rowIndex, colIndex)" :key="getDisplaySquareIndex(rowIndex, colIndex)" />
      </CheckersSquare>
    </template>

    <div />

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

@media (max-width: $breakpoint) {
  .board {
    width: $boardSizeVertical;
    height: $boardSizeVertical;
  }
}
</style>
