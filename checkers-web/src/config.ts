import { MODEL_LEVELS, type ModelLevel, type Player } from "./types"

export const BOARD_SIZE = 8


export const SCRAPE_CONFIG = {
    logEvery: 100,
    gameSaveBatchSize: 1_000,
}

export const DEPTH_CONFIG = {
    analysisDefault: 6,
    opponentDefault: 6,
    max: 20,
}

export const PRUNE_CONFIG = {
    enabled: true,
    delta: 0.2,
    maxBestContinuations: 4
  }

export const MODEL_CONFIG: Record<string, ModelLevel> = {
    analysis: MODEL_LEVELS.at(-1)!,
    opponent: MODEL_LEVELS.at(-1)!,
}

export const BEST_EVAL: Record<Player, number> = {
    white: 1,
    black: -1
}

export const NON_DETERMINISTIC_CONFIG = {
    scoreDelta: 0.02,
}