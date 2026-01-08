/**
 * stockfish-engine.js - Stockfish Chess Engine Integration
 * Handles Stockfish engine communication via UCI protocol
 */

const StockfishEngine = (function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        ENABLED: true,
        // Stockfish CDN URL (using lila stockfish WASM)
        STOCKFISH_URL: 'https://chess.com/js/stockfish/stockfish.js',
        MAX_DEPTH: 20,
        DEFAULT_DEPTH: 10,
        TIMEOUT: 30000, // 30 seconds
        // Difficulty to skill level mapping
        SKILL_LEVELS: {
            beginner: 3,      // Skill level 1-5
            intermediate: 10, // Skill level 8-12
            advanced: 15,     // Skill level 13-17
            master: 20        // Skill level 18-20
        }
    };
    
    let engine = null;
    let engineReady = false;
    let currentCallback = null;
    let pendingCommands = [];
    
    /**
     * Initialize the Stockfish engine
     * @returns {Promise<boolean>} True if initialized successfully
     */
    async function init() {
        if (engine) {
            return true;
        }
        
        try {
            console.log('Initializing Stockfish engine...');
            
            // Try to use Web Worker-based Stockfish
            if (typeof Worker !== 'undefined') {
                // Load stockfish.js from CDN or local
                await loadStockfishScript();
                
                if (typeof STOCKFISH !== 'undefined') {
                    engine = STOCKFISH();
                } else if (typeof Stockfish !== 'undefined') {
                    engine = new Worker(Stockfish);
                } else {
                    throw new Error('Stockfish not available');
                }
                
                setupEngineHandlers();
                
                // Initialize UCI
                sendCommand('uci');
                
                // Wait for engine to be ready
                return await waitForReady();
            } else {
                console.warn('Web Workers not supported, Stockfish unavailable');
                return false;
            }
        } catch (error) {
            console.error('Failed to initialize Stockfish:', error);
            engine = null;
            engineReady = false;
            return false;
        }
    }
    
    /**
     * Load Stockfish script dynamically
     * @returns {Promise<void>}
     */
    function loadStockfishScript() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (typeof STOCKFISH !== 'undefined' || typeof Stockfish !== 'undefined') {
                resolve();
                return;
            }
            
            // Try to load from node_modules first (for local development)
            const localPath = './node_modules/stockfish/stockfish.js';
            const script = document.createElement('script');
            script.src = localPath;
            script.async = true;
            
            script.onload = () => {
                console.log('Stockfish loaded from local path');
                resolve();
            };
            
            script.onerror = () => {
                // Fallback: try CDN
                console.log('Local Stockfish not found, trying CDN...');
                const cdnScript = document.createElement('script');
                cdnScript.src = CONFIG.STOCKFISH_URL;
                cdnScript.async = true;
                
                cdnScript.onload = () => {
                    console.log('Stockfish loaded from CDN');
                    resolve();
                };
                
                cdnScript.onerror = () => {
                    console.warn('Failed to load Stockfish from both local and CDN');
                    // Resolve anyway, we'll use fallback
                    resolve();
                };
                
                document.head.appendChild(cdnScript);
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Setup engine message handlers
     */
    function setupEngineHandlers() {
        if (!engine) return;
        
        engine.onmessage = function(event) {
            const line = typeof event === 'string' ? event : event.data;
            handleEngineOutput(line);
        };
        
        // For some Stockfish implementations
        if (engine.addEventListener) {
            engine.addEventListener('message', function(event) {
                handleEngineOutput(event.data);
            });
        }
    }
    
    /**
     * Handle output from the engine
     * @param {string} line - Output line from engine
     */
    function handleEngineOutput(line) {
        console.log('Stockfish:', line);
        
        if (line.includes('uciok')) {
            engineReady = true;
            console.log('Stockfish engine ready');
        }
        
        if (line.startsWith('bestmove')) {
            const parts = line.split(' ');
            const move = parts[1];
            
            if (currentCallback) {
                currentCallback(move);
                currentCallback = null;
            }
        }
        
        // Process pending commands if engine is ready
        if (engineReady && pendingCommands.length > 0) {
            const cmd = pendingCommands.shift();
            sendCommandImmediate(cmd);
        }
    }
    
    /**
     * Send a command to the engine
     * @param {string} command - UCI command
     */
    function sendCommand(command) {
        if (!engine) {
            console.warn('Engine not initialized');
            return;
        }
        
        if (!engineReady && command !== 'uci') {
            pendingCommands.push(command);
            return;
        }
        
        sendCommandImmediate(command);
    }
    
    /**
     * Send command immediately to engine
     * @param {string} command - UCI command
     */
    function sendCommandImmediate(command) {
        console.log('Sending to Stockfish:', command);
        
        if (engine.postMessage) {
            engine.postMessage(command);
        } else if (typeof engine === 'function') {
            engine(command);
        }
    }
    
    /**
     * Wait for engine to be ready
     * @returns {Promise<boolean>}
     */
    function waitForReady() {
        return new Promise((resolve) => {
            const checkReady = () => {
                if (engineReady) {
                    resolve(true);
                } else {
                    setTimeout(checkReady, 100);
                }
            };
            
            // Timeout after 5 seconds
            setTimeout(() => {
                if (!engineReady) {
                    console.warn('Stockfish initialization timeout');
                    resolve(false);
                }
            }, 5000);
            
            checkReady();
        });
    }
    
    /**
     * Get the best move from Stockfish
     * @param {string} fen - Current position in FEN notation
     * @param {string} difficulty - Difficulty level (beginner, intermediate, advanced, master)
     * @param {number} thinkingTime - Optional time in milliseconds
     * @returns {Promise<string>} UCI move notation (e.g., 'e2e4')
     */
    async function getBestMove(fen, difficulty = 'intermediate', thinkingTime = null) {
        if (!engine || !engineReady) {
            const initialized = await init();
            if (!initialized) {
                throw new Error('Stockfish engine not available');
            }
        }
        
        return new Promise((resolve, reject) => {
            const skillLevel = CONFIG.SKILL_LEVELS[difficulty] || CONFIG.SKILL_LEVELS.intermediate;
            const depth = getDepthForDifficulty(difficulty);
            
            // Set skill level
            sendCommand(`setoption name Skill Level value ${skillLevel}`);
            
            // Set position
            sendCommand(`position fen ${fen}`);
            
            // Set callback for best move
            currentCallback = (move) => {
                resolve(move);
            };
            
            // Start analysis
            if (thinkingTime) {
                sendCommand(`go movetime ${thinkingTime}`);
            } else {
                sendCommand(`go depth ${depth}`);
            }
            
            // Timeout fallback
            setTimeout(() => {
                if (currentCallback) {
                    currentCallback = null;
                    reject(new Error('Stockfish timeout'));
                }
            }, CONFIG.TIMEOUT);
        });
    }
    
    /**
     * Get analysis depth based on difficulty
     * @param {string} difficulty - Difficulty level
     * @returns {number} Search depth
     */
    function getDepthForDifficulty(difficulty) {
        const depths = {
            beginner: 3,
            intermediate: 8,
            advanced: 12,
            master: 18
        };
        return depths[difficulty] || depths.intermediate;
    }
    
    /**
     * Check if Stockfish is ready
     * @returns {boolean}
     */
    function isReady() {
        return engine !== null && engineReady;
    }
    
    /**
     * Stop the engine
     */
    function stop() {
        if (engine) {
            sendCommand('stop');
            if (engine.terminate) {
                engine.terminate();
            }
            engine = null;
            engineReady = false;
        }
    }
    
    /**
     * Get engine configuration
     * @returns {object} Current configuration
     */
    function getConfig() {
        return { ...CONFIG };
    }
    
    // Public API
    return {
        init,
        getBestMove,
        isReady,
        stop,
        getConfig,
        CONFIG // Expose for debugging
    };
})();
