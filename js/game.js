/**
 * game.js - Main Chess Game Logic
 * Handles game state, move validation, and game flow
 */

const ChessGame = (function() {
    'use strict';
    
    // Game configuration
    const CONFIG = {
        PLAYER_COLOR: 'white', // 'white' or 'black'
        AI_ENABLED: true,
        AI_DELAY: 500 // Delay before AI moves (for better UX)
    };
    
    let game;
    let selectedSquare = null;
    let gameMode = 'player-vs-ai'; // 'player-vs-ai', 'player-vs-player', 'ai-vs-ai'
    let isAIThinking = false;
    let colorModalListenersAttached = false;
    let gameControlListenersAttached = false;
    
    // History navigation state
    let moveHistory = []; // Array of {move, fen, moveNumber}
    let isViewingHistory = false;
    let currentViewIndex = -1; // -1 means viewing current position
    let historyClickListenerAttached = false;
    
    /**
     * Initialize the game
     */
    function init() {
        // Show color selection modal
        showColorSelectionModal();
    }
    
    /**
     * Show the color selection modal
     */
    function showColorSelectionModal() {
        const modal = document.getElementById('color-modal');
        modal.classList.add('show');
        
        // Setup button listeners only once
        if (!colorModalListenersAttached) {
            document.getElementById('choose-white').addEventListener('click', () => {
                startGameWithColor('white');
            });
            
            document.getElementById('choose-black').addEventListener('click', () => {
                startGameWithColor('black');
            });
            
            colorModalListenersAttached = true;
        }
    }
    
    /**
     * Hide the color selection modal
     */
    function hideColorSelectionModal() {
        const modal = document.getElementById('color-modal');
        modal.classList.remove('show');
    }
    
    /**
     * Start the game with the selected color
     * @param {string} color - 'white' or 'black'
     */
    function startGameWithColor(color) {
        CONFIG.PLAYER_COLOR = color;
        hideColorSelectionModal();
        
        // Initialize chess.js game
        game = new Chess();
        
        // Reset history navigation state
        moveHistory = [];
        isViewingHistory = false;
        currentViewIndex = -1;
        
        // Initialize board with correct orientation
        // If player is black, flip the board
        const shouldFlip = (color === 'black');
        ChessBoard.init('chess-board', handleSquareClick, shouldFlip);
        ChessBoard.render(game);
        
        // Setup event listeners for game controls (only once)
        setupEventListeners();
        
        // Update UI
        updateStatus();
        updateMoveHistory();
        updateHistoryNavButtons();
        
        // If player is black, AI makes first move
        if (CONFIG.PLAYER_COLOR === 'black' && CONFIG.AI_ENABLED) {
            setTimeout(() => makeAIMove(), CONFIG.AI_DELAY);
        }
    }
    
    /**
     * Setup event listeners for controls
     */
    function setupEventListeners() {
        if (gameControlListenersAttached) {
            return; // Already attached
        }
        
        const newGameBtn = document.getElementById('new-game-btn');
        const flipBoardBtn = document.getElementById('flip-board-btn');
        const prevMoveBtn = document.getElementById('prev-move-btn');
        const nextMoveBtn = document.getElementById('next-move-btn');
        const backToCurrentBtn = document.getElementById('back-to-current-btn');
        
        newGameBtn.addEventListener('click', newGame);
        flipBoardBtn.addEventListener('click', flipBoard);
        prevMoveBtn.addEventListener('click', showPreviousMove);
        nextMoveBtn.addEventListener('click', showNextMove);
        backToCurrentBtn.addEventListener('click', returnToCurrent);
        
        gameControlListenersAttached = true;
    }
    
    /**
     * Handle square click
     * @param {string} square - Square name (e.g., 'e4')
     */
    function handleSquareClick(square) {
        // Don't allow moves while viewing history
        if (isViewingHistory) {
            return;
        }
        
        // Don't allow moves while AI is thinking
        if (isAIThinking) {
            return;
        }
        
        // Don't allow moves if game is over
        if (game.game_over()) {
            return;
        }
        
        // In player vs AI mode, don't allow moves during opponent's turn
        if (gameMode === 'player-vs-ai') {
            const currentTurn = game.turn();
            const playerTurn = CONFIG.PLAYER_COLOR === 'white' ? 'w' : 'b';
            
            if (currentTurn !== playerTurn) {
                return;
            }
        }
        
        // If no piece is selected, try to select this square
        if (!selectedSquare) {
            selectSquare(square);
        } else {
            // Try to move to the clicked square
            if (square === selectedSquare) {
                // Deselect if clicking the same square
                deselectSquare();
            } else {
                attemptMove(selectedSquare, square);
            }
        }
    }
    
    /**
     * Select a square
     * @param {string} square - Square name
     */
    function selectSquare(square) {
        const piece = game.get(square);
        
        // Only select if there's a piece of the current player
        if (piece && piece.color === game.turn()) {
            selectedSquare = square;
            
            // Get legal moves for this piece
            const moves = game.moves({ square: square, verbose: true });
            
            ChessBoard.setSelectedSquare(square, moves);
        }
    }
    
    /**
     * Deselect the current square
     */
    function deselectSquare() {
        selectedSquare = null;
        ChessBoard.clearSelection();
    }
    
    /**
     * Attempt to make a move
     * @param {string} from - Source square
     * @param {string} to - Destination square
     */
    function attemptMove(from, to) {
        // Check if this is a pawn promotion
        const piece = game.get(from);
        const isPromotion = piece && piece.type === 'p' && 
                          (to[1] === '8' || to[1] === '1');
        
        // Attempt the move
        const move = game.move({
            from: from,
            to: to,
            promotion: isPromotion ? 'q' : undefined // Always promote to queen
        });
        
        if (move) {
            // Store the move in history with FEN after the move
            const moveNumber = Math.floor(moveHistory.length / 2) + 1;
            moveHistory.push({
                move: move,
                fen: game.fen(),
                moveNumber: moveNumber
            });
            
            // Move was successful
            deselectSquare();
            ChessBoard.render(game);
            updateStatus();
            updateMoveHistory();
            updateHistoryNavButtons();
            
            // If playing against AI, make AI move after a delay
            if (gameMode === 'player-vs-ai' && CONFIG.AI_ENABLED && !game.game_over()) {
                setTimeout(() => makeAIMove(), CONFIG.AI_DELAY);
            }
        } else {
            // Invalid move, try to select the destination square instead
            deselectSquare();
            selectSquare(to);
        }
    }
    
    /**
     * Make an AI move
     */
    async function makeAIMove() {
        if (isAIThinking || game.game_over()) {
            return;
        }
        
        isAIThinking = true;
        showAIThinking(true);
        
        try {
            // Get current position and legal moves
            const fen = game.fen();
            const legalMoves = game.moves({ verbose: true });
            const legalMovesUCI = legalMoves.map(move => {
                let uci = move.from + move.to;
                if (move.promotion) {
                    uci += move.promotion;
                }
                return uci;
            });
            
            // Get move from AI
            const uciMove = await GrokAI.getBestMove(fen, legalMovesUCI);
            
            // Parse UCI move
            const from = uciMove.substring(0, 2);
            const to = uciMove.substring(2, 4);
            const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
            
            // Make the move
            const move = game.move({
                from: from,
                to: to,
                promotion: promotion
            });
            
            if (move) {
                // Store the move in history
                const moveNumber = Math.floor(moveHistory.length / 2) + 1;
                moveHistory.push({
                    move: move,
                    fen: game.fen(),
                    moveNumber: moveNumber
                });
                
                ChessBoard.render(game);
                updateStatus();
                updateMoveHistory();
                updateHistoryNavButtons();
            } else {
                console.error('AI attempted invalid move:', uciMove);
            }
        } catch (error) {
            console.error('Error during AI move:', error);
            updateStatus('AI Error: Unable to calculate a move at this time. Please try again.');
        } finally {
            isAIThinking = false;
            showAIThinking(false);
        }
    }
    
    /**
     * Show/hide AI thinking indicator
     * @param {boolean} show - Whether to show the indicator
     */
    function showAIThinking(show) {
        const indicator = document.getElementById('ai-thinking');
        if (show) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }
    
    /**
     * Update game status display
     * @param {string} customMessage - Optional custom message
     */
    function updateStatus(customMessage) {
        const turnElement = document.getElementById('current-turn');
        const statusElement = document.getElementById('game-status');
        
        // If viewing history, show that instead
        if (isViewingHistory) {
            turnElement.textContent = 'Viewing History';
            const moveData = moveHistory[currentViewIndex];
            const isWhite = currentViewIndex % 2 === 0;
            const moveSide = isWhite ? 'White' : 'Black';
            statusElement.textContent = `Move ${moveData.moveNumber}. ${moveSide}`;
            statusElement.style.color = '#3498db';
            return;
        }
        
        // Update turn
        const turn = game.turn() === 'w' ? 'White' : 'Black';
        turnElement.textContent = turn;
        
        // Update status
        if (customMessage) {
            statusElement.textContent = customMessage;
            statusElement.style.color = '#e74c3c';
        } else if (game.in_checkmate()) {
            statusElement.textContent = 'Checkmate!';
            statusElement.style.color = '#e74c3c';
        } else if (game.in_stalemate()) {
            statusElement.textContent = 'Stalemate';
            statusElement.style.color = '#f39c12';
        } else if (game.in_draw()) {
            statusElement.textContent = 'Draw';
            statusElement.style.color = '#f39c12';
        } else if (game.in_check()) {
            statusElement.textContent = 'Check!';
            statusElement.style.color = '#e67e22';
        } else {
            statusElement.textContent = 'Active';
            statusElement.style.color = '#27ae60';
        }
    }
    
    /**
     * Update move history display
     */
    function updateMoveHistory() {
        const historyElement = document.getElementById('move-history');
        
        if (moveHistory.length === 0) {
            historyElement.innerHTML = '<div style="color: #999; font-style: italic;">No moves yet</div>';
            return;
        }
        
        let html = '';
        for (let i = 0; i < moveHistory.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = moveHistory[i].move.san;
            const blackMove = moveHistory[i + 1] ? moveHistory[i + 1].move.san : '';
            
            const whiteClass = currentViewIndex === i ? 'selected' : '';
            const blackClass = currentViewIndex === i + 1 ? 'selected' : '';
            
            html += `<div class="move-entry">
                <span class="move-number">${moveNumber}.</span>
                <span class="move-item ${whiteClass}" data-index="${i}">${whiteMove}</span>`;
            
            if (blackMove) {
                html += `<span class="move-item ${blackClass}" data-index="${i + 1}">${blackMove}</span>`;
            }
            
            html += `</div>`;
        }
        
        historyElement.innerHTML = html;
        
        // Setup event delegation for move clicks (only once)
        if (!historyClickListenerAttached) {
            historyElement.addEventListener('click', function(e) {
                const moveItem = e.target.closest('.move-item');
                if (moveItem) {
                    const index = parseInt(moveItem.dataset.index);
                    viewMoveAtIndex(index);
                }
            });
            historyClickListenerAttached = true;
        }
        
        // Scroll to selected move or bottom
        if (currentViewIndex >= 0) {
            const selectedMove = historyElement.querySelector('.move-item.selected');
            if (selectedMove) {
                selectedMove.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } else {
            historyElement.scrollTop = historyElement.scrollHeight;
        }
    }
    
    /**
     * View a specific move in the history
     * @param {number} index - Index in the move history array
     */
    function viewMoveAtIndex(index) {
        if (index < 0 || index >= moveHistory.length) {
            return;
        }
        
        isViewingHistory = true;
        currentViewIndex = index;
        
        // Load the position at this index
        const fen = moveHistory[index].fen;
        game.load(fen);
        
        // Update the board and UI
        ChessBoard.render(game);
        updateStatus();
        updateMoveHistory();
        updateHistoryNavButtons();
    }
    
    /**
     * Show the previous move in history
     */
    function showPreviousMove() {
        if (!isViewingHistory) {
            // Start viewing from the last move
            if (moveHistory.length > 0) {
                viewMoveAtIndex(moveHistory.length - 1);
            }
        } else if (currentViewIndex > 0) {
            viewMoveAtIndex(currentViewIndex - 1);
        }
    }
    
    /**
     * Show the next move in history
     */
    function showNextMove() {
        if (isViewingHistory && currentViewIndex < moveHistory.length - 1) {
            viewMoveAtIndex(currentViewIndex + 1);
        } else if (isViewingHistory && currentViewIndex === moveHistory.length - 1) {
            returnToCurrent();
        }
    }
    
    /**
     * Return to the current game position
     */
    function returnToCurrent() {
        if (!isViewingHistory) {
            return;
        }
        
        isViewingHistory = false;
        currentViewIndex = -1;
        
        // Load the current position (last move in history or starting position)
        if (moveHistory.length > 0) {
            const currentFen = moveHistory[moveHistory.length - 1].fen;
            game.load(currentFen);
        } else {
            game.reset();
        }
        
        // Update the board and UI
        ChessBoard.render(game);
        updateStatus();
        updateMoveHistory();
        updateHistoryNavButtons();
    }
    
    /**
     * Update the state of history navigation buttons
     */
    function updateHistoryNavButtons() {
        const prevBtn = document.getElementById('prev-move-btn');
        const nextBtn = document.getElementById('next-move-btn');
        const backBtn = document.getElementById('back-to-current-btn');
        
        if (prevBtn && nextBtn && backBtn) {
            // Show/hide back to current button
            if (isViewingHistory) {
                backBtn.style.display = 'block';
            } else {
                backBtn.style.display = 'none';
            }
            
            // Enable/disable navigation buttons
            if (moveHistory.length === 0) {
                prevBtn.disabled = true;
                nextBtn.disabled = true;
            } else if (!isViewingHistory) {
                prevBtn.disabled = false;
                nextBtn.disabled = true;
            } else {
                prevBtn.disabled = currentViewIndex <= 0;
                nextBtn.disabled = currentViewIndex >= moveHistory.length - 1;
            }
        }
    }
    
    /**
     * Start a new game
     */
    function newGame() {
        if (confirm('Start a new game?')) {
            // Reset game state
            selectedSquare = null;
            isAIThinking = false;
            showAIThinking(false);
            
            // Reset history navigation state
            moveHistory = [];
            isViewingHistory = false;
            currentViewIndex = -1;
            
            // Show color selection modal again
            showColorSelectionModal();
        }
    }
    
    /**
     * Flip the board
     */
    function flipBoard() {
        ChessBoard.flip();
        ChessBoard.render(game);
    }
    
    /**
     * Configure the game
     * @param {object} config - Configuration object
     */
    function configure(config) {
        Object.assign(CONFIG, config);
        
        // Update AI configuration
        if (config.GROK_API_KEY) {
            GrokAI.configure({
                GROK_API_KEY: config.GROK_API_KEY,
                AI_ENABLED: config.AI_ENABLED !== undefined ? config.AI_ENABLED : true
            });
        }
    }
    
    // Public API
    return {
        init,
        configure,
        CONFIG // Expose for debugging/configuration
    };
})();

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    ChessGame.init();
    
    // Display API key status
    if (!GrokAI.isConfigured()) {
        console.warn('Grok AI is not configured. Add your API key in js/ai.js to enable AI opponent.');
        console.info('Get your API key from: https://console.x.ai/');
    }
});
