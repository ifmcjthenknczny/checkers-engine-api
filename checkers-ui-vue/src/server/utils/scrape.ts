import { writeFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { BoardPosition, GameResult, Move, Player, ScrapeModelLevel } from '~/types'
import { STARTING_BOARD_STATE, isQueen } from '~/helpers/board'
import { applyMove } from '~/helpers/move'
import { determineGameResult } from '~/helpers/gameOver'
import { pickBestContinuation, pickRandomContinuation } from '~/helpers/ai'
import { loadModel, evaluateBoardRaw } from './model'

type JsonGameResult = -1 | 0 | 1
type JsonPlayerMove = 1 | -1

export type TurnRecord = {
  board: BoardPosition
  move: JsonPlayerMove
  eval?: number
}

export type GameData = (TurnRecord & {result: JsonGameResult})[]

// TODO: modelLevel parameter
async function evaluateBoardServer(board: BoardPosition, playerToMove: Player): Promise<number> {
  return evaluateBoardRaw(board, playerToMove === 'white' ? 1 : -1)
}

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

function mapTurnDataToJson(turns: TurnRecord[], result: GameResult): GameData {
  return turns.map(turn => ({...turn, result: mapResultToJson(result)}))
}

export async function playGame(modelLevel: ScrapeModelLevel, randomCoefficient: number): Promise<GameData> {
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

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const gameResult = determineGameResult(board, currentPlayer, queenMovesWithoutCaptureStreak)
    if (gameResult) {
      return mapTurnDataToJson(turns, gameResult)
    }

    let moves: Move[]
    const shouldRandomizeMove = Math.random() < randomCoefficient
    if (!modelLevel || shouldRandomizeMove) {
      moves = pickRandomContinuation(board, currentPlayer)
    } else {
      moves = await pickBestContinuation(board, currentPlayer, evaluateBoardServer)
    }

    if (moves.length === 0) {
      return mapTurnDataToJson(turns, currentPlayer === 'white' ? 'black' : 'white')
    }

    for (const move of moves) {
      board = applyMove(board, move)
      if (!move.isCapture && isQueen(board[move.toIndex])) {
        queenMovesWithoutCaptureStreak++
      } else {
        queenMovesWithoutCaptureStreak = 0
      }
    }

    currentPlayer = currentPlayer === 'white' ? 'black' : 'white'

    turns.push({
      board: [...board],
      move: currentPlayer === 'white' ? 1 : -1,
      ...(modelLevel ? { eval: roundEval(await evaluateBoardServer(board, currentPlayer)) } : {}),
    })
  }

  return mapTurnDataToJson(turns, 'draw')
}

export async function playGames(count: number, modelLevel: ScrapeModelLevel, randomCoefficient: number): Promise<string> {
  const dataDir = join(process.cwd(), '../data')
  mkdirSync(dataDir, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputFile = join(dataDir, `games_${timestamp}.json`)

  writeFileSync(outputFile, '[', 'utf8')

  let gamesWritten = 0
  const startTime = Date.now()

  try {
    for (let i = 0; i < count; i++) {
      const elapsedMs = Date.now() - startTime
      const avgPerGame =
        gamesWritten > 0 ? ` (avg. ${(elapsedMs / gamesWritten / 1000).toFixed(4)} s/game)` : ''
      console.log(`[scrape] Playing game ${i + 1}/${count}${avgPerGame}...`)

      try {
        const gameData = await playGame(modelLevel, randomCoefficient)
        const prefix = gamesWritten > 0 ? ',' : ''
        appendFileSync(outputFile, `${prefix}${JSON.stringify(gameData).slice(1, -1)}`, 'utf8')
        gamesWritten++
      } catch (error) {
        console.error(`[scrape] Game ${i + 1} failed:`, error)
      }
    }
  } finally {
    appendFileSync(outputFile, ']', 'utf8')
  }

  const totalSec = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`[scrape] ${gamesWritten}/${count} games completed in ${totalSec}s. Output: ${outputFile}`)
  return outputFile
}
