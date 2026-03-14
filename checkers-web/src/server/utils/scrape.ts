import { writeFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { BoardPosition, GameResult, Move, Player, ScrapeModelLevel } from '~/types'
import { STARTING_BOARD_STATE, isQueen } from '~/helpers/board'
import { applyMove } from '~/helpers/move'
import { determineGameResult } from '~/helpers/gameOver'
import { pickBestEngineContinuation, pickRandomContinuation } from '~/helpers/ai'
import { loadModel, evaluateBoardRaw } from './model'

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
  const midpoint = 12;
  const steepness = 0.3;
  const sigmoid = 1 / (1 + Math.exp(-steepness * (turn - midpoint)));
  return min + (max - min) * sigmoid > Math.random();
}

const shouldRandomizeMove = (randomCoefficient: number, moveNumber: number): boolean => {
  const turnFlatpoint = 5;
  const turn = Math.floor(moveNumber / 2);
  if (turn > turnFlatpoint) {
    return randomCoefficient > Math.random();
  }
  const slope = (1 - randomCoefficient) / turnFlatpoint;
  const probability = -slope * turn + 1;

  return probability > Math.random();
};

export async function playGame(modelLevel: ScrapeModelLevel, randomCoefficient: number, depth: number = 0): Promise<GameData> {
  const config = useRuntimeConfig()
  if (modelLevel) {
    await loadModel(modelLevel, config.modelsPath)
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

    let moves: Move[]
    if (!modelLevel || shouldRandomizeMove(randomCoefficient, moveNumber)) {
      moves = pickRandomContinuation(board, currentPlayer)
    } else {
      moves = await pickBestEngineContinuation(board, currentPlayer, undefined, depth)
    }

    if (moves.length === 0) {
      return mapGameDataToJson(turns, currentPlayer === 'white' ? 'black' : 'white')
    }

    for (const move of moves) {
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
        ...(modelLevel ? { eval: roundEval(await evaluateBoardRaw(board, currentPlayer)) } : {}),
      })
    }
  }
  return mapGameDataToJson(turns, 'draw')
}

export async function playGames(count: number, modelLevel: ScrapeModelLevel, randomCoefficient: number, depth: number = 0): Promise<string> {
  const dataDir = join(process.cwd(), '../data')
  mkdirSync(dataDir, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputFile = join(dataDir, `games_${timestamp}.json`)

  writeFileSync(outputFile, '[', 'utf8')

  let gamesWritten = 0
  const startTime = Date.now()
  let lastLoggedPct = -1

  try {
    for (let i = 0; i < count; i++) {
      try {
        const gameData = await playGame(modelLevel, randomCoefficient, depth)
        const prefix = gamesWritten > 0 ? ',' : ''
        appendFileSync(outputFile, `${prefix}${JSON.stringify(gameData).slice(1, -1)}`, 'utf8')
        gamesWritten++
      } catch (error) {
        console.error(`[scrape] Game ${i + 1} failed:`, error)
      }

      const pct = Math.floor(((i + 1) / count) * 100)
      if (pct > lastLoggedPct) {
        lastLoggedPct = pct
        const elapsedMs = Date.now() - startTime
        const avgPerGame =
          gamesWritten > 0 ? (elapsedMs / gamesWritten / 1000).toFixed(4) : '—'
        console.log(
          `[scrape] ${pct}% — ${i + 1}/${count} games, ${gamesWritten} written, avg. ${avgPerGame} s/game`,
        )
      }
    }
  } finally {
    appendFileSync(outputFile, ']', 'utf8')
  }

  const totalSec = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`[scrape] ${gamesWritten}/${count} games completed in ${totalSec}s. Output: ${outputFile}`)
  return outputFile
}
