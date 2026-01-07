/**
 * board.js - Chess Board Rendering and UI Module
 * Handles all board rendering, user interactions, and visual feedback
 */

const ChessBoard = (function() {
    'use strict';
    
    // Unicode chess pieces
    const PIECES = {
        'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
        'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
    };
    
    /* 
     * Future: To use image-based pieces
     * 
     * 1. Create images in assets/pieces/ directory following naming convention:
     *    - white-king.png, white-queen.png, white-rook.png, etc.
     *    - black-king.png, black-queen.png, black-rook.png, etc.
     * 
     * 2. Replace PIECES object with:
     *    const PIECE_IMAGES = {
     *        'p': 'assets/pieces/black-pawn.png',
     *        'r': 'assets/pieces/black-rook.png',
     *        'n': 'assets/pieces/black-knight.png',
     *        'b': 'assets/pieces/black-bishop.png',
     *        'q': 'assets/pieces/black-queen.png',
     *        'k': 'assets/pieces/black-king.png',
     *        'P': 'assets/pieces/white-pawn.png',
     *        'R': 'assets/pieces/white-rook.png',
     *        'N': 'assets/pieces/white-knight.png',
     *        'B': 'assets/pieces/white-bishop.png',
     *        'Q': 'assets/pieces/white-queen.png',
     *        'K': 'assets/pieces/white-king.png'
     *    };
     * 
     * 3. Update renderPiece() function to create <img> elements
     */
    
    let boardElement;
    let onSquareClick;
    let selectedSquare = null;
    let legalMoves = [];
    let isFlipped = false;
    
    /**
     * Initialize the chess board
     * @param {string} containerId - ID of the container element
     * @param {function} clickHandler - Function to call when a square is clicked
     * @param {boolean} flipInitial - Whether to flip the board initially (for black player)
     */
    function init(containerId, clickHandler, flipInitial = false) {
        boardElement = document.getElementById(containerId);
        onSquareClick = clickHandler;
        isFlipped = flipInitial;
        createBoard();
    }
    
    /**
     * Create the 8x8 chess board
     */
    function createBoard() {
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                const displayRow = isFlipped ? row : 7 - row;
                const displayCol = isFlipped ? 7 - col : col;
                
                const file = String.fromCharCode(97 + displayCol); // a-h
                const rank = displayRow + 1; // 1-8
                const squareName = file + rank;
                
                square.className = 'square ' + ((displayRow + displayCol) % 2 === 0 ? 'dark' : 'light');
                square.dataset.square = squareName;
                
                square.addEventListener('click', () => {
                    if (onSquareClick) {
                        onSquareClick(squareName);
                    }
                });
                
                boardElement.appendChild(square);
            }
        }
    }
    
    /**
     * Render the current board position
     * @param {object} game - Chess.js game instance
     */
    function render(game) {
        const board = game.board();
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const displayRow = isFlipped ? row : 7 - row;
                const displayCol = isFlipped ? 7 - col : col;
                
                const file = String.fromCharCode(97 + displayCol);
                const rank = displayRow + 1;
                const squareName = file + rank;
                
                const square = boardElement.querySelector(`[data-square="${squareName}"]`);
                const piece = board[displayRow][displayCol];
                
                if (piece) {
                    square.innerHTML = renderPiece(piece);
                } else {
                    square.innerHTML = '';
                }
            }
        }
        
        updateHighlights();
    }
    
    /**
     * Render a chess piece
     * @param {object} piece - Piece object with type and color
     * @returns {string} HTML for the piece
     */
    function renderPiece(piece) {
        const symbol = PIECES[piece.type] || '';
        const colorClass = piece.color === 'w' ? 'white' : 'black';
        return `<span class="piece ${colorClass}">${symbol}</span>`;
        
        /* 
         * Future: Image-based rendering
         * 
         * const img = document.createElement('img');
         * img.src = PIECE_IMAGES[piece.type];
         * img.className = 'piece';
         * img.alt = piece.color + ' ' + piece.type;
         * return img.outerHTML;
         */
    }
    
    /**
     * Set the selected square and legal moves
     * @param {string} square - Square name (e.g., 'e4')
     * @param {array} moves - Array of legal move objects
     */
    function setSelectedSquare(square, moves) {
        selectedSquare = square;
        legalMoves = moves || [];
        updateHighlights();
    }
    
    /**
     * Clear selection
     */
    function clearSelection() {
        selectedSquare = null;
        legalMoves = [];
        updateHighlights();
    }
    
    /**
     * Update visual highlights on the board
     */
    function updateHighlights() {
        // Clear all highlights
        const squares = boardElement.querySelectorAll('.square');
        squares.forEach(square => {
            square.classList.remove('selected', 'legal-move', 'has-piece');
        });
        
        // Highlight selected square
        if (selectedSquare) {
            const selectedElement = boardElement.querySelector(`[data-square="${selectedSquare}"]`);
            if (selectedElement) {
                selectedElement.classList.add('selected');
            }
        }
        
        // Highlight legal moves
        legalMoves.forEach(move => {
            const moveSquare = boardElement.querySelector(`[data-square="${move.to}"]`);
            if (moveSquare) {
                moveSquare.classList.add('legal-move');
                if (moveSquare.innerHTML.trim() !== '') {
                    moveSquare.classList.add('has-piece');
                }
            }
        });
    }
    
    /**
     * Flip the board orientation
     */
    function flip() {
        isFlipped = !isFlipped;
        createBoard();
        return isFlipped;
    }
    
    /**
     * Get the current flip state
     * @returns {boolean} True if board is flipped
     */
    function getFlipState() {
        return isFlipped;
    }
    
    /**
     * Set the board orientation
     * @param {boolean} flipped - Whether the board should be flipped
     */
    function setOrientation(flipped) {
        if (isFlipped !== flipped) {
            isFlipped = flipped;
            createBoard();
        }
    }
    
    // Public API
    return {
        init,
        render,
        setSelectedSquare,
        clearSelection,
        flip,
        getFlipState,
        setOrientation
    };
})();
