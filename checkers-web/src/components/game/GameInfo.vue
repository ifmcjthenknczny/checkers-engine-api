<template>
    <section class="game-info">
        <section class="game-info__who-to-move">
            <template v-if="gameResultParts.highlight">
                <span :class="gameResultParts.highlight === 'white' ? 'white' : ''">{{
                    gameResultParts.highlight
                }}</span>{{ gameResultParts.suffix }}
            </template>
            <template v-else>
                {{ gameResultText.toLowerCase() }}
            </template>
        </section>
        <Loader v-if="isThinking" />
        <section class="game-info__turn-counter">
            Turn: <span>{{ turn }}</span>
        </section>
    </section>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import { useComputerMoveStore } from '~/stores/computerMoveStore'
import type { PieceColor } from '@/types'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import Loader from '@/components/ui/Loader.vue'

const gameStore = useGameStore()
const { currentPlayer, movesCount, gameResult } = storeToRefs(gameStore)

const animationStore = useComputerMoveStore()
const { isThinking } = storeToRefs(animationStore)

const turn = computed(() => Math.floor(movesCount.value / 2) + 1)

const gameResultText = computed(() => {
    if (!gameResult.value && currentPlayer.value === 'white') {
        return 'white to move'
    }
    if (!gameResult.value && currentPlayer.value === 'black') {
        return 'black to move'
    }
    if (gameResult.value === 'white') {
        return 'white won!'
    }
    if (gameResult.value === 'black') {
        return 'black won!'
    }
    if (gameResult.value === 'draw') {
        return 'it is a draw!'
    }
    return ''
})

const gameResultParts = computed(() => {
    const text = gameResultText.value ?? ''
    const first = text.split(' ')[0]?.toLowerCase() ?? ''
    if (first === 'white' || first === 'black') {
        const index = text.indexOf(' ')
        const suffix = index === -1 ? '' : text.slice(index)
        return { highlight: first as PieceColor, suffix }
    }
    return { highlight: null, suffix: '' }
})
</script>

<style lang="scss" scoped>
.game-info {
    display: flex;
    flex-direction: row;
    justify-content: end;
    text-transform: uppercase;
    font-weight: 550;
    width: $boardSizeVertical;
    font-size: 1.4rem;
    align-items: center;

    &__turn-counter span {
        font-weight: 700;
    }

    &__who-to-move {
        margin-right: auto;
        margin-left: $nameSquareSizeVertical;

        span {
        font-weight: 700;
        color: black;
        text-shadow: none;

        &.white {
            color: white;
            -webkit-text-stroke: 0.6px black;
        }
        }
    }
}

@media (min-width: $breakpoint) {
    .game-info {
      width: $boardSizeHorizontal;
      font-size: 1rem;

      &__who-to-move {
        margin-left: $nameSquareSizeHorizontal;
      }
    }
}
</style>
