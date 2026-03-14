<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import Board from '@/components/board/Board.vue'
import GameBoardLayout from '@/components/board/GameBoardLayout.vue'
import EngineEval from '@/components/analysis/EngineEval.vue'
import MoveInput from '@/components/analysis/MoveInput.vue'
import PieceToolbox from '@/components/piece/PieceToolbox.vue'
import Button from '@/components/ui/Button.vue'
import ButtonGroup from '@/components/ui/ButtonGroup.vue'
import { useBoardStore } from '@/stores/boardStore'
import { useGameStore } from '@/stores/gameStore'
import { useAnimationStore } from '@/stores/animationStore'
import { useGameCallbacks } from '@/hooks/useGameCallbacks'
import { computerTurn } from '@/helpers/turn'
import { pickBestEngineContinuation } from '@/helpers/ai'
import { determineGameResult } from '@/helpers/gameOver'
import { indexToRowCol } from '@/helpers/board'
import { sleep } from '@/helpers/utils'
import type { Move, Player } from '@/types'

const MOVE_ANIMATION_MS = 500

const boardStore = useBoardStore()
const { board } = storeToRefs(boardStore)
const gameStore = useGameStore()
const { setAnimating, setAnimatingMove } = useAnimationStore()
const { moveCallback, turnOverCallback, gameOverCallback } = useGameCallbacks()
const { humanPlayerColor, currentPlayer, queenMovesWithoutCaptureStreak, gamePhase } =
  storeToRefs(gameStore)

const selectedPlayerColor = ref<Player>('white')
const bestMoves = ref<Move[] | null>(null)
const isBestMoveLoading = ref(false)

function indexToAlgebraic(index: number): string {
  const { row, col } = indexToRowCol(index)
  return `${String.fromCharCode(97 + col)}${8 - row}`
}

const formattedBestMove = computed<string | null>(() => {
  if (!bestMoves.value || bestMoves.value.length === 0) return null
  const squares = [bestMoves.value[0].fromIndex, ...bestMoves.value.map(move => move.toIndex)]
  return squares.map(indexToAlgebraic).join('->')
})

function startGame() {
  gameStore.chooseColor(selectedPlayerColor.value)
  gameStore.setGamePhase('game')
}

onMounted(() => {
  gameStore.resetToDefault()
})

watch(
  [gamePhase, currentPlayer],
  async () => {
    if (
      gamePhase.value === 'game' &&
      humanPlayerColor.value !== null &&
      humanPlayerColor.value !== currentPlayer.value
    ) {
      bestMoves.value = null
      await sleep(100)
      setAnimating(true)
      try {
        await computerTurn(boardStore.board, currentPlayer.value, queenMovesWithoutCaptureStreak.value, {
          gameOverCallback,
          moveCallback,
          turnOverCallback,
          movePickingStrategy: pickBestEngineContinuation,
          beforeMoveCallback: async (move: Move) => {
            setAnimatingMove(move)
            await sleep(MOVE_ANIMATION_MS)
          },
          afterMoveCallback: () => {
            setAnimatingMove(null)
          },
        })
      } finally {
        setAnimating(false)
      }
    }
  },
  { immediate: true },
)

watch(
  [gamePhase, currentPlayer],
  () => {
    if (
      gamePhase.value === 'game' &&
      humanPlayerColor.value !== null &&
      humanPlayerColor.value === currentPlayer.value
    ) {
      const result = determineGameResult(boardStore.board, currentPlayer.value, queenMovesWithoutCaptureStreak.value)
      if (result) {
        gameOverCallback(result)
      }
    }
  },
)

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
        bestMoves.value = await pickBestEngineContinuation(board.value, currentPlayer.value)
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
  <div class="free-play-page">
    <div class="free-play-page__board-col">
      <template v-if="gamePhase === 'color'">
        <Board context="analysis" />
      </template>
      <template v-else>
        <GameBoardLayout context="game" />
      </template>
    </div>

    <aside class="free-play-page__side">
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
                :class="{ 'button--selected': selectedPlayerColor === 'white' }"
                @click="selectedPlayerColor = 'white'"
              >
                white
              </Button>
              <Button
                color-variant="black"
                button-type="color"
                :class="{ 'button--selected': selectedPlayerColor === 'black' }"
                @click="selectedPlayerColor = 'black'"
              >
                black
              </Button>
            </ButtonGroup>
          </div>
          <Button button-type="game" @click="startGame">start</Button>
        </div>
        <div class="free-play-page__toolbox-col">
          <PieceToolbox />
        </div>
      </template>

      <template v-else>
        <div class="free-play-page__eval-col">
          <EngineEval />
          <div
            v-if="gamePhase === 'game' && humanPlayerColor === currentPlayer"
            class="best-move-hint"
            :class="{ 'best-move-hint--loading': isBestMoveLoading }"
          >
            <span class="best-move-hint__label">hint</span>
            <span class="best-move-hint__move">
              {{ formattedBestMove ?? '...' }}
            </span>
          </div>
        </div>
      </template>
    </aside>
  </div>
</template>

<style lang="scss" scoped>
.free-play-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: inherit;
  width: 100%;
  box-sizing: border-box;
}

.free-play-page__board-col {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
}

.free-play-page__side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

.setup-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;

  &__section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
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

.free-play-page__eval-col {
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
  align-items: center;
  gap: 0.3rem;
  transition: opacity 0.2s;

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
    font-family: monospace;
    font-size: 1.1rem;
    font-weight: bold;
    padding: 4px 10px;
    background: #f0f0f0;
    border-radius: 4px;
    border: 1px solid #ddd;
    letter-spacing: 0.04em;
  }
}

.button--selected {
  outline: 3px solid $clickedColor;
  outline-offset: 2px;
}

@media (min-width: $breakpoint) {
  .free-play-page {
    flex: 1;
    flex-direction: row;
    align-items: flex-start;
  }

  .free-play-page__board-col {
    flex: 1;
    justify-content: center;
    min-width: 0;
  }

  .free-play-page__side {
    flex-shrink: 0;
    flex-direction: row;
    align-items: flex-start;
    gap: 1.5rem;
    width: auto;
  }

  .free-play-page__eval-col {
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

  .free-play-page__toolbox-col {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
