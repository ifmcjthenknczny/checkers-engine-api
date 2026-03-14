<script lang="ts" setup>
import { useGameStore } from '@/stores/gameStore'
import Board from './Board.vue'
import GameInfo from '@/components/game/GameInfo.vue'
import CapturedPieces from '@/components/piece/CapturedPieces.vue'
import { ref, watch } from 'vue'
import { useDragStore } from '@/stores/dragStore'
import Button from '@/components/ui/Button.vue'
import ButtonGroup from '@/components/ui/ButtonGroup.vue'
import { storeToRefs } from 'pinia'
import type { BoardContext } from '@/types'

withDefaults(
  defineProps<{
    context: BoardContext
    restartButtonLabel?: string
  }>(),
  { restartButtonLabel: 'restart' }
)

const isBoardFlipped = ref<boolean>(false)

const gameStore = useGameStore()
const { humanPlayerColor } = storeToRefs(gameStore)
const dropStore = useDragStore()

function flipBoard() {
    isBoardFlipped.value = !isBoardFlipped.value
}

watch(() => humanPlayerColor.value, (currentValue) => {
    isBoardFlipped.value = currentValue === 'black'
}, { immediate: true })

function resetGame() {
    gameStore.resetToDefault()
    isBoardFlipped.value = false
    dropStore.stopDrag()
}
</script>

<template>
    <GameInfo />

    <CapturedPieces class="graveyard-top" :pieceColor="isBoardFlipped ? 'black' : 'white'" />

    <Board :is-board-flipped="isBoardFlipped" :context="context" />

    <CapturedPieces :pieceColor="isBoardFlipped ? 'white' : 'black'" />

    <ButtonGroup
        type="game"
    >
        <Button
        buttonType="game"
        @click="resetGame"
        >
        {{ restartButtonLabel }}
        </Button>
        <Button
        buttonType="game"
        @click="flipBoard"
        >
        flip board
        </Button>
    </ButtonGroup>
</template>

<style lang="scss" scoped>
.graveyard-top :deep(.captured-pieces) {
  margin-bottom: 2px;
}
</style>
