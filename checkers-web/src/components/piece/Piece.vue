<script setup lang="ts">
import type { SquareContent } from '@/types'
import { useDragStore, type DragContext } from '@/stores/dragStore'
import { getPieceColor, isQueen } from '@/helpers/board'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useComputerMoveStore } from '~/stores/computerMoveStore'

interface Props {
  piece: SquareContent
  index?: number
  context: DragContext
  flashRed?: boolean
}

const props = defineProps<Props>()

const dragStore = useDragStore()
const gameStore = useGameStore()
const { humanPlayerColor } = storeToRefs(gameStore)
const animationStore = useComputerMoveStore()
const { isAnimating } = storeToRefs(animationStore)

const drag = () => {
  dragStore.startDrag(props.context, props.piece, props.index)
}

const toClassNameList = (piece?: SquareContent) => {
  const color = getPieceColor(piece)
  if (!color) {
    return ''
  }
  return ['piece', `piece--${color}`]
}

const toDecorationClassNameList = (piece?: SquareContent) => {
  return isQueen(piece) ? 'piece--queen-decoration' : ''
}

const canBeDragged = computed(() => {
  if (isAnimating.value) {
    return false
  }
  if (props.context === 'spawn') {
    return true
  }
  return !humanPlayerColor.value || humanPlayerColor.value === getPieceColor(props.piece)
})
</script>

<template>
  <div v-if="piece !== 0" :class="[toClassNameList(piece), { 'piece--flash-red': flashRed }]" :draggable="canBeDragged" @dragstart="drag">
    <div v-if="isQueen(piece)" :class="toDecorationClassNameList(piece)" />
  </div>
</template>
<style lang="scss" scoped>
@use 'sass:color';

.piece {
  aspect-ratio: 1;
  width: $pieceSize;
  height: $pieceSize;
  border-radius: 50%;
  border: 1.7px solid;
  display: flex;
  align-items: center;
  justify-content: center;

  &--black {
    background-color: black;
    border-color: white;

    & .piece--queen-decoration {
      border-color: white;
      background-color: color.mix(darkgrey, black, 50%);
    }

    &.piece--can-move {
      background-color: color.adjust(color.mix(aqua, violet), $lightness: -10%);
    }

    & .piece--can-move {
      background-color: color.adjust(color.mix(aqua, violet), $lightness: -10%);
    }
  }

  &--white {
    background-color: white;
    border-color: black;

    & .piece--queen-decoration {
      border-color: black;
      background-color: color.mix(lightgrey, grey, 70%);
    }

    &.piece--can-move {
      background-color: color.mix(aqua, violet);
    }

    & .piece--can-move {
      background-color: color.adjust(color.mix(aqua, violet), $lightness: -10%);
    }
  }

  &--queen-decoration {
    border-radius: 50%;
    width: calc($pieceSize / 1.5);
    height: calc($pieceSize / 1.5);
    border: 1.2px solid;

    &-won {
      border-radius: 50%;
      width: calc($pieceSize / 1.5);
      height: calc($pieceSize / 1.5);
      border: 1.5px solid;
      background-color: color.adjust($clickedColor, $lightness: -25%);
    }

    &-lost {
      border-radius: 50%;
      width: calc($pieceSize / 1.5);
      height: calc($pieceSize / 1.5);
      border: 1.5px solid;
      background-color: color.adjust($blackSquareColor, $lightness: -20%);
    }
  }

  &--won {
    background-color: color.adjust($clickedColor, $lightness: -10%);
    border-color: black;
  }

  &--lost {
    background-color: color.adjust($blackSquareColor, $lightness: -10%);
    border-color: black;
  }
}

.piece-hover:hover .piece--queen-decoration,
#piece-clicked .piece--queen-decoration,
.piece-hover:hover .piece--queen-decoration {
  background-color: color.adjust($clickedColor, $lightness: -20%);
  transition: background-color colorTransitionTime;
}

.piece-hover:hover,
#piece-clicked,
.piece-hover:active {
  background-color: $clickedColor;
  transition: background-color $colorTransitionTime;
}

@keyframes flash-red {
  0%, 100% { box-shadow: inset 0 0 0 0 rgba(200, 0, 0, 0); }
  30%, 70% { box-shadow: inset 0 0 0 100px rgba(180, 0, 0, 0.82); }
}

.piece--flash-red {
  animation: flash-red 0.55s ease-in-out;
}

@media (min-width: $breakpoint) {
  .piece {
    border-width: 2.5px;

    &--queen-decoration {
      border-width: 1.5px;
    }
  }
}
</style>
