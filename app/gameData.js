const API_BASE = 'http://localhost:3001';

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

async function createJsonFile() {
    await fetch(`${API_BASE}/api/game-history/start`, { method: 'POST' });
}

function completeJsonFile() {
    fetch(`${API_BASE}/api/game-history/end`, { method: 'POST' });
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
    const entries = boards.map(board => ({ board, result }))
    fetch(`${API_BASE}/api/game-history/append`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
    });
}

export { saveGameToJson, createJsonFile, completeJsonFile, htmlBoardToJson }
