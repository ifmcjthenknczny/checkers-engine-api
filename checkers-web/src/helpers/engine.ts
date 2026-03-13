import type { BoardPosition, ModelLevel, Player } from '@/types'

type EvaluationResponse = {
  status: 'success'
  evaluation: number
}

export const evaluateBoard = async (
  board: BoardPosition,
  playerToMove: Player,
  modelLevel: ModelLevel = 2
): Promise<number> => {
  const baseUrl =
  useRuntimeConfig().public.engineApiUrl ??
    (typeof import.meta !== 'undefined' && import.meta.env?.NUXT_PUBLIC_ENGINE_API_URL) ??
    ''
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/engine/eval/${modelLevel}` : `/api/engine/eval/${modelLevel}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      board,
      move: playerToMove,
    }),
  })

  const data: EvaluationResponse = await response.json()
  return data.evaluation ?? 0
}