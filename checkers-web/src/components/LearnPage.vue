<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Board from '@/components/board/Board.vue'
import GameBoardLayout from '@/components/board/GameBoardLayout.vue'
import EngineEval from '@/components/analysis/EngineEval.vue'
import MoveInput from '@/components/analysis/MoveInput.vue'
import PieceToolbox from '@/components/piece/PieceToolbox.vue'
import Button from '@/components/ui/Button.vue'
import ButtonGroup from '@/components/ui/ButtonGroup.vue'
import { storeToRefs } from 'pinia'
import { useComputerOpponent } from '@/hooks/useComputerOpponent'
import { pickBestEngineContinuation } from '@/helpers/ai'
import { indexToRowCol } from '@/helpers/board'
import type { Move, Player } from '@/types'
import Loader from './ui/Loader.vue'
import { DEFAULT_ANALYSIS_DEPTH } from '~/config'

const { boardStore, gameStore, humanPlayerColor, currentPlayer, gamePhase } = useComputerOpponent()
const { board } = storeToRefs(boardStore)

const selectedPlayerColor = ref<Player>('white')
const bestMoves = ref<Move[] | null>(null)
const isBestMoveLoading = ref(false)

function indexToAlgebraic(index: number): string {
  const { row, col } = indexToRowCol(index)
  return `${String.fromCharCode(97 + col)}${8 - row}`
}

const formattedBestMove = computed<string | null>(() => {
  if (!bestMoves.value || bestMoves.value.length === 0) {
    return null
  }
  const squares = [bestMoves.value[0].fromIndex, ...bestMoves.value.map(move => move.toIndex)]
  return squares.map(indexToAlgebraic).join('->')
})

function startGame() {
  gameStore.chooseColor(selectedPlayerColor.value)
  gameStore.setGamePhase('game')
}

watch(
  [gamePhase, currentPlayer, board],
  async () => {
    if (
      gamePhase.value === 'game' &&
      humanPlayerColor.value !== null &&
      humanPlayerColor.value === currentPlayer.value
    ) {
      bestMoves.value = null
      isBestMoveLoading.value = true
      try {
        bestMoves.value = await pickBestEngineContinuation(board.value, currentPlayer.value, DEFAULT_ANALYSIS_DEPTH)
      } catch {
        bestMoves.value = null
      } finally {
        isBestMoveLoading.value = false
      }
    } else {
      bestMoves.value = null
    }
  },
)
</script>

<template>
  <div class="learn-page">
    <div class="learn-page__board-col">
      <template v-if="gamePhase === 'color'">
        <Board context="analysis" />
      </template>
      <template v-else>
        <GameBoardLayout :show-captured-pieces="false" context="game" restart-button-label="stop" />
      </template>
    </div>

    <div v-if="gamePhase === 'color'" class="learn-page__toolbox-col">
      <PieceToolbox />
    </div>

    <aside class="learn-page__side">
      <template v-if="gamePhase === 'color'">
        <div class="setup-panel">
          <div class="setup-panel__section">
            <span class="setup-panel__label">who starts</span>
            <MoveInput />
          </div>
          <div class="setup-panel__section">
            <span class="setup-panel__label">you play as</span>
            <ButtonGroup type="question">
              <Button
                color-variant="white"
                button-type="color"
                size-variant="small"
                :selected="selectedPlayerColor === 'white'"
                @click="selectedPlayerColor = 'white'"
              >
                white
              </Button>
              <Button
                color-variant="black"
                button-type="color"
                size-variant="small"
                :selected="selectedPlayerColor === 'black'"
                @click="selectedPlayerColor = 'black'"
              >
                black
              </Button>
            </ButtonGroup>
          </div>
          <Button button-type="game" @click="startGame">start</Button>
        </div>
      </template>

      <template v-else>
        <div class="learn-page__eval-col">
          <EngineEval :fetch-on-players="[humanPlayerColor]" />
          <div
            v-if="gamePhase === 'game'"
            class="best-move-hint"
            :class="{ 'best-move-hint--loading': humanPlayerColor === currentPlayer && isBestMoveLoading }"
          >
            <span class="best-move-hint__label">hint</span>
            <span class="best-move-hint__move">
              <Loader v-if="isBestMoveLoading" />
              <span v-else-if="humanPlayerColor === currentPlayer && formattedBestMove">{{formattedBestMove}}</span>
              <span v-else>...</span>
            </span>
          </div>
        </div>
      </template>
    </aside>
  </div>
</template>

<style lang="scss" scoped>
.learn-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  box-sizing: border-box;
}

.learn-page__board-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  justify-content: center;
  order: 1;
}

.learn-page__toolbox-col {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  order: 2;
}

.learn-page__side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  order: 3;
}

.setup-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;

  &__section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    width: 100%;
  }

  &__label {
    text-transform: uppercase;
    font-weight: 650;
    font-size: 1rem;
    font-family: $secondaryFont;
    color: color-mix(in srgb, darkgray 20%, black);
    letter-spacing: 0.05em;
  }
}

.learn-page__eval-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 280px;
}

.best-move-hint {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.3rem;
  transition: opacity 0.2s;
  width: 12ch;
  max-width: 100%;
  flex-shrink: 0;

  &--loading {
    opacity: 0.5;
  }

  &__label {
    text-transform: uppercase;
    font-size: 0.75rem;
    font-weight: 650;
    font-family: $secondaryFont;
    letter-spacing: 0.08em;
    color: #888;
  }

  &__move {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    font-family: monospace;
    font-size: 1.1rem;
    font-weight: bold;
    padding: 4px 10px;
    background: #f0f0f0;
    border-radius: 4px;
    border: 1px solid #ddd;
    letter-spacing: 0.04em;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    text-align: center;
    overflow-wrap: break-word;
    word-break: break-all;
  }
}

@media (max-width: $breakpoint) {
  .learn-page__board-col {
    :deep(.game-info) {
      width: $boardSizeVertical;
      font-size: 1.4rem;
    }

    :deep(.game-info__who-to-move) {
      margin-left: $nameSquareSizeVertical;
    }
  }
}

@media (min-width: $breakpoint) {
  .learn-page {
    flex: 1;
    flex-direction: row;
    align-items: flex-start;
    gap: inherit;
  }

  .learn-page__board-col {
    flex: 1;
    justify-content: center;
    min-width: 0;
    order: 1;
  }

  .learn-page__side {
    flex-shrink: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
    width: auto;
    order: 2;
  }

  .learn-page__toolbox-col {
    align-items: flex-start;
    order: 3;
    margin-left: 2rem;
  }

  .learn-page__eval-col {
    flex-direction: column;
    align-items: flex-start;
  }

  .setup-panel {
    align-items: flex-start;
    max-width: 280px;

    &__section {
      align-items: flex-start;
    }
  }
}
</style>
