import type { BoardPosition, Player } from "@/types"

type EvaluationResponse = {
    status: 'success'
    evaluation: number
  }

export const evaluateBoard = async (board: BoardPosition, playerToMove: Player): Promise<number> => {
    const response = await fetch(`${import.meta.env.VITE_BASE_ENGINE_API_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // wrongly trained model expects reversed board, to be fixed in next model generation
        board: board.toReversed(),
        move: playerToMove === 'white' ? 1 : -1,
      }),
    })

    const data: EvaluationResponse = await response.json()
    return data.evaluation || 0
}