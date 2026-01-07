/**
 * ai.js - Grok AI Integration Module
 * Handles AI move generation using xAI's Grok API
 */

const GrokAI = (function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        // Get your API key from: https://console.x.ai/
        GROK_API_KEY: 'your-api-key-here',
        GROK_API_ENDPOINT: 'https://api.x.ai/v1/chat/completions',
        AI_ENABLED: true,
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000, // milliseconds
        MODEL: 'grok-beta' // or other available model
    };
    
    /**
     * Update API configuration
     * @param {object} config - Configuration object with API settings
     */
    function configure(config) {
        Object.assign(CONFIG, config);
    }
    
    /**
     * Get the best move from Grok AI
     * @param {string} fen - Current position in FEN notation
     * @param {array} legalMoves - Array of legal moves in UCI format
     * @returns {Promise<string>} UCI move notation (e.g., 'e2e4')
     */
    async function getBestMove(fen, legalMoves) {
        if (!CONFIG.AI_ENABLED) {
            console.log('AI is disabled, using random move');
            return getRandomMove(legalMoves);
        }
        
        if (!CONFIG.GROK_API_KEY || CONFIG.GROK_API_KEY === 'your-api-key-here') {
            console.warn('Grok API key not configured, using random move');
            return getRandomMove(legalMoves);
        }
        
        let lastError = null;
        
        // Retry logic
        for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
            try {
                console.log(`Attempt ${attempt} to get move from Grok AI...`);
                const move = await callGrokAPI(fen, legalMoves);
                
                if (move && isValidMove(move, legalMoves)) {
                    console.log(`Grok AI suggests: ${move}`);
                    return move;
                } else {
                    console.warn(`Invalid move received from Grok: ${move}`);
                    lastError = new Error('Invalid move from API');
                }
            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error);
                lastError = error;
                
                if (attempt < CONFIG.MAX_RETRIES) {
                    await sleep(CONFIG.RETRY_DELAY * attempt);
                }
            }
        }
        
        // Fallback to random move
        console.warn('All Grok API attempts failed, falling back to random move');
        console.error('Last error:', lastError);
        return getRandomMove(legalMoves);
    }
    
    /**
     * Call the Grok API to get a move
     * @param {string} fen - Current position in FEN notation
     * @param {array} legalMoves - Array of legal moves in UCI format
     * @returns {Promise<string>} UCI move notation
     */
    async function callGrokAPI(fen, legalMoves) {
        const prompt = buildPrompt(fen, legalMoves);
        
        const response = await fetch(CONFIG.GROK_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.GROK_API_KEY}`
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a chess engine. You analyze positions and suggest moves. Always respond with only the move in UCI notation (e.g., e2e4, e7e8q for promotion). No explanations or additional text.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 50
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
        }
        
        const data = await response.json();
        
        // Extract move from response
        if (data.choices && data.choices.length > 0) {
            const content = data.choices[0].message.content.trim();
            return parseMove(content);
        }
        
        throw new Error('No move in API response');
    }
    
    /**
     * Build the prompt for the AI
     * @param {string} fen - Current position in FEN notation
     * @param {array} legalMoves - Array of legal moves
     * @returns {string} Formatted prompt
     */
    function buildPrompt(fen, legalMoves) {
        const movesStr = legalMoves.slice(0, 50).join(', '); // Limit moves to avoid token limits
        return `Analyze this chess position and return the best move.

Position (FEN): ${fen}

Available legal moves (UCI format): ${movesStr}

Return only the best move in UCI notation (e.g., e2e4). No explanation needed.`;
    }
    
    /**
     * Parse move from AI response
     * @param {string} response - AI response text
     * @returns {string} UCI move notation
     */
    function parseMove(response) {
        // Remove any common prefixes/suffixes and whitespace
        let move = response.toLowerCase().trim();
        
        // Remove common phrases
        move = move.replace(/^(move:|best move:|i suggest:|i recommend:)\s*/i, '');
        move = move.replace(/[.!?,;]$/, '');
        
        // Extract move pattern (e.g., e2e4, e7e8q)
        const movePattern = /\b([a-h][1-8][a-h][1-8][qrbn]?)\b/;
        const match = move.match(movePattern);
        
        if (match) {
            return match[1];
        }
        
        // If no pattern found, return the cleaned response
        return move;
    }
    
    /**
     * Check if a move is valid
     * @param {string} move - Move in UCI notation
     * @param {array} legalMoves - Array of legal moves
     * @returns {boolean} True if move is legal
     */
    function isValidMove(move, legalMoves) {
        return legalMoves.includes(move);
    }
    
    /**
     * Get a random legal move
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
     * Sleep for a specified duration
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Promise that resolves after the delay
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Check if AI is configured and enabled
     * @returns {boolean} True if AI is ready to use
     */
    function isConfigured() {
        return CONFIG.AI_ENABLED && 
               CONFIG.GROK_API_KEY && 
               CONFIG.GROK_API_KEY !== 'your-api-key-here';
    }
    
    // Public API
    return {
        configure,
        getBestMove,
        getRandomMove,
        isConfigured,
        CONFIG // Expose for debugging/configuration
    };
})();
