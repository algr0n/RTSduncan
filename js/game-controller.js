/**
 * game-controller.js - Enhanced Game Controller with AI Provider System
 * Manages game flow with support for Human, Stockfish, and Grok players
 */

const GameController = (function() {
    'use strict';
    
    // Game state
    let game;
    let selectedSquare = null;
    let isAIThinking = false;
    let isPaused = false;
    let aiVsAiInterval = null;
    
    // Player configurations
    let gameMode = {
        white: {
            provider: AIManager.AIProvider.HUMAN,
            difficulty: AIManager.DifficultyLevel.INTERMEDIATE
        },
        black: {
            provider: AIManager.AIProvider.GROK,
            difficulty: AIManager.DifficultyLevel.INTERMEDIATE
        }
    };
    
    // History tracking
    let moveHistory = []; // Array of {move, fen, moveNumber, player}
    let isViewingHistory = false;
    let currentViewIndex = -1;
    
    // Configuration
    const CONFIG = {
        AI_DELAY: 800,           // Delay before AI moves (ms)
        AI_VS_AI_DELAY: 1500,    // Delay between moves in AI vs AI (ms)
        THINKING_TIME: null       // Optional thinking time for Stockfish (ms)
    };
    
    /**
     * Initialize the game controller
     * @param {object} mode - Game mode configuration
     */
    function init(mode = null) {
        if (mode) {
            gameMode = mode;
        }
        
        // Initialize chess.js game
        game = new Chess();
        
        // Reset state
        moveHistory = [];
        isViewingHistory = false;
        currentViewIndex = -1;
        selectedSquare = null;
        isAIThinking = false;
        isPaused = false;
        
        // Initialize board
        const shouldFlip = isPlayerBlack();
        ChessBoard.init('chess-board', handleSquareClick, shouldFlip);
        ChessBoard.render(game);
        
        // Update UI
        updateAllUI();
        
        // If both players are AI or white is AI, start the game
        if (isAIvsAI() || getCurrentPlayerConfig().provider !== AIManager.AIProvider.HUMAN) {
            setTimeout(() => processAIMove(), CONFIG.AI_DELAY);
        }
    }
    
    /**
     * Set game mode
     * @param {object} mode - Game mode configuration
     */
    function setGameMode(mode) {
        gameMode = mode;
    }
    
    /**
     * Get current game mode
     * @returns {object} Current game mode
     */
    function getGameMode() {
        return { ...gameMode };
    }
    
    /**
     * Check if current game is AI vs AI
     * @returns {boolean}
     */
    function isAIvsAI() {
        return gameMode.white.provider !== AIManager.AIProvider.HUMAN &&
               gameMode.black.provider !== AIManager.AIProvider.HUMAN;
    }
    
    /**
     * Check if player is playing as black
     * @returns {boolean}
     */
    function isPlayerBlack() {
        return gameMode.white.provider !== AIManager.AIProvider.HUMAN &&
               gameMode.black.provider === AIManager.AIProvider.HUMAN;
    }
    
    /**
     * Get configuration for current player
     * @returns {object} Player configuration
     */
    function getCurrentPlayerConfig() {
        const turn = game.turn();
        return turn === 'w' ? gameMode.white : gameMode.black;
    }
    
    /**
     * Get configuration for player by color
     * @param {string} color - 'w' or 'b'
     * @returns {object} Player configuration
     */
    function getPlayerConfig(color) {
        return color === 'w' ? gameMode.white : gameMode.black;
    }
    
    /**
     * Handle square click
     * @param {string} square - Square name (e.g., 'e4')
     */
    function handleSquareClick(square) {
        // Don't allow interaction while viewing history
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
        
        // Check if current player is human
        const currentConfig = getCurrentPlayerConfig();
        if (currentConfig.provider !== AIManager.AIProvider.HUMAN) {
            return; // AI's turn, no human input
        }
        
        // Handle piece selection and movement
        if (!selectedSquare) {
            selectSquare(square);
        } else {
            if (square === selectedSquare) {
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
        
        if (piece && piece.color === game.turn()) {
            selectedSquare = square;
            const moves = game.moves({ square: square, verbose: true });
            ChessBoard.setSelectedSquare(square, moves);
        }
    }
    
    /**
     * Deselect current square
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
        const piece = game.get(from);
        const isPromotion = piece && piece.type === 'p' && 
                          (to[1] === '8' || to[1] === '1');
        
        const move = game.move({
            from: from,
            to: to,
            promotion: isPromotion ? 'q' : undefined
        });
        
        if (move) {
            onMoveMade(move);
            deselectSquare();
            
            // Process AI move after delay if not game over
            if (!game.game_over()) {
                const nextConfig = getCurrentPlayerConfig();
                if (nextConfig.provider !== AIManager.AIProvider.HUMAN) {
                    setTimeout(() => processAIMove(), CONFIG.AI_DELAY);
                }
            }
        } else {
            // Invalid move, try selecting destination
            deselectSquare();
            selectSquare(to);
        }
    }
    
    /**
     * Process AI move
     */
    async function processAIMove() {
        if (isAIThinking || game.game_over() || isPaused) {
            return;
        }
        
        const currentConfig = getCurrentPlayerConfig();
        
        // Skip if human player
        if (currentConfig.provider === AIManager.AIProvider.HUMAN) {
            return;
        }
        
        isAIThinking = true;
        updateAIStatus(true, currentConfig);
        
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
            const uciMove = await AIManager.getBestMove(
                currentConfig,
                fen,
                legalMovesUCI,
                CONFIG.THINKING_TIME
            );
            
            // Parse and make move
            const from = uciMove.substring(0, 2);
            const to = uciMove.substring(2, 4);
            const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
            
            const move = game.move({
                from: from,
                to: to,
                promotion: promotion
            });
            
            if (move) {
                onMoveMade(move);
                
                // Continue AI vs AI game
                if (isAIvsAI() && !game.game_over() && !isPaused) {
                    setTimeout(() => processAIMove(), CONFIG.AI_VS_AI_DELAY);
                } else if (!game.game_over() && !isPaused) {
                    // Next player is also AI
                    const nextConfig = getCurrentPlayerConfig();
                    if (nextConfig.provider !== AIManager.AIProvider.HUMAN) {
                        setTimeout(() => processAIMove(), CONFIG.AI_DELAY);
                    }
                }
            } else {
                console.error('AI attempted invalid move:', uciMove);
            }
        } catch (error) {
            console.error('Error during AI move:', error);
            updateStatus(`AI Error: ${error.message}`);
        } finally {
            isAIThinking = false;
            updateAIStatus(false);
        }
    }
    
    /**
     * Called when a move is made
     * @param {object} move - Move object from chess.js
     */
    function onMoveMade(move) {
        const moveNumber = Math.floor(moveHistory.length / 2) + 1;
        const playerConfig = getPlayerConfig(move.color);
        
        moveHistory.push({
            move: move,
            fen: game.fen(),
            moveNumber: moveNumber,
            player: {
                provider: playerConfig.provider,
                difficulty: playerConfig.difficulty
            }
        });
        
        ChessBoard.render(game);
        updateAllUI();
    }
    
    /**
     * Update all UI elements
     */
    function updateAllUI() {
        updateStatus();
        updateMoveHistory();
        updateHistoryNavButtons();
        updatePlayerIndicators();
    }
    
    /**
     * Update game status display
     * @param {string} customMessage - Optional custom message
     */
    function updateStatus(customMessage) {
        const turnElement = document.getElementById('current-turn');
        const statusElement = document.getElementById('game-status');
        
        if (!turnElement || !statusElement) return;
        
        if (isViewingHistory) {
            turnElement.textContent = 'Viewing History';
            const moveData = moveHistory[currentViewIndex];
            const isWhite = currentViewIndex % 2 === 0;
            const moveSide = isWhite ? 'White' : 'Black';
            statusElement.textContent = `Move ${moveData.moveNumber}. ${moveSide}`;
            statusElement.style.color = '#3498db';
            return;
        }
        
        const turn = game.turn() === 'w' ? 'White' : 'Black';
        const currentConfig = getCurrentPlayerConfig();
        const providerName = AIManager.getProviderDisplayName(currentConfig.provider);
        
        turnElement.textContent = `${turn} (${providerName})`;
        
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
     * Update AI status indicator
     * @param {boolean} show - Whether to show AI thinking
     * @param {object} config - Optional player config
     */
    function updateAIStatus(show, config = null) {
        const indicator = document.getElementById('ai-thinking');
        if (!indicator) return;
        
        if (show && config) {
            const providerName = AIManager.getProviderDisplayName(config.provider);
            const difficultyName = AIManager.getDifficultyDisplayName(config.difficulty);
            indicator.innerHTML = `<span class="spinner">⟳</span> ${providerName} (${difficultyName}) is thinking...`;
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }
    
    /**
     * Update move history display
     */
    function updateMoveHistory() {
        const historyElement = document.getElementById('move-history');
        if (!historyElement) return;
        
        if (moveHistory.length === 0) {
            historyElement.innerHTML = '<div style="color: #999; font-style: italic;">No moves yet</div>';
            return;
        }
        
        let html = '';
        for (let i = 0; i < moveHistory.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = moveHistory[i];
            const blackMove = moveHistory[i + 1];
            
            const whiteClass = currentViewIndex === i ? 'selected' : '';
            const blackClass = currentViewIndex === i + 1 ? 'selected' : '';
            
            const whiteProvider = AIManager.getProviderDisplayName(whiteMove.player.provider);
            const whiteTitle = whiteMove.player.provider !== AIManager.AIProvider.HUMAN 
                ? `${whiteProvider} (${whiteMove.player.difficulty})` 
                : whiteProvider;
            
            html += `<div class="move-entry">
                <span class="move-number">${moveNumber}.</span>
                <span class="move-item ${whiteClass}" data-index="${i}" title="${whiteTitle}">${whiteMove.move.san}</span>`;
            
            if (blackMove) {
                const blackProvider = AIManager.getProviderDisplayName(blackMove.player.provider);
                const blackTitle = blackMove.player.provider !== AIManager.AIProvider.HUMAN
                    ? `${blackProvider} (${blackMove.player.difficulty})`
                    : blackProvider;
                html += `<span class="move-item ${blackClass}" data-index="${i + 1}" title="${blackTitle}">${blackMove.move.san}</span>`;
            }
            
            html += `</div>`;
        }
        
        historyElement.innerHTML = html;
        
        // Add click listeners
        historyElement.querySelectorAll('.move-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                viewMoveAtIndex(index);
            });
        });
        
        // Scroll to bottom or selected move
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
     * Update player indicators
     */
    function updatePlayerIndicators() {
        // Update white player indicator
        const whiteProviderEl = document.getElementById('white-provider');
        const whiteDifficultyEl = document.getElementById('white-difficulty');
        
        if (whiteProviderEl) {
            whiteProviderEl.value = gameMode.white.provider;
        }
        if (whiteDifficultyEl) {
            whiteDifficultyEl.value = gameMode.white.difficulty;
            whiteDifficultyEl.style.display = gameMode.white.provider === AIManager.AIProvider.HUMAN ? 'none' : 'inline-block';
        }
        
        // Update black player indicator
        const blackProviderEl = document.getElementById('black-provider');
        const blackDifficultyEl = document.getElementById('black-difficulty');
        
        if (blackProviderEl) {
            blackProviderEl.value = gameMode.black.provider;
        }
        if (blackDifficultyEl) {
            blackDifficultyEl.value = gameMode.black.difficulty;
            blackDifficultyEl.style.display = gameMode.black.provider === AIManager.AIProvider.HUMAN ? 'none' : 'inline-block';
        }
    }
    
    /**
     * Update history navigation buttons
     */
    function updateHistoryNavButtons() {
        const prevBtn = document.getElementById('prev-move-btn');
        const nextBtn = document.getElementById('next-move-btn');
        const backBtn = document.getElementById('back-to-current-btn');
        
        if (!prevBtn || !nextBtn || !backBtn) return;
        
        if (isViewingHistory) {
            backBtn.style.display = 'block';
        } else {
            backBtn.style.display = 'none';
        }
        
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
    
    /**
     * View move at specific index
     * @param {number} index - Move index
     */
    function viewMoveAtIndex(index) {
        if (index < 0 || index >= moveHistory.length) {
            return;
        }
        
        isViewingHistory = true;
        currentViewIndex = index;
        
        const fen = moveHistory[index].fen;
        game.load(fen);
        
        ChessBoard.render(game);
        updateAllUI();
    }
    
    /**
     * Show previous move
     */
    function showPreviousMove() {
        if (!isViewingHistory) {
            if (moveHistory.length > 0) {
                viewMoveAtIndex(moveHistory.length - 1);
            }
        } else if (currentViewIndex > 0) {
            viewMoveAtIndex(currentViewIndex - 1);
        }
    }
    
    /**
     * Show next move
     */
    function showNextMove() {
        if (isViewingHistory && currentViewIndex < moveHistory.length - 1) {
            viewMoveAtIndex(currentViewIndex + 1);
        } else if (isViewingHistory && currentViewIndex === moveHistory.length - 1) {
            returnToCurrent();
        }
    }
    
    /**
     * Return to current position
     */
    function returnToCurrent() {
        if (!isViewingHistory) {
            return;
        }
        
        isViewingHistory = false;
        currentViewIndex = -1;
        
        if (moveHistory.length > 0) {
            const currentFen = moveHistory[moveHistory.length - 1].fen;
            game.load(currentFen);
        } else {
            game.reset();
        }
        
        ChessBoard.render(game);
        updateAllUI();
    }
    
    /**
     * Pause AI vs AI game
     */
    function pause() {
        isPaused = true;
    }
    
    /**
     * Resume AI vs AI game
     */
    function resume() {
        isPaused = false;
        if (isAIvsAI() && !game.game_over() && !isAIThinking) {
            setTimeout(() => processAIMove(), CONFIG.AI_DELAY);
        }
    }
    
    /**
     * Set AI vs AI speed
     * @param {number} delay - Delay in milliseconds
     */
    function setAISpeed(delay) {
        CONFIG.AI_VS_AI_DELAY = delay;
    }
    
    /**
     * Get game instance
     * @returns {object} Chess.js game instance
     */
    function getGame() {
        return game;
    }
    
    /**
     * Get move history
     * @returns {array} Move history
     */
    function getMoveHistory() {
        return [...moveHistory];
    }
    
    /**
     * Export game to PGN
     * @returns {string} PGN string
     */
    function exportPGN() {
        const headers = game.header();
        headers['White'] = `${AIManager.getProviderDisplayName(gameMode.white.provider)} (${gameMode.white.difficulty})`;
        headers['Black'] = `${AIManager.getProviderDisplayName(gameMode.black.provider)} (${gameMode.black.difficulty})`;
        
        return game.pgn();
    }
    
    // Public API
    return {
        init,
        setGameMode,
        getGameMode,
        isAIvsAI,
        handleSquareClick,
        showPreviousMove,
        showNextMove,
        returnToCurrent,
        pause,
        resume,
        setAISpeed,
        getGame,
        getMoveHistory,
        exportPGN,
        CONFIG
    };
})();
