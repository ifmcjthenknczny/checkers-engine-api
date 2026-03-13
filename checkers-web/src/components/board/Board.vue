<script setup lang="ts">
import { BOARD_SIZE } from '@/config'
import { range, rangeChar } from '@/helpers/utils'
import { useBoardStore } from '@/stores/boardStore'
import Piece from '@/components/piece/Piece.vue'
import Square from './Square.vue'
import { isWhiteSquare, getSquareIndex, getPieceColor, indexToRowCol } from '@/helpers/board'
import type { BoardContext, Move, SquareContent } from '@/types'
import { useDragStore } from '@/stores/dragStore'
import { storeToRefs } from 'pinia'
import { findLegalMovesOfPiece, playerHasCapturePossibility, findAllLegalMoves } from '@/helpers/move'
import { computed, ref, watch, nextTick } from 'vue'
import PossibleMoveMarker from './PossibleMoveMarker.vue'
import { useGameStore } from '@/stores/gameStore'
import { useAnimationStore } from '~/stores/animationStore'

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
const animationStore = useAnimationStore()
const { animatingMove, isAnimating } = storeToRefs(animationStore)

const flashRedIndices = ref<Set<number>>(new Set())
let flashRedTimeout: ReturnType<typeof setTimeout> | null = null

const movingPiecePhase = ref<'from' | 'to'>('from')
const movingPieceContent = ref<SquareContent | null>(null)
const movingPieceRef = ref<HTMLElement | null>(null)

watch(animatingMove, (move) => {
  if (move) {
    movingPieceContent.value = board.value[move.fromIndex]
    movingPiecePhase.value = 'from'
    nextTick(() => {
      movingPieceRef.value?.getBoundingClientRect()
      movingPiecePhase.value = 'to'
    })
  } else {
    movingPieceContent.value = null
  }
})

function indexToDisplayRowCol(index: number) {
  const { row: boardRow, col: boardCol } = indexToRowCol(index)
  const displayRow = props.isBoardFlipped ? BOARD_SIZE - 1 - boardRow : boardRow
  const displayCol = props.isBoardFlipped ? BOARD_SIZE - 1 - boardCol : boardCol
  return { displayRow, displayCol }
}

const movingPieceStyle = computed(() => {
  const move = animatingMove.value
  if (!move) return {}
  const from = indexToDisplayRowCol(move.fromIndex)
  const to = indexToDisplayRowCol(move.toIndex)
  const fromLeft = (0.2 + from.displayCol + 0.5) / 8.2 * 100
  const fromTop = (from.displayRow + 0.5) / 8.2 * 100
  const toLeft = (0.2 + to.displayCol + 0.5) / 8.2 * 100
  const toTop = (to.displayRow + 0.5) / 8.2 * 100
  const isTo = movingPiecePhase.value === 'to'
  return {
    '--from-left': `${fromLeft}%`,
    '--from-top': `${fromTop}%`,
    '--to-left': `${toLeft}%`,
    '--to-top': `${toTop}%`,
    left: isTo ? `${toLeft}%` : `${fromLeft}%`,
    top: isTo ? `${toTop}%` : `${fromTop}%`,
  }
})

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

  if (dragContext.value === 'spawn' && props.context === 'analysis') {
    if (!piece) {
      return
    }
    boardStore.addPiece(piece, toIndex)
  }

  if (dragContext.value === 'board') {
    if (isAnimating.value) return
    const fromIndex = draggedIndex.value
    if (fromIndex === null) {
      return
    }
    if (props.context === 'game') {
      if (!possibleMovesForDraggedPieceMap.value[toIndex]) {
        if (
          Object.keys(possibleMovesForDraggedPieceMap.value).length === 0 &&
          humanPlayerColor.value !== null &&
          currentPlayer.value === humanPlayerColor.value
        ) {
          if (flashRedTimeout) clearTimeout(flashRedTimeout)
          const color = getPieceColor(board.value[fromIndex])!
          flashRedIndices.value = new Set(findAllLegalMoves(board.value, color).map(m => m.fromIndex))
          flashRedTimeout = setTimeout(() => { flashRedIndices.value = new Set() }, 600)
        }
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
  const isPlayersPiece =
    humanPlayerColor.value !== null &&
    draggedIndex.value !== null &&
    getPieceColor(board.value[draggedIndex.value]) === humanPlayerColor.value

  return belongsToDraggedPiece && isPlayableSquare && isPlayersTurn && isPlayersPiece
}
</script>

<template>
  <section class="board board--with-overlay" :style="gridStyles">
    <template v-for="(rowName, rowIndex) in rows" :key="'row-' + rowName">
      <div class="grid__square--name-row grid__square--name">
        {{ rowName }}
      </div>

      <Square
        v-for="(colName, colIndex) in cols"
        :position="[colIndex, rowIndex]"
        :board-index="getDisplaySquareIndex(rowIndex, colIndex)"
        :colName="colName"
        :rowName="rowName"
        :key="`${colName}${rowName}`"
        @drop-piece="drop"
        :context="context"
      >
        <Piece
          v-if="!isWhiteSquare(rowIndex, colIndex) && !(animatingMove && getDisplaySquareIndex(rowIndex, colIndex) === animatingMove.fromIndex)"
          :piece="board[getDisplaySquareIndex(rowIndex, colIndex)]!"
          :index="getDisplaySquareIndex(rowIndex, colIndex)"
          :flash-red="flashRedIndices.has(getDisplaySquareIndex(rowIndex, colIndex))"
          context="board"
        />
        <PossibleMoveMarker v-if="shouldShowPossibleMoveMarker(rowIndex, colIndex)" :key="getDisplaySquareIndex(rowIndex, colIndex)" />
      </Square>
    </template>

    <div />

    <div
      v-for="colName in cols"
      :key="'label-' + colName"
      class="grid__square--name-col grid__square--name"
    >
      {{ colName }}
    </div>

    <div v-if="animatingMove && movingPieceContent" class="board__move-overlay" aria-hidden="true">
      <div
        ref="movingPieceRef"
        class="board__moving-piece"
        :style="movingPieceStyle"
      >
        <Piece
          :piece="movingPieceContent"
          context="board"
        />
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.board {
  display: grid;
  grid-auto-flow: row;
  width: $boardSizeHorizontal;
  height: $boardSizeHorizontal;
  position: relative;

  &--with-overlay {
    isolation: isolate;
  }

  &__move-overlay {
    grid-column: 1 / -1;
    grid-row: 1 / -1;
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
  }

  &__moving-piece {
    position: absolute;
    width: calc($boardSizeHorizontal / 8.2);
    height: calc($boardSizeHorizontal / 8.2);
    transform: translate(-50%, -50%);
    transition: left 0.45s ease-out, top 0.45s ease-out;
    display: flex;
    align-items: center;
    justify-content: center;
  }
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

  .board__moving-piece {
    width: calc($boardSizeVertical / 8.2);
    height: calc($boardSizeVertical / 8.2);
  }
}
</style>
