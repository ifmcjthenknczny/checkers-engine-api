<script lang="ts" setup>
import { useGameStore } from '@/stores/gameStore'
import BoardComponent from './BoardComponent.vue'
import GameInfo from './GameInfo.vue'
import PieceGraveryard from './PieceGraveryard.vue'
import { ref } from 'vue'
import { useDragStore } from '@/stores/dragStore'

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

    <section class="button-container button-container--game">
        <button
        type="button"
        class="button button--reset button--game"
        @click="resetGame"
        >
        restart
        </button>
        
        <button
        type="button"
        class="button button--flip button--game"
        @click="flipBoard"
        >
        flip board
        </button>        
    </section>
</template>