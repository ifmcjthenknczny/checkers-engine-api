<script lang="ts" setup>
import { getPieceColor, getSquareIndex, isWhiteSquare } from '@/helpers/board'
import type { SquareContent } from '@/types'
import SquareWrapper from './SquareWrapper.vue'
import { useDragStore } from '@/stores/dragStore'
import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/gameStore'

interface Props {
  position: [number, number]
  rowName: number
  colName: string
  boardIndex?: number
}

const props = defineProps<Props>()
const [colIndex, rowIndex] = props.position

const dragStore = useDragStore()
const { activePiece, dragContext, draggedIndex } = storeToRefs(dragStore)

const gameStore = useGameStore()
const { humanPlayerColor, currentPlayer } = storeToRefs(gameStore)

const emit = defineEmits<{ dropPiece: [[number, number, SquareContent?]] }>()
const allowDrop = (e: DragEvent) => {
  const isPlayersPiece = activePiece.value && getPieceColor(activePiece.value) === humanPlayerColor.value || !humanPlayerColor.value
  const isDifferentSquare = draggedIndex.value !== squareIndex
  const isPlayableSquare = !isWhiteSquare(rowIndex, colIndex)
  const isPlayerTurn = !humanPlayerColor.value || currentPlayer.value === humanPlayerColor.value

  if (isPlayableSquare && isDifferentSquare && isPlayersPiece && isPlayerTurn) {
    e.preventDefault()
  }
}

const squareIndex = props.boardIndex ?? getSquareIndex(rowIndex, colIndex)

const drop = (e: DragEvent) => {
  e.preventDefault()
  if (!activePiece.value) {
    return
  }
  if (dragContext.value === 'spawn') {
    emit('dropPiece', [colIndex, rowIndex, activePiece.value])
  } else if (dragContext.value === 'board') {
    emit('dropPiece', [colIndex, rowIndex, activePiece.value])
  }
}
</script>

<template>
  <SquareWrapper
    :color="isWhiteSquare(rowIndex, colIndex) ? 'white' : 'black'"
    :key="colName + rowName"
    :id="colName + rowName"
    @dragover="allowDrop"
    @drop="drop"
  >
    <slot />
  </SquareWrapper>
</template>
