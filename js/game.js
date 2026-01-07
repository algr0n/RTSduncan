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
    
    /**
     * Initialize the game
     */
    function init() {
        // Initialize chess.js game
        game = new Chess();
        
        // Initialize board
        ChessBoard.init('chess-board', handleSquareClick);
        ChessBoard.render(game);
        
        // Setup event listeners
        setupEventListeners();
        
        // Update UI
        updateStatus();
        updateMoveHistory();
        
        // If player is black, AI makes first move
        if (CONFIG.PLAYER_COLOR === 'black' && CONFIG.AI_ENABLED) {
            setTimeout(() => makeAIMove(), CONFIG.AI_DELAY);
        }
    }
    
    /**
     * Setup event listeners for controls
     */
    function setupEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', newGame);
        document.getElementById('flip-board-btn').addEventListener('click', flipBoard);
    }
    
    /**
     * Handle square click
     * @param {string} square - Square name (e.g., 'e4')
     */
    function handleSquareClick(square) {
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
            // Move was successful
            deselectSquare();
            ChessBoard.render(game);
            updateStatus();
            updateMoveHistory();
            
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
                ChessBoard.render(game);
                updateStatus();
                updateMoveHistory();
            } else {
                console.error('AI attempted invalid move:', uciMove);
            }
        } catch (error) {
            console.error('Error during AI move:', error);
            updateStatus('AI Error: ' + error.message);
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
        const history = game.history({ verbose: true });
        
        if (history.length === 0) {
            historyElement.innerHTML = '<div style="color: #999; font-style: italic;">No moves yet</div>';
            return;
        }
        
        let html = '';
        for (let i = 0; i < history.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = history[i].san;
            const blackMove = history[i + 1] ? history[i + 1].san : '';
            
            html += `<div class="move-entry">${moveNumber}. ${whiteMove} ${blackMove}</div>`;
        }
        
        historyElement.innerHTML = html;
        
        // Scroll to bottom
        historyElement.scrollTop = historyElement.scrollHeight;
    }
    
    /**
     * Start a new game
     */
    function newGame() {
        if (confirm('Start a new game?')) {
            game = new Chess();
            selectedSquare = null;
            isAIThinking = false;
            
            ChessBoard.clearSelection();
            ChessBoard.render(game);
            updateStatus();
            updateMoveHistory();
            showAIThinking(false);
            
            // If player is black, AI makes first move
            if (CONFIG.PLAYER_COLOR === 'black' && CONFIG.AI_ENABLED) {
                setTimeout(() => makeAIMove(), CONFIG.AI_DELAY);
            }
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
