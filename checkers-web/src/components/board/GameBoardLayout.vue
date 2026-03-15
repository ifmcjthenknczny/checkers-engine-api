<script lang="ts" setup>
import { useGameStore } from '@/stores/gameStore'
import Board from './Board.vue'
import GameInfo from '@/components/game/GameInfo.vue'
import CapturedPieces from '@/components/piece/CapturedPieces.vue'
import { watch } from 'vue'
import { useDragStore } from '@/stores/dragStore'
import { useBoardStore } from '@/stores/boardStore'
import Button from '@/components/ui/Button.vue'
import ButtonGroup from '@/components/ui/ButtonGroup.vue'
import FlipBoardButton from '@/components/ui/FlipBoardButton.vue'
import { storeToRefs } from 'pinia'
import type { BoardContext } from '@/types'

withDefaults(
  defineProps<{
    context: BoardContext
    restartButtonLabel?: string
    showCapturedPieces?: boolean
  }>(),
  { restartButtonLabel: 'restart', showCapturedPieces: true }
)

const gameStore = useGameStore()
const boardStore = useBoardStore()
const { humanPlayerColor } = storeToRefs(gameStore)
const { isBoardFlipped } = storeToRefs(boardStore)
const dropStore = useDragStore()

watch(() => humanPlayerColor.value, (currentValue) => {
  boardStore.setBoardFlipped(currentValue === 'black')
}, { immediate: true })

function resetGame() {
  gameStore.resetToDefault()
  boardStore.setBoardFlipped(false)
  dropStore.stopDrag()
}
</script>

<template>
    <GameInfo />

    <CapturedPieces v-if="showCapturedPieces" class="graveyard-top" :pieceColor="isBoardFlipped ? 'black' : 'white'" />

    <Board :context="context" />

    <CapturedPieces v-if="showCapturedPieces" :pieceColor="isBoardFlipped ? 'white' : 'black'" />

    <ButtonGroup
        type="game"
    >
        <Button
        buttonType="game"
        @click="resetGame"
        >
        {{ restartButtonLabel }}
        </Button>
        <FlipBoardButton />
    </ButtonGroup>
</template>

<style lang="scss" scoped>
.graveyard-top :deep(.captured-pieces) {
  margin-bottom: 2px;
}
</style>
