import type { Move } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useComputerMoveStore = defineStore('animation', () => {
    // TODO: refine logic so that isAnimating can be derived from animatingMove
    const isAnimating = ref<boolean>(false)
    const animatingMove = ref<Move | null>(null)
    const isThinking = ref<boolean>(false)

    function setIsAnimating(value: boolean) {
        isAnimating.value = value
    }

    function setAnimatingMove(move: Move | null) {
        animatingMove.value = move
    }

    function setIsThinking(value: boolean) {
        isThinking.value = value
    }

    return {
        isAnimating,
        animatingMove,
        isThinking,
        setIsAnimating,
        setAnimatingMove,
        setIsThinking,
    }
})