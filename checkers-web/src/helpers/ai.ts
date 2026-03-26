import { type BoardPosition, type ModelLevel, type Move, type Player } from '../types'

import { findAllLegalContinuations } from './move'
import { chooseRandomly } from './utils'
import { DEPTH_CONFIG } from '~/config'

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
  depth: number = DEPTH_CONFIG.opponentDefault,
  modelLevel: ModelLevel,
): Promise<Move[]> {
  const baseUrl =
    useRuntimeConfig().public.engineApiUrl ??
    (typeof import.meta !== 'undefined' && import.meta.env?.NUXT_PUBLIC_ENGINE_API_URL) ??
    ''
  const url = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/engine/continuation/${modelLevel}`
    : `/api/engine/continuation/${modelLevel}`

  const {continuation} = await $fetch<ContinuationResponse>(url, {
    method: 'POST',
    body: { board, move: player, depth },
  })
  return continuation ?? []
}