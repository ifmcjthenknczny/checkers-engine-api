import {
    range,
    sleep,
    fadeIn,
    getSquareColAndRow,
    createDiagonalIterable
} from './generalhelpers.js';
import {
    pickAMove
} from './ai.js';

// piece and legal moves service
function pieceHold() {
    // things to do, when player clicks a piece
    if (endOfGame() || chainedCapturePiece || pieceHoldBlock)
        return;
    // player can hold a piece if it is his turn, game is on and there no piece to chain capture and not currently moving piece
    // if none of these is a case, first make sure to unclick any other pieces and unhighlight pieces that can move
    pieceUnhold();
    if (
        (legalNormalMovesOfPiece(this).length > 0 &&
            !isThereACapturePossibility()) ||
        legalCapturesOfPiece(this).length > 0
    ) {
        // if there are normal moves for piece and no other piece can capture OR if there are captures possible and this piece can capture another piece, approve that this piece is clicked by adding id
        this.setAttribute("id", "piece-clicked");
        // generate markings on squares where this piece can move
        // if this piece can't move - show which pieces can
    }
}

function pieceUnhold() {
    // activate only if no piece is in between multiple captures
    if (chainedCapturePiece !== null) return;
    // if there is piece held right now, remove its id and all legal moves marks and unhighligh pieces that can move
    if (!!document.querySelector("#piece-clicked"))
        document.querySelector("#piece-clicked")?.removeAttribute("id");
}

// turns
async function makeAMove() {
    // selects clicked piece and checks if the square is legal to move - if there is no piece clicked or the square is not legal to move or itsComputerTurn - ends function, if not - prevents any other moves
    const clickedPiece = document.querySelector("#piece-clicked");
    const legalSquare =
        this.firstElementChild &&
        this.firstElementChild.classList.contains("legal-move");
    pieceHoldBlock = true;
    // set queen-connected variables and if the piece is about to capture, remove the captured piece and legal move marks on squares, move piece and wait for transition to finish
    setQueenVariables(clickedPiece, this);
    if (forcedCapture)
        removeCapturedPiece(
            findSquareOfAPieceToCapture(clickedPiece.parentElement, this)
        );
    movePiece(clickedPiece.parentElement, this, MOVE_ANIMATION_DURATION_MS);
    await sleep(MOVE_ANIMATION_DURATION_MS);
    // checks if piece can capture again, then sets variable to this piece (and that turns off clicking other pieces of player) and continue turn, else check for promotion, unhold piece and ends turn
    pieceHoldBlock = false;
    if (forcedCapture && legalCapturesOfPiece(clickedPiece).length > 0)
        chainedCapturePiece = clickedPiece;
    else {
        if (promotion(clickedPiece)) crownTheQueen(clickedPiece);
        pieceUnhold();
        endTurn();
    }
}

async function computerMove() {
    // declares variables which values are about to be determined. if it is not between multiple, chained captures - pick a piece and move from all computer pieces, else randomly pick a capture of only this piece which is inbetween captures
    console.log({whiteToMove})
    let pieceToMove, targetSquare;
    if (!chainedCapturePiece) {
        [pieceToMove, targetSquare] = pickAMove(
            findAllLegalMoves(whiteToMove)
            // findAllLegalMoves(!whiteToMove)
        );
    } else {
        pieceToMove = chainedCapturePiece;
        const legalCaptures = legalCapturesOfPiece(pieceToMove);
        targetSquare =
            legalCaptures[Math.floor(Math.random() * legalCaptures.length)];
    }
    // set queen-connected variables, remove piece if it was a capture, animate piece move and wait for animation to finish
    setQueenVariables(pieceToMove, targetSquare);
    if (forcedCapture)
        removeCapturedPiece(
            findSquareOfAPieceToCapture(pieceToMove.parentElement, targetSquare)
        );
    movePiece(pieceToMove.parentElement, targetSquare, MOVE_ANIMATION_DURATION_MS);
    await sleep(MOVE_ANIMATION_DURATION_MS);
    // piece can capture again then set chainedCapturePiece to this piece, so it will move again and call computerMove again, else check fro promotion and endTurn
    if (forcedCapture && legalCapturesOfPiece(pieceToMove).length > 0) {
        chainedCapturePiece = pieceToMove;
        computerMove();
    } else {
        if (promotion(pieceToMove)) crownTheQueen(pieceToMove);
        endTurn();
    }
}

function setQueenVariables(pieceToMove, targetSquare) {
    // checks if clicked piece is a queen and is about to capture - and sets onlyQueenMovesWithoutCapture accordingly, as well as setting the direction in which queen can't capture in next chained move
    const isQueen = pieceToMove.classList.contains("piece--queen");
    isQueen && !forcedCapture ?
        onlyQueenMovesWithoutCapture++
        :
        (onlyQueenMovesWithoutCapture = 0);
    queenCaptureForbiddenDirection =
        isQueen && forcedCapture ?
        findQueenCaptureForbiddenDirection(
            pieceToMove.parentElement,
            targetSquare
        ) : [null, null];
}

function endTurn() {
    // change the move turn to other piece color, reset move-connected variables
    whiteToMove = !whiteToMove;
    chainedCapturePiece = null;
    queenCaptureForbiddenDirection = [null, null];
    // if it is end of game, do what you gotta do when game ends
    if (endOfGame()) congratsToWinner();
    // if not, change top bar and if it computer's turn, make a move
    else {
        changeGameInfo();
        computerMove();
    }
}

function changeGameInfo() {
    // changes class of text, for white's move is whiter, for black's is blacker
    const whoToMove = document.querySelector(".game-info__who-to-move span");
    whoToMove.classList.toggle("white");
    // change text, if white are to move, change turn counter as well
    if (whiteToMove) {
        document.querySelector(".game-info__turn-counter span").innerText = ++turn;
        whoToMove.innerText = "White";
    } else whoToMove.innerText = "Black";
}

// move animation
async function movePiece(startSquare, targetSquare, transitionTimeMs) {
    // block flipping the board, because everything crashes
    // selects piece, squares id and starting and target indexes
    const pieceToMove = startSquare.firstChild;
    const [startCol, startRow] = getSquareColAndRow(startSquare);
    const [targetCol, targetRow] = getSquareColAndRow(targetSquare);
    const [startColIndex, targetColIndex] = [startCol, targetCol].map((x) =>
        cols.indexOf(x)
    );
    const [startRowIndex, targetRowIndex] = [startRow, targetRow].map(
        x => x - 1
    );
    // calculates current square width (with border from two sides), includes positive/negative coefficient because of position of board and calculates transiton in both axis
    const squareWidth = +window
        .getComputedStyle(document.querySelector(".grid__square"))
        .width.split("px")[0] +
        2 *
        +window
        .getComputedStyle(document.querySelector(".grid__square"))
        .border.split("px")[0];
    const boardPositionCoeff = whitesOnBottom ? 1 : -1;
    const transX =
        (targetColIndex - startColIndex) * squareWidth * boardPositionCoeff;
    const transY =
        (startRowIndex - targetRowIndex) * squareWidth * boardPositionCoeff;
    // if another, chained capture will be possible, generate legal move before the actual transition
    if (forcedCapture) {
        const dummyPiece = pieceToMove.cloneNode(true);
        targetSquare.appendChild(dummyPiece);
        dummyPiece.remove();
    }
    // sets size of piece before changing its position to fixed, set transition and transform properties
    const {
        width
    } = pieceToMove.getBoundingClientRect();
    const size =
        width - 2 * +window.getComputedStyle(pieceToMove).border.split("px")[0];
    pieceToMove.style.width = `${size}px`;
    pieceToMove.style.height = `${size}px`;
    pieceToMove.style.transition = `transform ${transitionTimeMs}ms`;
    pieceToMove.style.position = "fixed";
    // translate now fixed-position piece on calculated distance in px and wait until animation finishes
    pieceToMove.style.transform = `translate(${transX}px, ${transY}px)`;
    await sleep(transitionTimeMs);
    // then append piece to the target square, remove all given style and unblock flipping the board
    targetSquare.appendChild(pieceToMove);
    pieceToMove.style.transform = "";
    pieceToMove.style.position = "";
    pieceToMove.style.width = "";
    pieceToMove.style.height = "";
}

// move rules-related functions
function findAllLegalMoves(forWhite) {
    // selects all pieces of given color
    const selector = forWhite ? ".piece--white" : ".piece--black";
    const allColorPieces = [...document.querySelectorAll(selector)];
    const legalMoves = {};
    // if there is any capture possible, then add to legalMoves object key (square id of piece that can move) and value (its possible moves)
    if (isThereACapturePossibility()) {
        for (let piece of allColorPieces) {
            const legalMovesList = legalCapturesOfPiece(piece);
            if (legalMovesList.length > 0)
                legalMoves[piece.parentElement.id] = legalMovesList;
        }
        // if there are no captures possibles then do the same, but with ordinary moves, every case return
    } else {
        for (let piece of allColorPieces) {
            const legalMovesList = legalNormalMovesOfPiece(piece);
            if (legalMovesList.length > 0)
                legalMoves[piece.parentElement.id] = legalMovesList;
        }
    }
    return legalMoves;
}

function legalCapturesOfPiece(piece) {
    // gets id of piece's square, color, color it can capture and if it is a queen, change row in case of it is 2-digits
    let [startCol, startRow] = getSquareColAndRow(piece.parentElement);
    const startIndex = rows.indexOf(startRow);
    const isWhite = piece.classList.contains("piece--white") ? true : false;
    const classOfPiece = isWhite ? "piece--white" : "piece--black";
    const classToCapture = isWhite ? "piece--black" : "piece--white";
    const isQueen = piece.classList.contains("piece--queen") ? true : false;
    const possibleSquares = [];
    // checks possibilities in every direction
    for (let rowsIncrease of [true, false]) {
        for (let colsIncrease of [true, false]) {
            if (
                isQueen &&
                queenCaptureForbiddenDirection[0] === colsIncrease &&
                queenCaptureForbiddenDirection[1] === rowsIncrease
            )
                continue;
            // sets boundaries and increment or decrement for iterable variable
            const colBoundary = colsIncrease ? cols.length - 1 : 0;
            const rowBoundary = rowsIncrease ? rows.length - 1 : 0;
            const deltaCol = colsIncrease ? 1 : -1;
            const deltaRow = rowsIncrease ? 1 : -1;
            // starts not on the square on which given piece is, but one square in diagonal away
            let colIndex = cols.indexOf(startCol) + deltaCol;
            let rowIndex = startIndex + deltaRow;
            // initializes variable that changes to true if it founds piece of color to capture
            let thereIsPieceToCapture = false;
            while (
                rowIndex !== rowBoundary + deltaRow &&
                colIndex !== colBoundary + deltaCol
            ) {
                // loops over diagonal in specified direction by colsIncrease and rowsIncrease until board boundary
                // breaks the loop if it finds piece of the same color
                // if it finds first piece of opposite color, thereIsPieceToCapture is changed to true
                // when thereIsPieceToCapture is true, every free square is added to array which is later returned
                // breaks the loop if it finds another piece, returns after looping over all directions
                const squareName = `${cols[colIndex]}${rowIndex + 1}`;
                const square = document.querySelector(`#${squareName}`);
                const isSquareTaken = !!square.firstChild && square.firstChild.classList.contains("piece");
                if (isSquareTaken) {
                    if (thereIsPieceToCapture) break;
                    else if (square.firstChild.classList.contains(classToCapture))
                        thereIsPieceToCapture = true;
                    else if (square.firstChild.classList.contains(classOfPiece)) break;
                } else if (!isSquareTaken && thereIsPieceToCapture)
                    possibleSquares.push(square);
                colIndex += deltaCol;
                rowIndex += deltaRow;
                // breaks the loops if it is normal piece and its capture movement range has been reached
                if (!isQueen && Math.abs(rowIndex - startIndex) > 2) break;
            }
        }
    }
    return possibleSquares;
}

function legalNormalMovesOfPiece(piece) {
    // gets id of piece's square, color and whether it is a queen
    let [startCol, startRow] = getSquareColAndRow(piece.parentElement);
    const isQueen = piece.classList.contains("piece--queen") ? true : false;
    const isWhite = piece.classList.contains("piece--white") ? true : false;
    // normal move directions depend on the color of piece and if it is queen - true is case of increasing, false is decreasing
    const rowsIncreasePossible = isQueen ? [true, false] :
        isWhite ? [true] : [false];
    const colsIncreasePossible = [true, false];
    const possibleSquares = [];
    for (let rowsIncrease of rowsIncreasePossible) {
        for (let colsIncrease of colsIncreasePossible) {
            // sets up consts depending on the direction, starting not on the square on which given piece is, but one square in diagonal away
            const colBoundary = colsIncrease ? cols.length - 1 : 0;
            const rowBoundary = rowsIncrease ? rows.length - 1 : 0;
            const deltaCol = colsIncrease ? 1 : -1;
            const deltaRow = rowsIncrease ? 1 : -1;
            let rowIndex = rows.indexOf(startRow) + deltaRow;
            let colIndex = cols.indexOf(startCol) + deltaCol;
            while (
                rowIndex !== rowBoundary + deltaRow &&
                colIndex !== colBoundary + deltaCol
            ) {
                // loops over diagonal in specified direction by colsIncrease and rowsIncrease until board boundary
                // breaks the loop if it finds piece, if not then add to return array
                const squareName = `${cols[colIndex]}${rowIndex + 1}`;
                const square = document.querySelector(`#${squareName}`);
                const isSquareTaken = !!square.firstChild && square.firstChild.classList.contains("piece");
                if (isSquareTaken) break;
                else possibleSquares.push(square);
                if (!isQueen) break; // breaks the loop if it is normal piece and can move only one square forward
                colIndex += deltaCol;
                rowIndex += deltaRow;
            }
        }
    }
    return possibleSquares;
}

function findQueenCaptureForbiddenDirection(startSquare, targetSquare) {
    // returns forbidden direction for queen to capture (she can't come back very next chained capture) in form of true-false array
    // true is for increasing, false for decreasing value of rows/cols
    let [startCol, startRow] = getSquareColAndRow(startSquare);
    let [targetCol, targetRow] = getSquareColAndRow(targetSquare);
    return [targetCol < startCol, targetRow < startRow];
}

function crownTheQueen(piece) {
    // adds class piece--queen for piece parameter and div child with class of piece--queen-decoration
    piece.classList.add("piece--queen");
    const queenDecoration = document.createElement("div");
    queenDecoration.classList.add("piece--queen-decoration");
    piece.appendChild(queenDecoration);
}

function findSquareOfAPieceToCapture(startSquare, targetSquare) {
    // loops over diagonal to find piece to remove
    let [startCol, startRow] = getSquareColAndRow(startSquare);
    let [targetCol, targetRow] = getSquareColAndRow(targetSquare);
    const rowIterable = createDiagonalIterable(
        rows.indexOf(startRow),
        rows.indexOf(targetRow)
    );
    const colIterable = createDiagonalIterable(
        cols.indexOf(startCol),
        cols.indexOf(targetCol)
    );
    const classToCapture = whiteToMove ? "piece--black" : "piece--white";
    let i = 0;
    // because it is diagonal, both Array.length are equal
    while (i < rowIterable.length) {
        // looks if square has a child if a given class of piece to capture - if it finds it, then returns this sqaure
        const squareName = `${cols[colIterable[i]]}${rows[rowIterable[i]]}`;
        const square = document.querySelector(`#${squareName}`);
        if (
            !!square.firstElementChild &&
            square.firstElementChild.classList.contains(classToCapture)
        )
            return square;
        i++;
    }
}

function removeCapturedPiece(square) {
    // checks the color of piece on given square parameter and if it is queen, then removes it, then adds to the appropriate graveyard 
    const isQueen = square.firstChild.classList.contains("piece--queen");
    const isPieceWhite = square.firstChild.classList.contains("piece--white");
    square.firstChild.remove();
    addPieceToGraveyard(isPieceWhite, isQueen);
}

function addPieceToGraveyard(isPieceWhite, isQueen) {
    // creates mini piece with given classes and adds it to appropriate graveyard zone
    const pieceMini = document.createElement("div");
    if (isQueen) pieceMini.classList.add("mini-piece--queen");
    else
        isPieceWhite ?
        pieceMini.classList.add("mini-piece--white") :
        pieceMini.classList.add("mini-piece--black");
    pieceMini.classList.add("mini-piece");
    const targetGraveyard =
        (isPieceWhite && whitesOnBottom) || (!isPieceWhite && !whitesOnBottom) ?
        ".captured-pieces--top" :
        ".captured-pieces--bottom";
    document.querySelector(targetGraveyard).appendChild(pieceMini);
}

function promotion(piece) {
    // checks if piece is already a queen (if yes, return false) and its color and grabs its square row
    if (piece.classList.contains("piece--queen")) return false;
    const isWhite = piece.classList.contains("piece--white") ? true : false;
    let [, clickedPieceRow] = getSquareColAndRow(piece.parentElement);
    // checks if row number of piece's square is last for white or first for black - if yes, returns true, else returns false
    if (
        (isWhite && clickedPieceRow === rows[rows.length - 1]) ||
        (!isWhite && clickedPieceRow === rows[0])
    )
        return true;
    return false;
}

function isThereACapturePossibility() {
    // selects all pieces that are about to move and checks if any of them can capture another piece, returns true/false
    const selector = whiteToMove ? ".piece--white" : ".piece--black";
    const allColorPieces = document.querySelectorAll(selector);
    for (let piece of allColorPieces) {
        if (legalCapturesOfPiece(piece).length > 0) {
            forcedCapture = true;
            return true;
        }
    }
    forcedCapture = false;
    return false;
}

// end game
function determineWinner() {
    // determines who wins by if it has any moves or any pieces left, else it is draw - null
    let winnerWhite = null;
    if (
        !document.querySelector(".piece--black") ||
        (!!document.querySelector(".piece--black") &&
            Object.keys(findAllLegalMoves(false)).length === 0 &&
            !whiteToMove)
    )
        winnerWhite = true;
    else if (
        !document.querySelector(".piece--white") ||
        (!!document.querySelector(".piece--white") &&
            Object.keys(findAllLegalMoves(true)).length === 0 &&
            whiteToMove)
    )
        winnerWhite = false;
    return winnerWhite;
}

function setEndOfGameAppearance(winnerWhite, forWhite) {
    // do not change if it is draw or the player for which it is set has no pieces left, set piece selector and class modifier depending and on if it is for winner
    if (winnerWhite === null) return;
    const pieceSelector = forWhite ? '.piece--white' : '.piece--black';
    const resultClassModifier = ((forWhite && winnerWhite) || (!forWhite && !winnerWhite)) ? 'won' : 'lost';
    const pieces = [...document.querySelectorAll(pieceSelector)];
    if (pieces.length === 0) return;
    // picks all player pieces and gives appropriate classes for them and queens and strips from hover effects
    for (let piece of pieces) {
        piece.classList.remove("piece-hover");
        piece.classList.add(`piece--${resultClassModifier}`);
    }
    const queens = pieces.filter((piece) =>
        piece.classList.contains("piece--queen")
    );
    for (let queen of queens) {
        const crown = queen.firstChild;
        crown.classList.remove("piece--queen-decoration");
        crown.classList.add("piece--queen-decoration-won");
    }
}

function congratsToWinner() {
    // determines the winner, selects top left corner game info and changes text, set classes for pieces left depending on who won
    const winnerWhite = determineWinner();
    const whoToMove = document.querySelector(".game-info__who-to-move");
    switch (winnerWhite) {
        case true:
            whoToMove.innerHTML = '<span class="white">White</span> won!';
            break;
        case false:
            whoToMove.innerHTML = "<span>Black</span> won!";
            break;
        case null:
            whoToMove.innerHTML = "It is a <span>Draw</span>!";
    }
    for (let forWhite of [true, false]) setEndOfGameAppearance(winnerWhite, forWhite);
}

function endOfGame() {
    // checks if requirements for game ending occured - is player about to move have any pieces, if has any possible moves or there were 30 moves of queens without any capture in a row, if nothing of these, return false
    const selector = whiteToMove ? ".piece--white" : ".piece--black";
    const stillPieces = document.querySelectorAll(selector).length;
    if (stillPieces === 0) return true;
    if (Object.keys(findAllLegalMoves(whiteToMove)).length === 0) return true;
    if (onlyQueenMovesWithoutCapture >= 30) return true;
    return false;
}

// generate game components
function generateBoard(size) {
    // start from creating black square, creates sections for DOM, adds appropriate class
    let whiteSquare = false;
    const main = document.querySelector("main");
    const grid = document.createElement("section");
    grid.classList.add("board");
    // divides grid for given board size
    grid.style.gridTemplateColumns = `0.2fr repeat(${size}, 1fr`;
    grid.style.gridTemplateRows = `repeat(${size}, 1fr) 0.2fr`;
    // sets order of rows and cols depending on board orientation
    const rowOrder = whitesOnBottom ? [...rows].reverse() : [...rows];
    const colOrder = whitesOnBottom ? [...cols] : [...cols].reverse();
    // for every new row, change color of first sqaure, create square with name and append it as first
    for (let rowName of rowOrder) {
        whiteSquare = !whiteSquare;
        const squareWithName = document.createElement("div");
        squareWithName.classList.add(
            "grid__square--name-row",
            "grid__square--name"
        );
        squareWithName.innerText = rowName;
        grid.append(squareWithName);
        // loop over cols and create board squares with id, classname and classname if its white or black and approprriate event
        for (let colName of colOrder) {
            const square = document.createElement("div");
            const nameOfSquare = `${colName + rowName}`;
            square.classList.add("grid__square");
            square.setAttribute("id", nameOfSquare);
            if (whiteSquare) {
                square.classList.add("grid__square--white");
                square.addEventListener("click", pieceUnhold);
            } else {
                square.classList.add("grid__square--black");
                square.addEventListener("click", makeAMove);
            }
            // append square and change color of squares between cols
            grid.appendChild(square);
            whiteSquare = !whiteSquare;
        }
    }
    // create empty element at the corner and all column name squares under the board
    grid.append(document.createElement("div"));
    for (let colName of colOrder) {
        const squareWithName = document.createElement("div");
        squareWithName.classList.add(
            "grid__square--name-col",
            "grid__square--name"
        );
        squareWithName.innerText = colName;
        grid.append(squareWithName);
    }
    // append grid to main and main to DOM
    main.appendChild(grid);
    document.body.insertBefore(
        main,
        document.querySelector(".captured-pieces--bottom")
    );
    return grid;
}

function generateStartingPosition(board) {
    // selects all black squares and chooses order of putting pieces from up to down, gets size of board
    const rowNames = [...board.children]
        .filter((x) => x.classList.contains("grid__square--name-row"))
        .map((x) => x.innerText);
    const size =
        rowNames[0] === "1" ? +rowNames[rowNames.length - 1] : +rowNames[0];
    const blackSquares = document.querySelectorAll(".grid__square--black");
    const order = ["piece--black", "piece--white"];
    if (!whitesOnBottom) order.reverse();
    // loops over the board and add pieces along with their classes and events - pieceHold for player color and pieceUnhold for computer color - to the board
    for (let i = 0; i < blackSquares.length; i++) {
        if (i < ((size / 2 - 1) * size) / 2) {
            const piece = document.createElement("div");
            piece.classList.add("piece", order[0]);
            piece.addEventListener("click", pieceUnhold);
            blackSquares[i].append(piece);
        } else if (i >= ((size / 2 + 1) * size) / 2) {
            const piece = document.createElement("div");
            piece.classList.add("piece", order[1]);
            piece.addEventListener("click", pieceHold);
            piece.classList.add("piece-hover");
            blackSquares[i].append(piece);
        }
    }
}

function resetGame() {
    document.body.innerHTML = "";
    document.body.appendChild(document.createElement("main"));
    resetGlobalVariables();
    const main = document.querySelector("main");
    main.innerHTML = "";
    startGame()
}

function resetGlobalVariables() {
    // resets all global variables to initial level
    whiteToMove = true;
    turn = 1;
    forcedCapture = false;
    onlyQueenMovesWithoutCapture = 0;
    chainedCapturePiece = null;
    queenCaptureForbiddenDirection = [null, null];
}

function generateGraveyards() {
    // generates two sections for captured pieces
    const graveyardTop = document.createElement("section");
    const graveyardBottom = document.createElement("section");
    for (let graveyard of [graveyardTop, graveyardBottom])
        graveyard.classList.add("captured-pieces");
    graveyardTop.classList.add("captured-pieces--top");
    graveyardBottom.classList.add("captured-pieces--bottom");
    document.body.appendChild(graveyardTop);
    document.body.appendChild(graveyardBottom);
}

function generateGameInfo() {
    // generates top bar, above the board, with current information about the game
    const gameInfo = document.createElement("section");
    gameInfo.className = "game-info";
    const whoToMove = document.createElement("section");
    whoToMove.className = "game-info__who-to-move";
    const turnCounter = document.createElement("section");
    turnCounter.className = "game-info__turn-counter";
    whoToMove.innerHTML = '<span class="white">White</span> to move';
    turnCounter.innerHTML = "Turn: <span>1</span>";
    gameInfo.appendChild(whoToMove);
    gameInfo.appendChild(turnCounter);
    document.body.prepend(gameInfo);
}

async function generateTitleWindow() {
    // generates first, title window, waits some time and preoceeds do question window
    const main = document.createElement("main");
    const container = document.createElement("div");
    container.classList.add("container");
    const gameTitle = document.createElement("section");
    gameTitle.classList.add("game-title");
    gameTitle.innerText = "Warcaby";
    const author = document.createElement("section");
    author.classList.add("author");
    author.innerText = "created by Maciej Konieczny";
    container.appendChild(gameTitle);
    container.appendChild(author);
    main.appendChild(container);
    document.body.appendChild(main);
    fadeIn(".container", 300);
    await sleep(1000);
    container.remove();
    main.innerHTML = "";
    startGame()
}

async function startGame() {
    // animation, generate board, pieces and everything around it and if computer plays white - wait a second and make him move
    fadeIn("body", 200);
    generateGraveyards();
    generateBoard(BOARD_SIZE);
    generateGameInfo();
    generateStartingPosition(document.querySelector(".board"));
    await sleep(1000);
    computerMove();
}

// globals
const BOARD_SIZE = 8;
const cols = range(BOARD_SIZE, "a");
const rows = range(BOARD_SIZE, 1);
let turn = 1;
let forcedCapture = false;
let whiteToMove = true;
let whitesOnBottom = true;
let onlyQueenMovesWithoutCapture = 0;
let chainedCapturePiece = null;
let queenCaptureForbiddenDirection = [null, null];
let pieceHoldBlock = false;
const MOVE_ANIMATION_DURATION_MS = 600;
generateTitleWindow();