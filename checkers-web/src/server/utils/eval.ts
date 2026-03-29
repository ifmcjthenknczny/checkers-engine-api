import * as ort from 'onnxruntime-node'
import { type Player, type BoardPosition, type Move } from '~/types'
import { findAllLegalContinuations, applyMovesToBoard } from '~/helpers/move'
import { BEST_EVAL, PRUNE_CONFIG } from '~/config'
import { session } from './model'
import { type ShallowCandidate, buildSortedShallowCandidates, filterCandidatesByDelta } from './prune'
import { otherPlayer } from '~/helpers/turn'

type JsonPlayerToMove = -1 | 1

type AlphaBetaState = { bestScore: number; alpha: number; beta: number }

function toJsonPlayerToMove(player: Player): JsonPlayerToMove {
  return player === 'white' ? 1 : -1
}

function shouldPruneByDelta(useVariantPruning: boolean, continuationsCount: number): boolean {
  return useVariantPruning && continuationsCount >= PRUNE_CONFIG.maxBestContinuations
}

function initAlphaBetaState(isMaximizing: boolean): AlphaBetaState {
  return {
    bestScore: isMaximizing ? -Infinity : Infinity,
    alpha: -Infinity,
    beta: Infinity,
  }
}

function applyAlphaBetaScore(
  state: AlphaBetaState,
  score: number,
  isMaximizing: boolean,
): { state: AlphaBetaState; shouldBreak: boolean } {
  if (isMaximizing) {
    const bestScore = Math.max(state.bestScore, score)
    const alpha = Math.max(state.alpha, bestScore)
    const nextState = { bestScore, alpha, beta: state.beta }
    return { state: nextState, shouldBreak: alpha >= nextState.beta }
  }

  const bestScore = Math.min(state.bestScore, score)
  const beta = Math.min(state.beta, bestScore)
  const nextState = { bestScore, alpha: state.alpha, beta }
  return { state: nextState, shouldBreak: nextState.alpha >= beta }
}

function applyAlphaBetaScoreNoPrune(
  state: AlphaBetaState,
  score: number,
  isMaximizing: boolean,
): { state: AlphaBetaState; shouldBreak: boolean } {
  if (isMaximizing) {
    const bestScore = Math.max(state.bestScore, score)
    const nextState = { bestScore, alpha: state.alpha, beta: state.beta }
    return { state: nextState, shouldBreak: false }
  }

  const bestScore = Math.min(state.bestScore, score)
  const nextState = { bestScore, alpha: state.alpha, beta: state.beta }
  return { state: nextState, shouldBreak: false }
}

async function buildPrunedCandidatesIfWorthIt(
  board: BoardPosition,
  continuations: Move[][],
  evaluationPlayer: Player,
  isMaximizing: boolean,
): Promise<ShallowCandidate[] | null> {

  const candidates = await buildSortedShallowCandidates(board, continuations, evaluationPlayer)
  return filterCandidatesByDelta(candidates, isMaximizing, PRUNE_CONFIG.delta).slice(0, PRUNE_CONFIG.maxBestContinuations)
}

async function buildCandidatesForRootSearch(
  board: BoardPosition,
  continuations: Move[][],
  evaluationPlayer: Player,
  isMaximizing: boolean,
  shouldPrune: boolean,
): Promise<ShallowCandidate[]> {
  const candidates = await buildSortedShallowCandidates(board, continuations, evaluationPlayer)
  const limited = candidates.slice(0, PRUNE_CONFIG.maxBestContinuations)
  return shouldPrune ? filterCandidatesByDelta(limited, isMaximizing, PRUNE_CONFIG.delta) : limited
}

export async function evaluateBoardShallow(board: BoardPosition, move: Player): Promise<number> {
  try {
    if (!session) {
      throw new Error('ONNX Session not initialized')
    }
    const combinedData = new Float32Array(33)
    combinedData.set(board)
    combinedData[32] = toJsonPlayerToMove(move)
    const tensor = new ort.Tensor('float32', combinedData, [1, 33])
    const feeds = { [session.inputNames[0]]: tensor }
    const results = await session.run(feeds)
    return (results[session.outputNames[0]] as ort.Tensor).data[0] as number
  } catch (error) {
    console.error('Evaluation failed:', error)
    throw error
  }
}

export async function evaluateBoardDeeply(
  board: BoardPosition,
  currentPlayer: Player,
  depth: number,
): Promise<number> {
  const useVariantPruning = PRUNE_CONFIG.enabled
  if (useVariantPruning) {
    return evaluateBoardDeeplyWithVariantPruning(board, currentPlayer, depth)
  }
  return evaluateBoardDeeplyWithoutAlphaBeta(board, currentPlayer, depth)
}

async function evaluateBoardDeeplyWithVariantPruning(
  board: BoardPosition,
  currentPlayer: Player,
  depth: number,
): Promise<number> {
  if (depth === 0) {
      return evaluateBoardShallow(board, currentPlayer)
  }

  const continuations = findAllLegalContinuations(board, currentPlayer)
  if (continuations.length === 0) {
    return currentPlayer === 'white' ? BEST_EVAL.black : BEST_EVAL.white
  }

  const opponent = otherPlayer(currentPlayer)
  const isMaximizing = currentPlayer === 'white'
  const useVariantPruning = PRUNE_CONFIG.enabled
  const shouldPrune = shouldPruneByDelta(useVariantPruning, continuations.length)
  let state = initAlphaBetaState(isMaximizing)
  const applyScore = useVariantPruning ? applyAlphaBetaScore : applyAlphaBetaScoreNoPrune

  if (depth === 1) {
    const candidates = await buildCandidatesForRootSearch(board, continuations, opponent, isMaximizing, shouldPrune)
    for (const candidate of candidates) {
      const {state: newState, shouldBreak} = applyScore(state, candidate.shallowScore, isMaximizing)
      state = newState
      if (shouldBreak) {
        break
      }
    }
    return state.bestScore
  }

  const candidates = shouldPrune ? await buildPrunedCandidatesIfWorthIt(board, continuations, opponent, isMaximizing) : null
  const resultBoards = candidates
    ? candidates.map((c) => c.resultBoard)
    : continuations.map((moves) => applyMovesToBoard(board, moves))

  for (const resultBoard of resultBoards) {
    const score = await evaluateBoardDeeply(resultBoard, opponent, depth - 1)
    const {state: nextState, shouldBreak} = applyScore(state, score, isMaximizing)
    state = nextState
    if (shouldBreak) {
      break
    }
  }

  return state.bestScore
}

async function evaluateBoardDeeplyWithoutAlphaBeta(
  board: BoardPosition,
  currentPlayer: Player,
  depth: number,
): Promise<number> {
  if (depth === 0) {
    return evaluateBoardShallow(board, currentPlayer)
  }

  const continuations = findAllLegalContinuations(board, currentPlayer)
  if (continuations.length === 0) {
    return currentPlayer === 'white' ? BEST_EVAL.black : BEST_EVAL.white
  }

  const opponent = otherPlayer(currentPlayer)
  const isMaximizing = currentPlayer === 'white'

  if (depth === 1) {
    const candidates = await buildCandidatesForRootSearch(board, continuations, opponent, isMaximizing, false)
    let bestScore = isMaximizing ? -Infinity : Infinity
    for (const candidate of candidates) {
      bestScore = isMaximizing ? Math.max(bestScore, candidate.shallowScore) : Math.min(bestScore, candidate.shallowScore)
    }
    return bestScore
  }

  let bestScore = isMaximizing ? -Infinity : Infinity
  for (const moves of continuations) {
    const resultBoard = applyMovesToBoard(board, moves)
    const score = await evaluateBoardDeeply(resultBoard, opponent, depth - 1)
    bestScore = isMaximizing ? Math.max(bestScore, score) : Math.min(bestScore, score)
  }
  return bestScore
}

export async function pickBestContinuationWithDepth(
  board: BoardPosition,
  player: Player,
  depth: number,
): Promise<{moves: Move[], score: number}> {
  const continuations = findAllLegalContinuations(board, player)
  if (continuations.length === 0) {
    return { moves: [], score: player === 'white' ? BEST_EVAL.black : BEST_EVAL.white }
  }

  const opponent = otherPlayer(player)
  const isMaximizing = player === 'white'
  const useVariantPruning = PRUNE_CONFIG.enabled

  let candidates = await buildSortedShallowCandidates(board, continuations, opponent)

  const shouldPrune = shouldPruneByDelta(useVariantPruning, continuations.length)

  if (shouldPrune) {
    candidates = filterCandidatesByDelta(candidates, isMaximizing, PRUNE_CONFIG.delta).slice(0, PRUNE_CONFIG.maxBestContinuations)
  }

  const bestCandidate = candidates[0]
  if (depth <= 1) {
    return { moves: bestCandidate.moves, score: bestCandidate.shallowScore }
  }

  let bestMoves: Move[] = bestCandidate.moves

  let state = initAlphaBetaState(isMaximizing)
  const applyScore = useVariantPruning  ? applyAlphaBetaScore : applyAlphaBetaScoreNoPrune

  for (const candidate of candidates) {
    const score = await evaluateBoardDeeply(
      candidate.resultBoard,
      opponent,
      depth - 1,
    )

    if (isMaximizing ? score > state.bestScore : score < state.bestScore) {
      bestMoves = candidate.moves
    }

    const { state: nextState, shouldBreak } = applyScore(state, score, isMaximizing)
    state = nextState
    if (shouldBreak) {
      break
    }
  }

  return { moves: bestMoves, score: state.bestScore }
}