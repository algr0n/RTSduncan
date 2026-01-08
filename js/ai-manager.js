/**
 * ai-manager.js - Unified AI Manager
 * Manages both Stockfish and Grok AI providers with a unified interface
 */

const AIManager = (function() {
    'use strict';
    
    // AI Provider constants
    const AIProvider = {
        STOCKFISH: 'stockfish',
        GROK: 'grok',
        HUMAN: 'human'
    };
    
    const DifficultyLevel = {
        BEGINNER: 'beginner',
        INTERMEDIATE: 'intermediate',
        ADVANCED: 'advanced',
        MASTER: 'master'
    };
    
    // Configuration
    const CONFIG = {
        defaultDifficulty: DifficultyLevel.INTERMEDIATE,
        defaultThinkingTime: 1000, // milliseconds
        enableAIvsAI: true
    };
    
    /**
     * Get difficulty-based prompt for Grok
     * @param {string} difficulty - Difficulty level
     * @returns {string} System prompt
     */
    function getGrokPromptForDifficulty(difficulty) {
        const prompts = {
            beginner: 'You are a chess engine playing at beginner level. Make simple, reasonable moves. Consider basic tactics like captures and threats, but avoid deep calculations. Sometimes make suboptimal moves that a beginner would make.',
            intermediate: 'You are a chess engine playing at intermediate level. Make good strategic moves. Consider piece development, center control, and basic tactical combinations. Play solid chess but occasionally miss advanced tactics.',
            advanced: 'You are a chess engine playing at advanced level. Make strong moves with good tactical and positional understanding. Analyze multiple candidate moves, consider pawn structure, piece activity, and king safety.',
            master: 'You are a chess engine playing at master level. Make the best possible moves with deep tactical and strategic analysis. Calculate variations deeply, consider long-term plans, prophylactic moves, and subtle positional advantages.'
        };
        return prompts[difficulty] || prompts.intermediate;
    }
    
    /**
     * Build Grok-specific prompt
     * @param {string} fen - Current position in FEN notation
     * @param {array} legalMoves - Array of legal moves
     * @param {string} difficulty - Difficulty level
     * @returns {string} Full prompt
     */
    function buildGrokPrompt(fen, legalMoves, difficulty) {
        const movesStr = legalMoves.slice(0, 50).join(', ');
        const instruction = getGrokPromptForDifficulty(difficulty);
        
        return `${instruction}

Analyze this chess position and return the best move for your level.

Position (FEN): ${fen}

Available legal moves (UCI format): ${movesStr}

Return only the move in UCI notation (e.g., e2e4). No explanation needed.`;
    }
    
    /**
     * Get move from Stockfish
     * @param {string} fen - Current position in FEN notation
     * @param {string} difficulty - Difficulty level
     * @param {number} thinkingTime - Optional thinking time in milliseconds
     * @returns {Promise<string>} UCI move notation
     */
    async function getStockfishMove(fen, difficulty, thinkingTime = null) {
        try {
            // Ensure Stockfish is initialized
            if (!StockfishEngine.isReady()) {
                const initialized = await StockfishEngine.init();
                if (!initialized) {
                    throw new Error('Failed to initialize Stockfish');
                }
            }
            
            const move = await StockfishEngine.getBestMove(fen, difficulty, thinkingTime);
            return move;
        } catch (error) {
            console.error('Stockfish move error:', error);
            throw error;
        }
    }
    
    /**
     * Get move from Grok AI
     * @param {string} fen - Current position in FEN notation
     * @param {array} legalMoves - Array of legal moves in UCI format
     * @param {string} difficulty - Difficulty level
     * @returns {Promise<string>} UCI move notation
     */
    async function getGrokMove(fen, legalMoves, difficulty) {
        try {
            // Update Grok configuration with difficulty-specific prompt
            const originalGetBestMove = GrokAI.getBestMove;
            
            // Temporarily override buildPrompt in GrokAI
            const tempBuildPrompt = GrokAI.buildPrompt;
            GrokAI.buildPrompt = (f, m) => buildGrokPrompt(f, m, difficulty);
            
            const move = await GrokAI.getBestMove(fen, legalMoves);
            
            // Restore original buildPrompt
            if (tempBuildPrompt) {
                GrokAI.buildPrompt = tempBuildPrompt;
            }
            
            return move;
        } catch (error) {
            console.error('Grok move error:', error);
            throw error;
        }
    }
    
    /**
     * Get best move from specified AI provider
     * @param {object} config - AI configuration
     * @param {string} config.provider - AI provider (stockfish, grok, human)
     * @param {string} config.difficulty - Difficulty level
     * @param {string} fen - Current position in FEN notation
     * @param {array} legalMoves - Array of legal moves in UCI format
     * @param {number} thinkingTime - Optional thinking time in milliseconds
     * @returns {Promise<string>} UCI move notation
     */
    async function getBestMove(config, fen, legalMoves, thinkingTime = null) {
        const { provider, difficulty = CONFIG.defaultDifficulty } = config;
        
        if (provider === AIProvider.HUMAN) {
            throw new Error('Cannot get move for human player');
        }
        
        try {
            let move;
            
            if (provider === AIProvider.STOCKFISH) {
                move = await getStockfishMove(fen, difficulty, thinkingTime);
            } else if (provider === AIProvider.GROK) {
                move = await getGrokMove(fen, legalMoves, difficulty);
            } else {
                throw new Error(`Unknown AI provider: ${provider}`);
            }
            
            // Validate move
            if (move && legalMoves.includes(move)) {
                return move;
            } else {
                console.warn(`Invalid move ${move} from ${provider}, using random`);
                return getRandomMove(legalMoves);
            }
        } catch (error) {
            console.error(`Error getting move from ${provider}:`, error);
            // Fallback to random move
            return getRandomMove(legalMoves);
        }
    }
    
    /**
     * Get a random legal move (fallback)
     * @param {array} legalMoves - Array of legal moves
     * @returns {string} Random legal move in UCI notation
     */
    function getRandomMove(legalMoves) {
        if (!legalMoves || legalMoves.length === 0) {
            throw new Error('No legal moves available');
        }
        const randomIndex = Math.floor(Math.random() * legalMoves.length);
        return legalMoves[randomIndex];
    }
    
    /**
     * Check if a provider is available
     * @param {string} provider - AI provider name
     * @returns {Promise<boolean>} True if provider is available
     */
    async function isProviderAvailable(provider) {
        if (provider === AIProvider.HUMAN) {
            return true;
        }
        
        if (provider === AIProvider.STOCKFISH) {
            if (StockfishEngine.isReady()) {
                return true;
            }
            // Try to initialize
            return await StockfishEngine.init();
        }
        
        if (provider === AIProvider.GROK) {
            return GrokAI.isConfigured();
        }
        
        return false;
    }
    
    /**
     * Get display name for provider
     * @param {string} provider - AI provider
     * @returns {string} Display name
     */
    function getProviderDisplayName(provider) {
        const names = {
            [AIProvider.STOCKFISH]: 'Stockfish',
            [AIProvider.GROK]: 'Grok AI',
            [AIProvider.HUMAN]: 'Human'
        };
        return names[provider] || provider;
    }
    
    /**
     * Get display name for difficulty
     * @param {string} difficulty - Difficulty level
     * @returns {string} Display name
     */
    function getDifficultyDisplayName(difficulty) {
        const names = {
            [DifficultyLevel.BEGINNER]: 'Beginner',
            [DifficultyLevel.INTERMEDIATE]: 'Intermediate',
            [DifficultyLevel.ADVANCED]: 'Advanced',
            [DifficultyLevel.MASTER]: 'Master'
        };
        return names[difficulty] || difficulty;
    }
    
    /**
     * Create a game mode configuration
     * @param {string} whiteProvider - White player provider
     * @param {string} whiteDifficulty - White player difficulty
     * @param {string} blackProvider - Black player provider
     * @param {string} blackDifficulty - Black player difficulty
     * @returns {object} Game mode configuration
     */
    function createGameMode(whiteProvider, whiteDifficulty, blackProvider, blackDifficulty) {
        return {
            white: {
                provider: whiteProvider,
                difficulty: whiteDifficulty || CONFIG.defaultDifficulty
            },
            black: {
                provider: blackProvider,
                difficulty: blackDifficulty || CONFIG.defaultDifficulty
            }
        };
    }
    
    /**
     * Get preset game modes
     * @returns {object} Preset game modes
     */
    function getPresetModes() {
        return {
            playerVsStockfish: createGameMode(
                AIProvider.HUMAN, null,
                AIProvider.STOCKFISH, DifficultyLevel.INTERMEDIATE
            ),
            playerVsGrok: createGameMode(
                AIProvider.HUMAN, null,
                AIProvider.GROK, DifficultyLevel.INTERMEDIATE
            ),
            stockfishVsGrok: createGameMode(
                AIProvider.STOCKFISH, DifficultyLevel.ADVANCED,
                AIProvider.GROK, DifficultyLevel.ADVANCED
            ),
            stockfishVsStockfish: createGameMode(
                AIProvider.STOCKFISH, DifficultyLevel.MASTER,
                AIProvider.STOCKFISH, DifficultyLevel.BEGINNER
            ),
            grokVsGrok: createGameMode(
                AIProvider.GROK, DifficultyLevel.ADVANCED,
                AIProvider.GROK, DifficultyLevel.BEGINNER
            )
        };
    }
    
    /**
     * Configure the AI Manager
     * @param {object} config - Configuration options
     */
    function configure(config) {
        Object.assign(CONFIG, config);
    }
    
    // Public API
    return {
        // Constants
        AIProvider,
        DifficultyLevel,
        
        // Core functions
        getBestMove,
        isProviderAvailable,
        
        // Utility functions
        getProviderDisplayName,
        getDifficultyDisplayName,
        createGameMode,
        getPresetModes,
        
        // Configuration
        configure,
        CONFIG
    };
})();
