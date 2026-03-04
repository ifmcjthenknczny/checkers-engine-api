import type { BoardPosition, Move, Player } from "@/types"
import { applyMove, isChainedCapturePossible } from "./move"
import { determineGameResult } from "./gameOver"
import { isQueen } from "./board"

type TurnCallbacks = {
    queenMovesWithoutCaptureCountIncreaseFn: () => void
    gameOverCallback: () => void
    moveCallback: (move: Move) => void
    turnOverCallback: () => void
}

function applySingleMoveAndPossiblyEndTurn(
    board: BoardPosition,
    move: Move,
    callbacks: TurnCallbacks,
): { newBoard: BoardPosition; turnOver: boolean } {
    const { queenMovesWithoutCaptureCountIncreaseFn, moveCallback, turnOverCallback } = callbacks
    const newBoard = applyMove(board, move)
    moveCallback(move)
    const turnOver = !isChainedCapturePossible(newBoard, move)
    if (turnOver) {
        if (!move.isCapture && isQueen(newBoard[move.toIndex])) {
            queenMovesWithoutCaptureCountIncreaseFn()
        }
        turnOverCallback()
    }
    return { newBoard, turnOver }
}

const playerTurn = (move: Move | null, board: BoardPosition, playerColor: Player, queenMovesWithoutCaptureCount: number, callbacks: {
    queenMovesWithoutCaptureCountIncreaseFn: () => void,
    gameOverCallback: () => void,
    moveCallback: (move: Move) => void,
    turnOverCallback: () => void,
}) => {
    const isGameOver = determineGameResult(board, playerColor, queenMovesWithoutCaptureCount)
    if (isGameOver) {
        callbacks.gameOverCallback()
        return
    }
    const { newBoard } = applySingleMoveAndPossiblyEndTurn(board, move!, callbacks)
    return newBoard
}

const computerTurn = (board: BoardPosition, playerColor: Player, queenMovesWithoutCaptureCount: number, callbacks: {
    queenMovesWithoutCaptureCountIncreaseFn: () => void,
    gameOverCallback: () => void,
    moveCallback: (move: Move) => void,
    turnOverCallback: () => void,
    pickMoveStategy: (board: BoardPosition, playerColor: Player) => Move[],
}) => {
    const isGameOver = determineGameResult(board, playerColor, queenMovesWithoutCaptureCount)
    if (isGameOver) {
        callbacks.gameOverCallback()
        return
    }
    const { pickMoveStategy, ...turnCallbacks } = callbacks
    let currentBoard = board
    for (const move of pickMoveStategy(board, playerColor)) {
        const { newBoard, turnOver } = applySingleMoveAndPossiblyEndTurn(currentBoard, move, turnCallbacks)
        currentBoard = newBoard
        if (turnOver) return currentBoard
    }
}

const gameOverCb = () => {
    // save boards with result to json
    // podświetlić figury albo coś
}

const moveCb = (move: Move) => {
    // increase turn number
    // queen moves without capture streak
    // save board
    // zmiana playera który ma teraz ruch
    // ogar chained capture wraz z forbidden direction
}