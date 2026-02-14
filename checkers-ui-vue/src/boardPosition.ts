import type { BoardPosition } from './types'
import { BOARD_SIZE } from './config.js'
import { chunkArray } from './helpers.js'

const indexToSquare = (index: number) => {
  const rank = Math.floor(index / (BOARD_SIZE / 2)) + 1
  const fileIndex = rank % 4
  // const filesEvenRank = ["b", "d", "f", "h"]; // rank 2,4,6,8
  // const filesOddRank = ["a", "c", "e", "g"]; // rank 1,3,5,7
  // const files = rank % 2 === 1 ? filesOddRank : filesEvenRank;
  // return `${files[fileIndex]}${rank}`;
  const file = String.fromCharCode(97 + fileIndex)
  return `${file}${rank}`
}

function renderJsonToHtml(boardData: BoardPosition) {
  const board = document.querySelector('.board')
  if (!board) {
    generateBoard(BOARD_SIZE)
  }

  const relevantSquares = [...(board?.children || [])].filter(
    (element) =>
      !element.className.includes('grid__square--name') &&
      element.className.includes('grid__square') &&
      !element.className.includes('grid__square--white'),
  )

  const chunkedSquares = chunkArray(relevantSquares, BOARD_SIZE / 2)

  const dataForDom = chunkedSquares.toReversed().flat()

  const originalInputSquares = []

  relevantSquares.forEach((square, index) => {
    const originalIndex = boardData.length - 1 - index
    const originalSquareName = indexToSquare(originalIndex)

    originalInputSquares.push(originalSquareName)

    square.innerHTML = ''

    const pieceValue = dataForDom[index]
    const pieceElement = jsonPieceToHtml(pieceValue)

    if (pieceElement) {
      square.appendChild(pieceElement)
    }
  })
}

// TODO: add position viewer page (with possibility to move pawns, paste input or translate current position on board to json input (with info who is to move) along with position engine)
