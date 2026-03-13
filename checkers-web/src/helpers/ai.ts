import type { BoardPosition, Move, Player } from '../types'
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
): Promise<Move[]> {
  const baseUrl =
    useRuntimeConfig().public.engineApiUrl ??
    (typeof import.meta !== 'undefined' && import.meta.env?.NUXT_PUBLIC_ENGINE_API_URL) ??
    ''
  const url = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/engine/continuation`
    : '/api/engine/continuation'

  const data = await $fetch<ContinuationResponse>(url, {
    method: 'POST',
    body: { board, move: player === 'white' ? 1 : -1 },
  })
  return data.continuation ?? []
}