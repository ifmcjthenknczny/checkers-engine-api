<script setup lang="ts">
import type { SquareContent } from '@/types'
import { getPieceColor } from '@/helpers/board'
import PieceComponent from './PieceComponent.vue'
import SquareWrapper from './SquareWrapper.vue'
import PieceTrash from './PieceTrash.vue'
import RemovePieces from './RemovePieces.vue'
import ResetToDefaultButton from './ResetToDefaultButton.vue'

const TOOLBOX_PIECES: SquareContent[] = [-3, 3, -1, 1]
</script>

<template>
  <div class="piece-spawner">
    <div class="piece-spawner__row piece-spawner__row--top">
      <div class="piece-spawner__trash-cell">
        <SquareWrapper color="black">
          <PieceTrash />
        </SquareWrapper>
      </div>
      <SquareWrapper color="white">
        <RemovePieces />
      </SquareWrapper>
      <SquareWrapper color="black">
        <ResetToDefaultButton />
      </SquareWrapper>
    </div>
    <div class="piece-spawner__row piece-spawner__row--bottom">
      <SquareWrapper :key="piece" v-for="piece in TOOLBOX_PIECES" :color="getPieceColor(piece)!">
        <PieceComponent :piece="piece" context="spawn" />
      </SquareWrapper>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$cell-mobile: calc($boardSizeVertical / 8);
$cell-desktop: calc($boardSizeHorizontal / 8);

.piece-spawner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.piece-spawner__row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 4px;

  & > * {
    width: $cell-mobile;
    height: $cell-mobile;
    flex-shrink: 0;
  }
}

.piece-spawner__trash-cell {
  width: $cell-mobile;
  height: $cell-mobile;
  flex-shrink: 0;
}

@media (min-width: $breakpoint) {
  .piece-spawner {
    flex-direction: row;
    align-items: flex-start;
    gap: 8px;
  }

  .piece-spawner__row {
    flex-direction: column;
    gap: 4px;

    & > * {
      width: $cell-desktop;
      height: $cell-desktop;
    }
  }

  .piece-spawner__row--top {
    flex-shrink: 0;
  }

  .piece-spawner__row--bottom {
    flex-wrap: wrap;
    max-width: calc(2 * $cell-desktop + 4px);
  }

  .piece-spawner__trash-cell {
    width: $cell-desktop;
    height: $cell-desktop;
  }
}
</style>
