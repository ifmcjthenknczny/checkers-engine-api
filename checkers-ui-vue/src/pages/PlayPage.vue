<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { BOARD_SIZE } from '@/config'
import type { BoardPosition, PieceColor, Player, SquareContent } from '@/types'
import {
  getSquareIndex,
  isWhiteSquare,
  isQueen,
  getPieceColor,
} from '@/helpers/board'
import {
  findAllLegalMoves,
  findLegalCapturesOfPiece,
  findQueenChainedCaptureForbiddenDirection,
  findCapturedPieceIndex,
  applyMove,
} from '@/helpers/move'
import { shouldPromotePiece, applyPromotion } from '@/helpers/promotion'
import { determineWinner } from '@/helpers/gameOver'
import { range, rangeChar, sleep } from '@/helpers/utils'
import { pickAMove } from '@/helpers/ai'
import { getStartingBoardState } from '@/stores/boardStore'

// --- Phase: color choice vs game
const phase = ref<'color' | 'game'>('color')

// --- Color choice
const playWhite = ref(true)
const whitesOnBottom = ref(true)

// --- Game state
const board = ref<BoardPosition>(getStartingBoardState())
const whiteMove = ref(true)
const turn = ref(1)
const chainedCapturePiece = ref<number | null>(null)
const queenCaptureForbiddenDirection = ref<[boolean | null, boolean | null]>([
  null,
  null,
])
const onlyQueenMovesWithoutCapture = ref(0)
const selectedPieceIndex = ref<number | null>(null)
const flipBoardBlock = ref(false)

// Graveyards: count by type for display
const capturedWhite = ref({ pawn: 0, queen: 0 })
const capturedBlack = ref({ pawn: 0, queen: 0 })

const gameOverWinner = ref<PieceColor | null>(null)

// --- Derived
const currentPlayerColor = computed((): Player =>
  whiteMove.value ? 'white' : 'black',
)
const legalMovesMap = computed(() =>
  findAllLegalMoves(
    board.value,
    currentPlayerColor.value,
    queenCaptureForbiddenDirection.value,
    chainedCapturePiece.value,
  ),
)
const isComputerTurn = computed(
  () =>
    (playWhite.value && !whiteMove.value) || (!playWhite.value && whiteMove.value),
)

// Display: row order depends on board flip
const displayRowIndices = computed(() =>
  whitesOnBottom.value ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0],
)
const cols = rangeChar(BOARD_SIZE, 'a')
const rowLabels = range(BOARD_SIZE, 1)

// Legal targets for selected piece (for highlighting)
const legalTargetsForSelected = computed(() => {
  const sel = selectedPieceIndex.value
  if (sel === null) return []
  return legalMovesMap.value[sel] ?? []
})

// Which pieces can move (for highlighting when no piece selected)
const pieceIndicesThatCanMove = computed(() => Object.keys(legalMovesMap.value).map(Number))

// --- Actions
function chooseColor(asWhite: boolean) {
  playWhite.value = asWhite
  whitesOnBottom.value = asWhite
  phase.value = 'game'
  resetGameState()
}

function resetGameState() {
  board.value = getStartingBoardState()
  whiteMove.value = true
  turn.value = 1
  chainedCapturePiece.value = null
  queenCaptureForbiddenDirection.value = [null, null]
  onlyQueenMovesWithoutCapture.value = 0
  selectedPieceIndex.value = null
  flipBoardBlock.value = false
  capturedWhite.value = { pawn: 0, queen: 0 }
  capturedBlack.value = { pawn: 0, queen: 0 }
  gameOverWinner.value = null
}

function goToColorChoice() {
  phase.value = 'color'
}

function flipBoard() {
  if (flipBoardBlock.value) return
  const boardElements = displayRowIndices.value.flatMap((rowIndex) =>
    range(BOARD_SIZE, 0).map((colIndex) => ({
      rowIndex,
      colIndex,
      index: getSquareIndex(rowIndex, colIndex),
    })),
  )
  const state = boardElements.map(({ index }) => board.value[index])
  state.reverse()
  whitesOnBottom.value = !whitesOnBottom.value
  const newBoard = [...board.value]
  state.forEach((v, i) => {
    newBoard[i] = v ?? 0
  })
  board.value = newBoard as BoardPosition
}

function setQueenVariables(pieceIndex: number, toIndex: number) {
  const piece = board.value[pieceIndex] ?? 0
  const isQueenPiece = isQueen(piece)
  const wasCapture =
    findCapturedPieceIndex(
      board.value,
      pieceIndex,
      toIndex,
      currentPlayerColor.value,
    ) !== undefined
  if (isQueenPiece && !wasCapture) {
    onlyQueenMovesWithoutCapture.value += 1
  } else {
    onlyQueenMovesWithoutCapture.value = 0
  }
  if (isQueenPiece && wasCapture) {
    queenCaptureForbiddenDirection.value =
      findQueenChainedCaptureForbiddenDirection(pieceIndex, toIndex)
  } else {
    queenCaptureForbiddenDirection.value = [null, null]
  }
}

function addToGraveyard(piece: SquareContent) {
  const isWhite = piece > 0
  const queen = isQueen(piece)
  if (isWhite) {
    if (queen) capturedWhite.value.queen += 1
    else capturedWhite.value.pawn += 1
  } else {
    if (queen) capturedBlack.value.queen += 1
    else capturedBlack.value.pawn += 1
  }
}

function makeMove(fromIndex: number, toIndex: number) {
  const captureIndex = findCapturedPieceIndex(
    board.value,
    fromIndex,
    toIndex,
    currentPlayerColor.value,
  )
  if (captureIndex !== undefined) {
    const piece = board.value[captureIndex]
    if (piece) addToGraveyard(piece)
  }
  board.value = applyMove(board.value, fromIndex, toIndex, captureIndex)
  if (shouldPromotePiece(board.value, toIndex, board.value[toIndex]!)) {
    board.value = applyPromotion(board.value, toIndex)
  }
  setQueenVariables(fromIndex, toIndex)
}

function endTurn() {
  whiteMove.value = !whiteMove.value
  chainedCapturePiece.value = null
  queenCaptureForbiddenDirection.value = [null, null]
  selectedPieceIndex.value = null
  const winner = determineWinner(board.value, currentPlayerColor.value)
  if (winner !== null) {
    gameOverWinner.value = winner
    return
  }
  turn.value = whiteMove.value ? turn.value + 1 : turn.value
  if (isComputerTurn.value) {
    scheduleComputerMove()
  }
}

// --- Player interaction
function onSquareClick(squareIndex: number) {
  if (gameOverWinner.value !== null || isComputerTurn.value) return
  const piece = board.value[squareIndex] ?? 0
  const isPlayerPiece =
    piece !== 0 &&
    ((playWhite.value && piece > 0) || (!playWhite.value && piece < 0))

  if (chainedCapturePiece.value !== null) {
    // Must continue with the chained piece
    if (squareIndex === chainedCapturePiece.value) return
    const targets = legalMovesMap.value[chainedCapturePiece.value] ?? []
    if (targets.includes(squareIndex)) {
      applyPlayerMove(chainedCapturePiece.value, squareIndex)
    }
    return
  }

  if (selectedPieceIndex.value !== null) {
    const targets = legalMovesMap.value[selectedPieceIndex.value] ?? []
    if (targets.includes(squareIndex)) {
      applyPlayerMove(selectedPieceIndex.value, squareIndex)
      return
    }
    if (isPlayerPiece) {
      selectedPieceIndex.value = squareIndex
      return
    }
    selectedPieceIndex.value = null
    return
  }

  if (isPlayerPiece) {
    const targets = legalMovesMap.value[squareIndex] ?? []
    if (targets.length > 0) {
      selectedPieceIndex.value = squareIndex
    }
  }
}

function applyPlayerMove(fromIndex: number, toIndex: number) {
  const captureIndex = findCapturedPieceIndex(
    board.value,
    fromIndex,
    toIndex,
    currentPlayerColor.value,
  )
  if (captureIndex !== undefined) {
    const piece = board.value[captureIndex]
    if (piece) addToGraveyard(piece)
  }
  board.value = applyMove(board.value, fromIndex, toIndex, captureIndex)
  if (shouldPromotePiece(board.value, toIndex, board.value[toIndex]!)) {
    board.value = applyPromotion(board.value, toIndex)
  }
  setQueenVariables(fromIndex, toIndex)
  selectedPieceIndex.value = null

  const nextCaptures = findLegalCapturesOfPiece(
    board.value,
    toIndex,
    queenCaptureForbiddenDirection.value,
  )
  if (nextCaptures.length > 0) {
    chainedCapturePiece.value = toIndex
    return
  }
  endTurn()
}

const MOVE_ANIMATION_MS = 600

function scheduleComputerMove() {
  setTimeout(() => doComputerMove(), 400)
}

async function doComputerMove() {
  if (gameOverWinner.value !== null || !isComputerTurn.value) return
  const move = pickAMove(
    board.value,
    currentPlayerColor.value,
    queenCaptureForbiddenDirection.value,
    chainedCapturePiece.value,
  )
  if (move === null) {
    endTurn()
    return
  }
  const { fromIndex: pieceIndex, toIndex } = move
  makeMove(pieceIndex, toIndex)
  await sleep(MOVE_ANIMATION_MS)

  const nextCaptures = findLegalCapturesOfPiece(
    board.value,
    toIndex,
    queenCaptureForbiddenDirection.value,
  )
  if (nextCaptures.length > 0) {
    chainedCapturePiece.value = toIndex
    doComputerMove()
  } else {
    endTurn()
  }
}

// When game starts and computer plays white, run first computer move
watch(
  [phase, playWhite],
  () => {
    if (phase.value === 'game' && !playWhite.value) {
      scheduleComputerMove()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="play-page">
    <!-- Color choice -->
    <div v-if="phase === 'color'" class="container">
      <section class="question">choose your color</section>
      <section class="button-container button-container--question">
        <button
          type="button"
          class="button button--white button--color"
          @click="chooseColor(true)"
        >
          white
        </button>
        <button
          type="button"
          class="button button--black button--color"
          @click="chooseColor(false)"
        >
          black
        </button>
      </section>
    </div>

    <!-- Game -->
    <template v-if="phase === 'game'">
      <section class="game-info">
        <section class="game-info__who-to-move">
          <span :class="whiteMove ? 'white' : ''">{{
            whiteMove ? 'White' : 'Black'
          }}</span> to move
        </section>
        <section class="game-info__turn-counter">
          Turn: <span>{{ turn }}</span>
        </section>
      </section>

      <section class="captured-pieces captured-pieces--top">
        <div
          v-for="n in (whitesOnBottom ? capturedBlack : capturedWhite).queen"
          :key="'t-q-' + n"
          :class="[
            'mini-piece',
            'mini-piece--queen',
            whitesOnBottom ? 'mini-piece--black' : 'mini-piece--white',
          ]"
        />
        <div
          v-for="n in (whitesOnBottom ? capturedBlack : capturedWhite).pawn"
          :key="'t-p-' + n"
          :class="[
            'mini-piece',
            whitesOnBottom ? 'mini-piece--black' : 'mini-piece--white',
          ]"
        />
      </section>

      <section
        class="board"
        :style="{
          display: 'grid',
          gridTemplateColumns: `0.2fr repeat(${BOARD_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr) 0.2fr`,
        }"
      >
        <template
          v-for="(displayRow) in displayRowIndices"
          :key="'row-' + displayRow"
        >
          <div class="grid__square--name-row grid__square--name">
            {{ rowLabels[displayRow] }}
          </div>
          <div
            v-for="(colName, colIndex) in cols"
            :key="`${colName}-${displayRow}`"
            :class="[
              'grid__square',
              isWhiteSquare(displayRow, colIndex)
                ? 'grid__square--white'
                : 'grid__square--black',
              {
                'legal-move': legalTargetsForSelected.includes(
                  getSquareIndex(displayRow, colIndex),
                ),
              },
            ]"
            @click="onSquareClick(getSquareIndex(displayRow, colIndex))"
          >
            <div
              v-if="
                !isWhiteSquare(displayRow, colIndex) &&
                board[getSquareIndex(displayRow, colIndex)] !== 0
              "
              :class="[
                'piece',
                'piece--' +
                  (getPieceColor(
                    board[getSquareIndex(displayRow, colIndex)],
                  ) ?? ''),
                {
                  'piece--can-move':
                    pieceIndicesThatCanMove.includes(
                      getSquareIndex(displayRow, colIndex),
                    ) && selectedPieceIndex === null,
                },
                {
                  'piece-hover':
                    selectedPieceIndex === getSquareIndex(displayRow, colIndex),
                },
              ]"
              :id="
                selectedPieceIndex === getSquareIndex(displayRow, colIndex)
                  ? 'piece-clicked'
                  : undefined
              "
            >
              <div
                v-if="
                  isQueen(board[getSquareIndex(displayRow, colIndex)])
                "
                class="piece--queen-decoration"
              />
            </div>
          </div>
        </template>
        <div></div>
        <div
          v-for="colName in cols"
          :key="'col-' + colName"
          class="grid__square--name-col grid__square--name"
        >
          {{ colName }}
        </div>
      </section>

      <section class="captured-pieces captured-pieces--bottom">
        <div
          v-for="n in (whitesOnBottom ? capturedWhite : capturedBlack).queen"
          :key="'b-q-' + n"
          :class="[
            'mini-piece',
            'mini-piece--queen',
            whitesOnBottom ? 'mini-piece--white' : 'mini-piece--black',
          ]"
        />
        <div
          v-for="n in (whitesOnBottom ? capturedWhite : capturedBlack).pawn"
          :key="'b-p-' + n"
          :class="[
            'mini-piece',
            whitesOnBottom ? 'mini-piece--white' : 'mini-piece--black',
          ]"
        />
      </section>

      <section class="button-container button-container--game">
        <button
          type="button"
          class="button button--reset button--game"
          @click="goToColorChoice(); resetGameState()"
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
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';

.play-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;

  .captured-pieces {
    height: $minipieceSize;
    margin: $minipieceSize;
    display: flex;
    flex-flow: row;
  }

  .mini-piece {
    width: $minipieceSize;
    height: $minipieceSize;
    border-radius: 50%;
    border: 0.6px solid black;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 1px;

    &--white {
      background-color: white;
    }

    &--black {
      background-color: black;
      border-color: grey;
    }

    &--queen {
      background-color: color.mix(darkgrey, black);
    }
  }

  .legal-move {
    width: calc($pieceSize / 2);
    height: calc($pieceSize / 2);
    border-radius: 50%;
    background-color: color.mix(aqua, violet);
    border: 1.5px solid black;
  }

  .game-info {
    display: flex;
    flex-direction: row;
    justify-content: end;
    text-transform: uppercase;
    font-weight: 550;
    width: $boardSizeHorizontal;
    font-size: 1rem;

    &__turn-counter span {
      font-weight: 700;
    }

    &__who-to-move {
      margin-right: auto;
      margin-left: $nameSquareSizeHorizontal;

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

  .button {
    font-family: 'Source Sans Pro', sans-serif;
    font-size: 1rem;
    transition: 0.5s;
    height: 50px;
    width: 150px;
    background-color: color.mix(white, lightgrey);
    text-transform: uppercase;
    font-weight: 550;
    border: 1.5px solid black;

    &--game {
      margin-top: calc($minipieceSize / 2);
      border-radius: 12px;
      font-weight: 650;
      font-size: 22px;

      &:hover,
      &:active {
        background-color: $clickedColor;
        color: white;
      }
    }

    &--color {
      font-size: 1.6rem;
      margin-top: 60px;
      width: 200px;
      height: 75px;
    }

    &--white:hover,
    &--white:active {
      background-color: white;
      font-weight: 900;
      box-shadow: 0 0 40px 9px #808080;
      font-size: 1.8rem;
    }

    &--black:hover,
    &--black:active {
      background-color: black;
      font-weight: 900;
      color: white;
      box-shadow: 0 0 40px 9px #606060;
      font-size: 1.8rem;
    }
  }

  .button-container {
    display: flex;
    flex-flow: row;

    &--question {
      font-family: $secondaryFont;
      justify-content: space-between;
    }

    &--game {
      width: $boardSizeHorizontal;
      justify-content: space-around;
    }
  }
}

@media (max-width: 700px) {
  .play-page {
    .legal-move {
      border-width: 1.2px;
    }

    .game-info {
      width: $boardSizeVertical;
      font-size: 1.4rem;

      &__who-to-move {
        margin-left: $nameSquareSizeVertical;
      }
    }

    .button {
      &--color {
        width: 30vw;
        height: 45px;
      }

      &--white {
        background-color: white;
        font-weight: 900;
        font-size: 1.8rem;
      }

      &--black {
        background-color: black;
        font-weight: 900;
        color: white;
        font-size: 1.8rem;
      }

      &--game {
        width: 100px;
        height: 40px;
        font-size: 16px;
        border-radius: 8px;
        color: black;
      }

      &--flip {
        font-size: 12px;
      }
    }

    .button-container--game {
      width: $boardSizeVertical;
    }
  }
}
</style>
