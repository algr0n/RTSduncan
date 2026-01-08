/**
 * ui-controller.js - UI Controller for Game Setup and Controls
 * Handles modal interactions and game setup
 */

const UIController = (function() {
    'use strict';
    
    let setupListenersAttached = false;
    let gameListenersAttached = false;
    
    /**
     * Initialize UI controller
     */
    function init() {
        setupModalListeners();
        showSetupModal();
    }
    
    /**
     * Setup modal event listeners
     */
    function setupModalListeners() {
        if (setupListenersAttached) return;
        
        // Quick start mode buttons
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                handleModeSelection(mode);
            });
        });
        
        // Provider selection change handlers
        const whiteProvider = document.getElementById('white-provider');
        const blackProvider = document.getElementById('black-provider');
        
        if (whiteProvider) {
            whiteProvider.addEventListener('change', () => {
                toggleDifficultyVisibility('white', whiteProvider.value);
            });
        }
        
        if (blackProvider) {
            blackProvider.addEventListener('change', () => {
                toggleDifficultyVisibility('black', blackProvider.value);
            });
        }
        
        // Start custom game button
        const startCustomBtn = document.getElementById('start-custom-game');
        if (startCustomBtn) {
            startCustomBtn.addEventListener('click', startCustomGame);
        }
        
        setupListenersAttached = true;
    }
    
    /**
     * Setup game control listeners
     */
    function setupGameListeners() {
        if (gameListenersAttached) return;
        
        const newGameBtn = document.getElementById('new-game-btn');
        const flipBoardBtn = document.getElementById('flip-board-btn');
        const exportPGNBtn = document.getElementById('export-pgn-btn');
        const prevMoveBtn = document.getElementById('prev-move-btn');
        const nextMoveBtn = document.getElementById('next-move-btn');
        const backToCurrentBtn = document.getElementById('back-to-current-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resumeBtn = document.getElementById('resume-btn');
        const aiSpeedSelect = document.getElementById('ai-speed');
        
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                if (confirm('Start a new game?')) {
                    showSetupModal();
                }
            });
        }
        
        if (flipBoardBtn) {
            flipBoardBtn.addEventListener('click', () => {
                ChessBoard.flip();
                const game = GameController.getGame();
                if (game) {
                    ChessBoard.render(game);
                }
            });
        }
        
        if (exportPGNBtn) {
            exportPGNBtn.addEventListener('click', exportGamePGN);
        }
        
        if (prevMoveBtn) {
            prevMoveBtn.addEventListener('click', () => GameController.showPreviousMove());
        }
        
        if (nextMoveBtn) {
            nextMoveBtn.addEventListener('click', () => GameController.showNextMove());
        }
        
        if (backToCurrentBtn) {
            backToCurrentBtn.addEventListener('click', () => GameController.returnToCurrent());
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                GameController.pause();
                pauseBtn.style.display = 'none';
                resumeBtn.style.display = 'inline-block';
            });
        }
        
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                GameController.resume();
                resumeBtn.style.display = 'none';
                pauseBtn.style.display = 'inline-block';
            });
        }
        
        if (aiSpeedSelect) {
            aiSpeedSelect.addEventListener('change', () => {
                const delay = parseInt(aiSpeedSelect.value);
                GameController.setAISpeed(delay);
            });
        }
        
        gameListenersAttached = true;
    }
    
    /**
     * Show setup modal
     */
    function showSetupModal() {
        const modal = document.getElementById('setup-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }
    
    /**
     * Hide setup modal
     */
    function hideSetupModal() {
        const modal = document.getElementById('setup-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    /**
     * Handle mode selection
     * @param {string} mode - Selected mode
     */
    function handleModeSelection(mode) {
        const customConfig = document.getElementById('custom-config');
        
        if (mode === 'custom') {
            // Show custom configuration
            if (customConfig) {
                customConfig.style.display = 'block';
            }
        } else {
            // Start game with preset mode
            const gameMode = getPresetGameMode(mode);
            if (gameMode) {
                startGame(gameMode);
            }
        }
    }
    
    /**
     * Get preset game mode configuration
     * @param {string} mode - Mode identifier
     * @returns {object} Game mode configuration
     */
    function getPresetGameMode(mode) {
        const presets = AIManager.getPresetModes();
        
        switch (mode) {
            case 'player-vs-stockfish':
                return presets.playerVsStockfish;
            case 'player-vs-grok':
                return presets.playerVsGrok;
            case 'stockfish-vs-grok':
                return presets.stockfishVsGrok;
            default:
                return null;
        }
    }
    
    /**
     * Start custom game with configured settings
     */
    async function startCustomGame() {
        const whiteProvider = document.getElementById('white-provider').value;
        const whiteDifficulty = document.getElementById('white-difficulty').value;
        const blackProvider = document.getElementById('black-provider').value;
        const blackDifficulty = document.getElementById('black-difficulty').value;
        
        // Check if providers are available
        const whiteAvailable = await AIManager.isProviderAvailable(whiteProvider);
        const blackAvailable = await AIManager.isProviderAvailable(blackProvider);
        
        if (!whiteAvailable && whiteProvider !== 'human') {
            alert(`${AIManager.getProviderDisplayName(whiteProvider)} is not available. Please check your configuration.`);
            return;
        }
        
        if (!blackAvailable && blackProvider !== 'human') {
            alert(`${AIManager.getProviderDisplayName(blackProvider)} is not available. Please check your configuration.`);
            return;
        }
        
        const gameMode = AIManager.createGameMode(
            whiteProvider, whiteDifficulty,
            blackProvider, blackDifficulty
        );
        
        startGame(gameMode);
    }
    
    /**
     * Start game with given mode
     * @param {object} gameMode - Game mode configuration
     */
    function startGame(gameMode) {
        hideSetupModal();
        setupGameListeners();
        
        // Show AI vs AI controls if both players are AI
        const aiVsAiControls = document.getElementById('ai-vs-ai-controls');
        if (aiVsAiControls) {
            const isAIvsAI = gameMode.white.provider !== AIManager.AIProvider.HUMAN &&
                            gameMode.black.provider !== AIManager.AIProvider.HUMAN;
            aiVsAiControls.style.display = isAIvsAI ? 'block' : 'none';
        }
        
        // Initialize game controller
        GameController.setGameMode(gameMode);
        GameController.init(gameMode);
    }
    
    /**
     * Toggle difficulty visibility based on provider selection
     * @param {string} color - 'white' or 'black'
     * @param {string} provider - Selected provider
     */
    function toggleDifficultyVisibility(color, provider) {
        const difficultyGroup = document.getElementById(`${color}-difficulty-group`);
        if (difficultyGroup) {
            difficultyGroup.style.display = provider === 'human' ? 'none' : 'block';
        }
    }
    
    /**
     * Export game to PGN
     */
    function exportGamePGN() {
        try {
            const pgn = GameController.exportPGN();
            const gameMode = GameController.getGameMode();
            
            // Create enhanced PGN with AI metadata
            const whitePlayer = `${AIManager.getProviderDisplayName(gameMode.white.provider)}` +
                              (gameMode.white.provider !== AIManager.AIProvider.HUMAN ? ` (${gameMode.white.difficulty})` : '');
            const blackPlayer = `${AIManager.getProviderDisplayName(gameMode.black.provider)}` +
                              (gameMode.black.provider !== AIManager.AIProvider.HUMAN ? ` (${gameMode.black.difficulty})` : '');
            
            const enhancedPGN = `[Event "Chess Game"]\n[White "${whitePlayer}"]\n[Black "${blackPlayer}"]\n[Date "${new Date().toISOString().split('T')[0]}"]\n\n${pgn}`;
            
            // Download PGN file
            const blob = new Blob([enhancedPGN], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chess-game-${Date.now()}.pgn`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('PGN exported successfully');
        } catch (error) {
            console.error('Error exporting PGN:', error);
            alert('Failed to export PGN');
        }
    }
    
    // Public API
    return {
        init
    };
})();

// Initialize UI when page loads
window.addEventListener('DOMContentLoaded', () => {
    UIController.init();
    
    // Display API key status
    if (!GrokAI.isConfigured()) {
        console.warn('Grok AI is not configured. Add your API key to enable Grok opponent.');
        console.info('Get your API key from: https://console.x.ai/');
    }
    
    // Try to initialize Stockfish
    StockfishEngine.init().then(ready => {
        if (ready) {
            console.log('Stockfish engine initialized successfully');
        } else {
            console.warn('Stockfish engine not available');
        }
    });
});
