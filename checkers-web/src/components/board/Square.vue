<script lang="ts" setup>
import { getPieceColor, getSquareIndex, isWhiteSquare } from '@/helpers/board'
import type { BoardContext, SquareContent } from '@/types'
import BoardTile from './BoardTile.vue'
import { useDragStore } from '@/stores/dragStore'
import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/gameStore'
import { playerMove } from '@/helpers/turn'
import { getLegalMove } from '@/helpers/move'
import { useBoardStore } from '@/stores/boardStore'
import { useGameCallbacks } from '@/hooks/useGameCallbacks'
import { useAnimationStore } from '~/stores/animationStore'

interface Props {
  position: [number, number]
  rowName: number
  colName: string
  boardIndex?: number
  context: BoardContext
}

const props = defineProps<Props>()
const [colIndex, rowIndex] = props.position

const dragStore = useDragStore()
const { activePiece, dragContext, draggedIndex } = storeToRefs(dragStore)

const boardStore = useBoardStore()
const { board } = storeToRefs(boardStore)

const gameStore = useGameStore()
const { humanPlayerColor, currentPlayer, queenMovesWithoutCaptureStreak } = storeToRefs(gameStore)
const animationStore = useAnimationStore()
const { isAnimating } = storeToRefs(animationStore)


const emit = defineEmits<{ dropPiece: [[number, number, SquareContent?]] }>()

const allowDrop = (e: DragEvent) => {
  if (isAnimating.value) return
  const isPlayersPiece = activePiece.value && getPieceColor(activePiece.value) === humanPlayerColor.value
  const isDifferentSquare = draggedIndex.value !== squareIndex
  const isPlayableSquare = !isWhiteSquare(rowIndex, colIndex)
  const isPlayerTurn = currentPlayer.value === humanPlayerColor.value

  if (isPlayableSquare && isDifferentSquare && ((props.context === 'game' && isPlayersPiece && isPlayerTurn) || props.context === 'analysis')) {
    e.preventDefault()
  }
}

const squareIndex = props.boardIndex ?? getSquareIndex(rowIndex, colIndex)
const { moveCallback, turnOverCallback, gameOverCallback } = useGameCallbacks()

const drop = (e: DragEvent) => {
  e.preventDefault()
  if (isAnimating.value) return
  if (!activePiece.value) {
    return
  }
  if (props.context === 'game') {
    const move = getLegalMove(board.value, { fromIndex: draggedIndex.value ?? undefined, toIndex: squareIndex })
    if (move) {
      playerMove(move, board.value, currentPlayer.value, queenMovesWithoutCaptureStreak.value, {moveCallback, turnOverCallback, gameOverCallback})
    }
  }
  if (dragContext.value) {
    emit('dropPiece', [colIndex, rowIndex, activePiece.value])
  }
}
</script>

<template>
  <BoardTile
    :color="isWhiteSquare(rowIndex, colIndex) ? 'white' : 'black'"
    :key="colName + rowName"
    :id="colName + rowName"
    @dragover="allowDrop"
    @drop="drop"
  >
    <slot />
  </BoardTile>
</template>
