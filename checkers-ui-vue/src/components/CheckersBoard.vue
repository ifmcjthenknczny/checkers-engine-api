<template>
  <section
    class="board"
    :style="gridStyles"
  >
    <template v-for="(rowName, rowIndex) in rowOrder" :key="'row-' + rowName">

      <div class="grid__square--name-row grid__square--name">
        {{ rowName }}
      </div>

      <div
        v-for="(colName, colIndex) in colOrder"
        :key="colName + rowName"
        :id="colName + rowName"
        :class="[
          'grid__square',
          isWhiteSquare(rowIndex, colIndex) ? 'grid__square--white' : 'grid__square--black'
        ]"
      >
          <CheckersPiece
          v-if="!isWhiteSquare(rowIndex, colIndex)"
          :piece="board[getPieceIndex(rowIndex, colIndex)]"
        />
    </div>
    </template>

    <div></div>

    <div
      v-for="colName in colOrder"
      :key="'label-' + colName"
      class="grid__square--name-col grid__square--name"
    >
      {{ colName }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BOARD_SIZE } from '../config';
import { range, rangeChar } from "../helpers";
import { useBoardStore } from '@/stores/boardState';
import CheckersPiece from './CheckersPiece.vue';
import type { SquareContent } from '@/types';

const cols = rangeChar(BOARD_SIZE, "a");
const rows = range(BOARD_SIZE, 1);

const rowOrder = computed(() => [...rows].reverse());
const colOrder = computed(() => [...cols]);

const gridStyles = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `0.2fr repeat(${BOARD_SIZE}, 1fr)`,
  gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr) 0.2fr`
}));

const isWhiteSquare = (rowIndex: number, colIndex: number) => {
  return (rowIndex + colIndex) % 2 === 0;
};

const getPieceIndex = (rowIndex: number, colIndex: number) => {
  return Math.floor((rowIndex * BOARD_SIZE + colIndex) / 2);
};

const { board } = useBoardStore();
</script>

<style lang="scss" scoped>
.board {
    display: grid;
    grid-auto-flow: row;
    width: $boardSizeHorizontal;
    height: $boardSizeHorizontal;
}

.grid__square {
    aspect-ratio: 1;
    border: .8px solid $borderColor;

    display: flex;
    align-items: center;
    justify-content: center;

    &--black {
        background-color: $blackSquareColor;
    }

    &--white {
        background-color: $whiteSquareColor;
    }

    &--name {
        text-align: center;
        font-weight: 700;
        font-size: 1rem;
        font-family: $secondaryFont;

        &-col {
            text-transform: uppercase;
        }

        &-row {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
}

@media (max-width: 700px) {
    .board {
        width: $boardSizeVertical;
        height: $boardSizeVertical;
    }
}
</style>
