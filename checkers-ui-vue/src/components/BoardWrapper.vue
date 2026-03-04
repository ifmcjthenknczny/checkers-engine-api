<script lang="ts" setup>
import { useGameStore } from '@/stores/gameStore'
import BoardComponent from './BoardComponent.vue'
import GameInfo from './GameInfo.vue'
import PieceGraveryard from './PieceGraveryard.vue'
import { ref } from 'vue'
import { useDragStore } from '@/stores/dragStore'
import ButtonComponent from './ButtonComponent.vue'
import ButtonContainer from './ButtonContainer.vue'

const isBoardFlipped = ref<boolean>(false)

const gameStore = useGameStore()
const dropStore = useDragStore()

// TODO: ogar button container style i click handler
// TODO: podświetlić figurę jeśli jest bicie, a user kliknął taką która nie ma bicia

function flipBoard() {
    isBoardFlipped.value = !isBoardFlipped.value
}

function resetGame() {
    gameStore.resetToDefault()
    isBoardFlipped.value = false
    dropStore.stopDrag()
}

</script>

<template>
    <GameInfo />

    <PieceGraveryard :pieceColor="isBoardFlipped ? 'black' : 'white'" />

    <BoardComponent :in-game-behavior="true" :is-board-flipped="isBoardFlipped" />

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