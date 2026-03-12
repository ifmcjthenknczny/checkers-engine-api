import type { BoardPosition, Move, Player } from "@/types"
import { applyMove, isChainedCapturePossible } from "./move"
import { determineGameResult } from "./gameOver"

type Callbacks = {
    gameOverCallback: () => void
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
    const newBoard = applyMove(board, move)
    moveCallback(move)
    const isTurnOver = !isChainedCapturePossible(newBoard, move)
    if (isTurnOver) {
        turnOverCallback()
    }
    return { newBoard, turnOver: isTurnOver }
}

export const playerMove = (move: Move | null, board: BoardPosition, playerColor: Player, queenMovesWithoutCaptureCount: number, callbacks: Callbacks) => {
    if (move === null) {
        return
    }
    const isGameOver = determineGameResult(board, playerColor, queenMovesWithoutCaptureCount)
    if (isGameOver) {
        callbacks.gameOverCallback()
        return
    }
    const { newBoard } = applySingleMoveAndPossiblyEndTurn(board, move, callbacks)
    return newBoard
}

export const computerTurn = async (board: BoardPosition, computerColor: Player, queenMovesWithoutCaptureCount: number, callbacks: Callbacks & {
    movePickingStrategy: (board: BoardPosition, playerColor: Player) => Promise<Move[]>,
}) => {
    const isGameOver = determineGameResult(board, computerColor, queenMovesWithoutCaptureCount)
    if (isGameOver) {
        callbacks.gameOverCallback()
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
