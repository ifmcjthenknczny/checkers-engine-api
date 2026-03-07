<script lang="ts" setup>
import { useGameStore } from '@/stores/gameStore'
import BoardComponent from './BoardComponent.vue'
import GameInfo from './GameInfo.vue'
import PieceGraveryard from './PieceGraveryard.vue'
import { ref, watch } from 'vue'
import { useDragStore } from '@/stores/dragStore'
import ButtonComponent from './ButtonComponent.vue'
import ButtonContainer from './ButtonContainer.vue'
import { storeToRefs } from 'pinia'
import type { BoardContext } from '@/types'

defineProps<{
  context: BoardContext
}>()

const isBoardFlipped = ref<boolean>(false)

const gameStore = useGameStore()
const { humanPlayerColor } = storeToRefs(gameStore)
const dropStore = useDragStore()

// TODO: podświetlić figurę jeśli jest bicie, a user kliknął taką która nie ma bicia

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

    <PieceGraveryard class="graveyard-top" :pieceColor="isBoardFlipped ? 'black' : 'white'" />

    <BoardComponent :is-board-flipped="isBoardFlipped" :context="context" />

    <PieceGraveryard :pieceColor="isBoardFlipped ? 'white' : 'black'" />

    <ButtonContainer
        type="game"
    >
        <ButtonComponent
        buttonType="game"
        @click="resetGame"
        >
        restart
        </ButtonComponent>
        <ButtonComponent
        buttonType="game"
        @click="flipBoard"
        >
        flip board
        </ButtonComponent>     
    </ButtonContainer>
</template>

<style lang="scss" scoped>
.graveyard-top :deep(.captured-pieces) {
  margin-bottom: 2px;
}
</style>