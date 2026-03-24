import { MODEL_LEVELS, type ModelLevel } from "./types"

export const BOARD_SIZE = 8


export const SCRAPE_CONFIG = {
    maxGames: 100_000,
    logEvery: 100
}

export const DEPTH_CONFIG = {
    analysisDefault: 4,
    opponentDefault: 4,
    max: 20
}

export const PRUNE_CONFIG = {
    delta: 0.4,
    maxBestContinuations: 6
  }

export const MODEL_CONFIG: Record<string, ModelLevel> = {
    default: MODEL_LEVELS.at(-1)!,
    analysis: MODEL_LEVELS.at(-1)!,
    opponent: MODEL_LEVELS.at(-1)!,
}