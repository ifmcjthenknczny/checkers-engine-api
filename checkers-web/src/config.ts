import { MODEL_LEVELS, type ModelLevel } from "./types"

export const BOARD_SIZE = 8

export const SCRAPE_LOG_EVERY_GAMES = 100

export const DEFAULT_ANALYSIS_DEPTH = 4
export const DEFAULT_OPPONENT_DEPTH = 6
export const DEFAULT_MODEL_LEVEL: ModelLevel = MODEL_LEVELS.at(-1)!