import { writeFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { BoardPosition, GameResult, Move, Player, ScrapeModelLevel } from '~/types'
import { STARTING_BOARD_STATE, isQueen } from '~/helpers/board'
import { applyMove } from '~/helpers/move'
import { determineGameResult } from '~/helpers/gameOver'
import { pickRandomContinuation } from '~/helpers/ai'
import { evaluateBoardDeeply, pickBestContinuationWithDepth } from './eval'
import { ensureModelLoaded } from './model'
import { logTotalProgress } from './log'
import { SCRAPE_CONFIG } from '~/config'

type JsonGameResult = -1 | 0 | 1
type JsonPlayerMove = 1 | -1

export type TurnRecord = {
  board: BoardPosition
  move: JsonPlayerMove
  eval?: number
}

export type GameData = (TurnRecord & {result: JsonGameResult})[]

const MAX_TURNS = 300
const EVAL_DECIMALS = 6

function roundEval(value: number): number {
  return Math.round(value * 10 ** EVAL_DECIMALS) / 10 ** EVAL_DECIMALS
}

const mapResultToJson = (result: GameResult): JsonGameResult => {
  if (result === 'white') {
    return 1
  }
  if (result === 'black') {
    return -1
  }
  return 0
}

function mapGameDataToJson(turns: TurnRecord[], result: GameResult): GameData {
  return turns.map(turn => ({...turn, result: mapResultToJson(result)}))
}

function shouldSaveMove(moveNumber: number): boolean {
  const turn = Math.floor(moveNumber / 2);
  const min = 0.1;
  const max = 1;
  const midpoint = 10;
  const steepness = 0.3;
  const sigmoid = 1 / (1 + Math.exp(-steepness * (turn - midpoint)));
  return min + (max - min) * sigmoid > Math.random();
}

const shouldRandomizeMove = (randomCoefficient: number, moveNumber: number, turnFlatpoint = 6): boolean => {
  const turn = Math.floor(moveNumber / 2);
  if (turn > turnFlatpoint) {
    return randomCoefficient > Math.random();
  }
  const slope = (1 - randomCoefficient) / turnFlatpoint;
  const probability = 1 - slope * turn;

  return probability > Math.random();
};

export async function playGame(modelLevel: ScrapeModelLevel, randomCoefficient: number, depth: number = 0): Promise<GameData> {
  const config = useRuntimeConfig()
  if (modelLevel) {
    await ensureModelLoaded(modelLevel, config.modelsPath)
  } else {
    randomCoefficient = 1
  }

  let board: BoardPosition = [...STARTING_BOARD_STATE]
  let currentPlayer: Player = 'white'
  let queenMovesWithoutCaptureStreak = 0
  const turns: TurnRecord[] = []

  for (let moveNumber = 0; moveNumber < MAX_TURNS; moveNumber++) {
    const gameResult = determineGameResult(board, currentPlayer, queenMovesWithoutCaptureStreak)
    if (gameResult) {
      return mapGameDataToJson(turns, gameResult)
    }

    const continuation: { moves: Move[], score?: number } = (!modelLevel || shouldRandomizeMove(randomCoefficient, moveNumber)) ? { moves: pickRandomContinuation(board, currentPlayer) } : await pickBestContinuationWithDepth(board, currentPlayer, depth)

    if (continuation.moves.length === 0) {
      const winner = currentPlayer === 'white' ? 'black' : 'white'
      return mapGameDataToJson(turns, winner)
    }

    for (const move of continuation.moves) {
      board = applyMove(board, move).boardAfter
      if (!move.isCapture && isQueen(board[move.toIndex])) {
        queenMovesWithoutCaptureStreak++
      } else {
        queenMovesWithoutCaptureStreak = 0
      }
    }

    currentPlayer = currentPlayer === 'white' ? 'black' : 'white'

    const shouldSave = shouldSaveMove(moveNumber);
    if (shouldSave) {
      turns.push({
        board: [...board],
        move: currentPlayer === 'white' ? 1 : -1,
        ...(modelLevel ? { eval: roundEval(continuation.score ?? await evaluateBoardDeeply(board, currentPlayer, depth)) } : {}),
      })
    }
  }
  return mapGameDataToJson(turns, 'draw')
}

export async function playGames(
  count: number,
  modelLevel: ScrapeModelLevel,
  randomCoefficient: number,
  depth: number,
  outputPath: string,
  onGameComplete?: (written: boolean) => void,
): Promise<string> {
  mkdirSync(dirname(outputPath), { recursive: true })

  const outputFile = outputPath
  writeFileSync(outputFile, '[', 'utf8')

  let gamesWritten = 0
  let gamesFlushed = 0
  let pendingGames: string[] = []
  const startTime = Date.now()

  const flushPending = (): void => {
    if (pendingGames.length === 0) return
    const prefix = gamesFlushed > 0 ? ',' : ''
    appendFileSync(outputFile, `${prefix}${pendingGames.join(',')}`, 'utf8')
    gamesFlushed += pendingGames.length
    pendingGames = []
  }

  try {
    for (let i = 0; i < count; i++) {
      let written = false
      try {
        const gameData = await playGame(modelLevel, randomCoefficient, depth)
        const entry = JSON.stringify(gameData).slice(1, -1)
        pendingGames.push(entry)
        gamesWritten++
        written = true

        if (gamesWritten % SCRAPE_CONFIG.gameSaveBatchSize === 0) {
          flushPending()
        }
      } catch (error) {
        console.error(`[scrape] Game ${i + 1} failed:`, error)
      }

      const completed = i + 1;
      const shouldLog = (
        completed === 1 ||
        completed % SCRAPE_CONFIG.progressLogEveryCompletedGames === 0 ||
        completed === count
      )

      if (onGameComplete) {
        onGameComplete(written)
      } else if (shouldLog) {
        await logTotalProgress({
          completed: i + 1,
          total: count,
          startTime,
          mode: 'line',
        })
      }
    }
  } finally {
    flushPending()
    appendFileSync(outputFile, ']', 'utf8')
  }

  if (!onGameComplete) {
    const totalSec = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[scrape] ${gamesWritten}/${count} games completed in ${totalSec}s. Output: ${outputFile}`)
  }
  return outputFile
}
