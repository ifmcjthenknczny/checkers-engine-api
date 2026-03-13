import type { BoardPosition, ModelLevel, Move, Player } from '../types'
import { MODEL_LEVELS } from '../types'
import { findAllLegalContinuations } from './move'
import { chooseRandomly } from './utils'

export function pickRandomContinuation(
  board: BoardPosition,
  player: Player,
): Move[] {
  const continuations = findAllLegalContinuations(board, player)
  return chooseRandomly(continuations)
}

type ContinuationResponse = {
  continuation: Move[]
}

export async function pickBestEngineContinuation(
  board: BoardPosition,
  player: Player,
  modelLevel: ModelLevel = MODEL_LEVELS.at(-1)!,
): Promise<Move[]> {
  const baseUrl =
    useRuntimeConfig().public.engineApiUrl ??
    (typeof import.meta !== 'undefined' && import.meta.env?.NUXT_PUBLIC_ENGINE_API_URL) ??
    ''
  const url = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/engine/continuation/${modelLevel}`
    : `/api/engine/continuation/${modelLevel}`

  const data = await $fetch<ContinuationResponse>(url, {
    method: 'POST',
    body: { board, move: player },
  })
  return data.continuation ?? []
}