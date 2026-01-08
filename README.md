# Chess Game with AI Players

A fully functional web-based chess game featuring multiple AI opponents including Stockfish engine and xAI's Grok API.

![Chess Game](https://img.shields.io/badge/Status-Ready-green) ![License](https://img.shields.io/badge/License-Unlicense-blue)

## Features

### Core Chess Gameplay
- ✨ **Complete Chess Rules**: Full support for all standard chess rules including:
  - Castling (kingside and queenside)
  - En passant captures
  - Pawn promotion (auto-promotes to queen)
  - Check and checkmate detection
  - Stalemate and draw conditions

- 🎮 **Intuitive Interface**:
  - Click-to-move gameplay
  - Visual feedback for selected pieces
  - Legal move highlighting
  - Move history tracking with player attribution
  - Game status display
  - Board flip option
  - History navigation (view previous positions)

### AI Opponents System
- 🤖 **Multiple AI Providers**:
  - **Stockfish**: Classic chess engine with UCI protocol
  - **Grok AI**: xAI's advanced AI (grok-4-1-fast-reasoning model)
  - **Human**: Local player input

- 🎯 **Difficulty Levels**: Each AI supports 4 difficulty levels:
  - **Beginner**: Easy for new players
  - **Intermediate**: Balanced gameplay
  - **Advanced**: Challenging strategic play
  - **Master**: Maximum strength

- ⚙️ **Flexible Game Modes**:
  - **Player vs Stockfish**: Classic engine opponent
  - **Player vs Grok AI**: AI-powered opponent
  - **Stockfish vs Grok**: Watch AI battle
  - **Custom Setup**: Configure both sides independently
  - **AI vs AI**: Watch computer games with adjustable speed

### Advanced Features
- 🎬 **AI vs AI Controls**:
  - Adjustable game speed (slow, normal, fast, very fast)
  - Pause/resume functionality
  - Real-time move visualization

- 📊 **Enhanced Move History**:
  - Shows which AI made each move
  - Displays difficulty level for each player
  - Hover tooltips with player information
  - Click moves to review game positions

- 💾 **PGN Export**: Save games with AI metadata
- 🔄 **Smart AI Status**: Shows which AI is thinking and at what difficulty
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Quick Start

### Option 1: Run Locally (No Server Required)

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Select your game mode from the setup screen
4. Start playing!

The game works immediately in Player vs Player mode. AI opponents require configuration (see below).

### Option 2: Enable AI Opponents

#### Stockfish Configuration

Stockfish is loaded automatically from CDN or local installation. No API key required!

- The engine initializes on page load
- If CDN is blocked, you can install locally: `npm install stockfish`
- The game falls back gracefully if Stockfish is unavailable

#### Grok AI Configuration

To play against Grok AI:

1. Get your API key from [xAI Console](https://console.x.ai/)

2. **Option A (Recommended)**: Add a configuration script to `index.html` before the game scripts:
   ```html
   <!-- Add this before the game scripts at the end of the file -->
   <script>
       window.CHESS_CONFIG = {
           GROK_API_KEY: 'xai-your-actual-api-key-here'
       };
   </script>
   
   <!-- Chess.js library -->
   <script src="js/chess.min.js"></script>
   <!-- ... rest of scripts -->
   ```

3. **Option B**: Configure programmatically after the page loads via browser console:
   ```javascript
   ChessGame.configure({
       GROK_API_KEY: 'xai-your-actual-api-key-here'
   });
   ```

4. Save the file and refresh your browser

**Important Security Notes:**
- API keys should **NOT** be hardcoded in the JavaScript files
- Never commit API keys to version control
- Consider using environment variables for production deployments
- The game will fall back to random moves if no API key is configured

## How to Use

### Game Setup

1. **Quick Start Modes**: Choose from preset configurations:
   - **Player vs Stockfish**: You play against the Stockfish engine
   - **Player vs Grok AI**: You play against Grok
   - **Stockfish vs Grok**: Watch an AI battle
   - **Custom Setup**: Configure both players independently

2. **Custom Configuration**:
   - Select player type for White (Human/Stockfish/Grok AI)
   - Select player type for Black (Human/Stockfish/Grok AI)
   - Choose difficulty level for each AI player
   - Click "Start Game" to begin

### Making Moves
1. Click on a piece to select it (highlighted in green)
2. Legal moves will be shown with dots
3. Click on a highlighted square to move
4. Click the selected piece again to deselect

### Game Controls
- **New Game**: Start a fresh game with new setup
- **Flip Board**: Rotate the board 180 degrees
- **Export PGN**: Download game with AI metadata
- **History Navigation**: 
  - Previous/Next: Navigate through move history
  - Click moves: Jump to specific position
  - Back to Current: Return to live game

### AI vs AI Controls
When both players are AI, additional controls appear:
- **Speed Control**: Adjust delay between moves (slow/normal/fast/very fast)
- **Pause/Resume**: Control game flow
- Watch the AIs battle in real-time!

### Game Modes
- **Player vs AI**: Play against Stockfish or Grok at your chosen difficulty
- **AI vs AI**: Watch computer games, great for learning strategies
- **Player vs Player**: Local two-player mode (hot-seat)

## Technology Stack

- **HTML5**: Structure and layout
- **CSS3**: Styling with modern flexbox/grid
- **Vanilla JavaScript (ES6+)**: Game logic and interactivity
- **[chess.js](https://github.com/jhlywa/chess.js) v0.10.3**: Chess rules engine and move validation
- **[Stockfish](https://stockfishchess.org/)**: World-class chess engine (via UCI protocol)
- **xAI Grok API**: AI-powered chess opponent

**Note**: All core dependencies are included locally. No CDN dependencies required for basic functionality!

## Project Structure

```
/
├── index.html           # Main game page with setup modal
├── css/
│   └── style.css       # Complete game styling including AI UI
├── js/
│   ├── chess.min.js    # Chess.js library (v0.10.3)
│   ├── board.js        # Board rendering and UI interactions
│   ├── ai.js           # Grok AI integration
│   ├── stockfish-engine.js  # Stockfish engine wrapper
│   ├── ai-manager.js   # Unified AI provider management
│   ├── game-controller.js   # Enhanced game flow controller
│   └── ui-controller.js     # UI setup and modal management
├── assets/
│   ├── pieces/         # Chess piece images (placeholder)
│   └── sounds/         # Game sounds (placeholder)
├── node_modules/       # NPM dependencies (stockfish)
├── package.json        # Project dependencies
├── README.md           # This file
└── ASSETS.md           # Guide for custom chess piece assets
```

## Current Implementation

### Piece Rendering
Currently uses Unicode chess symbols (♔♕♖♗♘♙♚♛♜♝♞♟) for simplicity and zero dependencies. The code is structured to easily swap to image-based pieces - see `ASSETS.md` for details.

### AI Behavior

#### Stockfish Engine
- Uses UCI (Universal Chess Interface) protocol
- Skill level mapping by difficulty:
  - Beginner: Level 3 (depth 3)
  - Intermediate: Level 10 (depth 8)
  - Advanced: Level 15 (depth 12)
  - Master: Level 20 (depth 18)
- Validates all moves against legal move list
- Falls back gracefully if engine unavailable

#### Grok AI
- Sends board state to Grok API in FEN notation
- Difficulty-specific system prompts:
  - Beginner: Simple moves, basic tactics
  - Intermediate: Good strategy, center control
  - Advanced: Strong tactical play
  - Master: Deep analysis, best moves
- Requests moves in UCI format (e.g., `e2e4`)
- Validates returned move against legal moves
- Falls back to random legal move if API fails or returns invalid move
- Includes retry logic (3 attempts by default)

### AI Manager
- Unified interface for all AI providers
- Handles provider availability checking
- Manages difficulty translation
- Builds appropriate prompts per difficulty
- Validates and parses AI responses

## API Reference

### AI Manager (`AIManager`)

```javascript
// Get best move from any AI
await AIManager.getBestMove(config, fen, legalMoves, thinkingTime);

// Check provider availability
await AIManager.isProviderAvailable('stockfish');

// Create game mode
const mode = AIManager.createGameMode(
  'human', 'intermediate',    // White player
  'stockfish', 'advanced'     // Black player
);

// Get preset modes
const presets = AIManager.getPresetModes();
```

### Game Controller (`GameController`)

```javascript
// Initialize game
GameController.init(gameMode);

// Control AI vs AI
GameController.pause();
GameController.resume();
GameController.setAISpeed(1000); // milliseconds

// Export game
const pgn = GameController.exportPGN();
```

## Future Enhancements

Planned features for future versions:

- [x] Difficulty levels for AI (implemented!)
- [x] AI vs AI mode (implemented!)
- [x] Multiple AI providers (implemented!)
- [x] PGN export with metadata (implemented!)
- [ ] Opening book integration
- [ ] Position analysis and evaluation display
- [ ] Win/loss statistics tracking
- [ ] Time controls and chess clock
- [ ] Take-back move functionality
- [ ] Multiple themes and board styles
- [ ] Sound effects for moves
- [ ] Smooth animations for piece movements
- [ ] Multiplayer over network
- [ ] Tournament mode

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

Requires a modern browser with ES6 support.

## Troubleshooting

### Stockfish Not Loading
1. Check browser console (F12) for specific errors
2. Verify internet connection (for CDN loading)
3. Try installing locally: `npm install stockfish`
4. The game will fall back to random moves if unavailable
5. Check if browser extensions are blocking the CDN

### Grok AI Not Making Moves
1. Check browser console (F12) for error messages
2. Verify your API key is correctly set (see Quick Start)
3. Ensure you have an active internet connection
4. Check if you have remaining API credits at xAI Console
5. Review xAI API status page for service issues

### Board Not Displaying
1. Ensure you're opening `index.html` (not individual JS files)
2. Check browser console for JavaScript errors
3. Verify all files are in correct directories
4. Try refreshing the page (Ctrl+F5 / Cmd+Shift+R)

### Legal Moves Not Showing
This is controlled by the `chess.js` library. If moves seem incorrect, it's likely a valid chess rule you might not be familiar with (like en passant or pinned pieces).

### AI vs AI Not Running
1. Ensure both players are set to AI (not human)
2. Check that at least one AI provider is available
3. Use pause/resume controls if game seems stuck
4. Check browser console for errors

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## License

This project is released into the public domain under the [Unlicense](LICENSE). Use it however you want!

## Credits

- Chess engine: [chess.js](https://github.com/jhlywa/chess.js) by Jeff Hlywa
- Stockfish: [Stockfish Chess Engine](https://stockfishchess.org/) - World's strongest open-source chess engine
- AI: [Grok](https://x.ai/) by xAI
- Created for the RTSduncan repository

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the browser console for errors
3. Open an issue on GitHub
4. Check [xAI documentation](https://docs.x.ai/) for Grok API questions
5. Check [Stockfish documentation](https://github.com/official-stockfish/Stockfish) for engine questions

---

**Enjoy the game! ♔♛**
