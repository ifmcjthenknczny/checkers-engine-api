import { type Player, type BoardPosition, type Move } from '~/types'
import { applyMovesToBoard } from '~/helpers/move'

export type ShallowCandidate = { moves: Move[]; resultBoard: BoardPosition; shallowScore: number }

function shouldPruneVariant(args: {
    isMaximizing: boolean
    bestShallowScore: number
    candidateShallowScore: number
    delta: number
  }): boolean {
    if (args.isMaximizing) {
      return args.bestShallowScore - args.candidateShallowScore >= args.delta
    }
    return args.candidateShallowScore - args.bestShallowScore >= args.delta
}

export async function buildSortedShallowCandidates(
  board: BoardPosition,
  continuations: Move[][],
  evaluationPlayer: Player,
): Promise<ShallowCandidate[]> {
  const candidates = await Promise.all(
    continuations.map(async (moves) => {
      const resultBoard = applyMovesToBoard(board, moves)
      const shallowScore = await evaluateBoardShallow(resultBoard, evaluationPlayer)
      return { moves, resultBoard, shallowScore }
    }),
  )
  const isMaximizing = evaluationPlayer === 'black'
  return candidates.toSorted((a, b) => (isMaximizing ? b.shallowScore - a.shallowScore : a.shallowScore - b.shallowScore))
}

export function filterCandidatesByDelta(candidates: ShallowCandidate[], isMaximizing: boolean, delta: number): ShallowCandidate[] {
  if (candidates.length === 0) {
      return candidates
  }
  const bestShallowScore = candidates[0].shallowScore
  return candidates.filter((c) => !shouldPruneVariant({
    isMaximizing,
    bestShallowScore,
    candidateShallowScore: c.shallowScore,
    delta,
  }))
}