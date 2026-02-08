const fs = require('fs');

const GAME_HISTORY_FILE_PATH = '../data/game_history.json'

const chunkArray = (array, size) => {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  };

function htmlElementToJsonPiece(element) {
    const elementChildren = element.children
    if (!elementChildren.length) {
        return 0
    }
    const firstChildClasslist = [...elementChildren[0].classList]
    if (firstChildClasslist.includes('piece--white')) {
        return firstChildClasslist.includes('piece--queen') ? 3 : 1
    }
    return firstChildClasslist.includes('piece--queen') ? -3 : -1
}

function htmlBoardToJson() {
    const board = document.querySelector('.board')
    const squares = [...board?.children ?? []].filter(element => !element.className.includes('grid__square--name') && element.className.includes('grid__square'))
    const mappedSquares = chunkArray(squares, 8).reverse().flat()
    return mappedSquares.map(square => htmlElementToJsonPiece(square))
}

function createJsonFile() {
    fs.writeFileSync(GAME_HISTORY_FILE_PATH, '[')
}

function completeJsonFile() {
    fs.appendFileSync(GAME_HISTORY_FILE_PATH, ']')
}

function mapResultToJson(hasWhiteWon) {
    if (hasWhiteWon === true) {
        return 1
    }
    if (hasWhiteWon === null) {
        return 0
    }
    return -1
}

function saveGameToJson(boards, hasWhiteWon) {
    const result = mapResultToJson(hasWhiteWon)
    const content = boards.map(board => ({board, result}))
    for (const row of content) {
        fs.appendFileSync(GAME_HISTORY_FILE_PATH, row)
    }
}

export {saveGameToJson, createJsonFile, completeJsonFile, htmlBoardToJson}