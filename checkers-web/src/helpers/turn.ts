import type { BoardPosition, GameResult, Move, Player } from "@/types"
import { applyMove } from "./move"
import { determineGameResult } from "./gameOver"

type Callbacks = {
    gameOverCallback: (result: GameResult) => void
    moveCallback: (move: Move) => void
    turnOverCallback: () => void
    beforeMoveCallback?: (move: Move) => Promise<void>
    afterMoveCallback?: () => void
}

function applySingleMoveAndPossiblyEndTurn(
    board: BoardPosition,
    move: Move,
    callbacks: Callbacks,
): { newBoard: BoardPosition; turnOver: boolean } {
    const { moveCallback, turnOverCallback } = callbacks
    const { boardAfter, hasTurnEnded } = applyMove(board, move)
    moveCallback(move)

    if (hasTurnEnded) {
        turnOverCallback()
    }
    return { newBoard: boardAfter, turnOver: hasTurnEnded }
}

export const playerMove = (move: Move | null, board: BoardPosition, playerColor: Player, queenMovesWithoutCaptureCount: number, callbacks: Callbacks) => {
    if (move === null) {
        return
    }
    const gameResult = determineGameResult(board, playerColor, queenMovesWithoutCaptureCount)
    if (gameResult) {
        callbacks.gameOverCallback(gameResult)
        return
    }
    const { newBoard } = applySingleMoveAndPossiblyEndTurn(board, move, callbacks)
    return newBoard
}

export const computerTurn = async (board: BoardPosition, computerColor: Player, queenMovesWithoutCaptureCount: number, callbacks: Callbacks & {
    movePickingStrategy: (board: BoardPosition, playerColor: Player) => Promise<Move[]>,
}) => {
    const gameResult = determineGameResult(board, computerColor, queenMovesWithoutCaptureCount)
    if (gameResult) {
        callbacks.gameOverCallback(gameResult)
        return
    }
    const { movePickingStrategy, beforeMoveCallback, afterMoveCallback, ...turnCallbacks } = callbacks
    let currentBoard: BoardPosition = [...board]
    for (const move of await movePickingStrategy(board, computerColor)) {
        await beforeMoveCallback?.(move)
        const { newBoard, turnOver } = applySingleMoveAndPossiblyEndTurn(currentBoard, move, turnCallbacks)
        afterMoveCallback?.()
        currentBoard = [...newBoard]
        if (turnOver) {
            return currentBoard
        }
    }
}
