<script setup lang="ts">
import type { SquareContent } from '@/types'
import { useDragStore } from '@/stores/dragState'

interface Props {
  piece?: SquareContent
  index: number
}

const props = defineProps<Props>()

const dragStore = useDragStore()
const drag = () => {
  dragStore.startDrag(props.index, 'board')
}

const isQueen = (piece?: SquareContent) => {
  return piece && Math.abs(piece) === 3
}

const toClassNameList = (piece?: SquareContent) => {
  if (!piece) {
    return ''
  }
  return piece < 0 ? ['piece', 'piece--black'] : ['piece', 'piece--white']
}

const toDecorationClassNameList = (piece?: SquareContent) => {
  return isQueen(piece) ? 'piece--queen-decoration' : ''
}
</script>
<template>
  <div v-if="piece !== 0" :class="toClassNameList(piece)" draggable="true" @dragstart="drag">
    <div v-if="isQueen(piece)" :class="toDecorationClassNameList(piece)" />
  </div>
</template>
<style lang="scss" scoped>
@use 'sass:color';

.piece {
  width: $pieceSize;
  height: $pieceSize;
  border-radius: 50%;
  border: 2.5px solid;
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
    border: 1.5px solid;

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

@media (max-width: 700px) {
  .piece {
    border-width: 1.7px;

    &--queen-decoration {
      border-width: 1.2px;
    }
  }
}
</style>
