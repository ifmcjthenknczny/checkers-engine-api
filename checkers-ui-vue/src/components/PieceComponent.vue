<script setup lang="ts">
import type { SquareContent } from '@/types'
import { useDragStore, type DragContext } from '@/stores/dragStore'
import { useBoardStore } from '@/stores/boardStore'
import { getPieceColor, isQueen } from '@/helpers/board'

interface Props {
  piece: SquareContent
  index?: number
  context: DragContext
  isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), { isSelected: false })

const dragStore = useDragStore()
const boardStore = useBoardStore()
const drag = () => {
  if (props.context === 'board' && props.index !== undefined) {
    boardStore.setSelectedIndex(props.index)
  }
  dragStore.startDrag(props.context, props.piece, props.index)
}

const toClassNameList = (piece?: SquareContent) => {
  const color = getPieceColor(piece)
  if (!color) {
    return ''
  }
  const classes = ['piece', `piece--${color}`]
  if (props.isSelected) classes.push('piece--selected')
  return classes
}

const toDecorationClassNameList = (piece?: SquareContent) => {
  return isQueen(piece) ? 'piece--queen-decoration' : ''
}
</script>
<template>
  <div
    v-if="piece !== 0"
    :class="toClassNameList(piece)"
    draggable="true"
    @dragstart="drag"
  >
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

  &--selected {
    box-shadow: 0 0 0 3px $clickedColor;
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
