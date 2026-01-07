# Chess Game with Grok AI

A fully functional web-based chess game featuring integration with xAI's Grok API for AI opponent gameplay.

![Chess Game](https://img.shields.io/badge/Status-Ready-green) ![License](https://img.shields.io/badge/License-Unlicense-blue)

## Features

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
  - Move history tracking
  - Game status display
  - Board flip option

- 🤖 **Grok AI Integration**:
  - Play against xAI's Grok AI
  - Intelligent move selection
  - Automatic fallback to random moves if API unavailable
  - Retry logic for failed API calls
  - Visual "AI thinking" indicator

- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Quick Start

### Option 1: Run Locally (No Server Required)

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start playing!

The game will work immediately in Player vs Player mode or with random AI moves.

### Option 2: Enable Grok AI Opponent

To play against the Grok AI:

1. Get your API key from [xAI Console](https://console.x.ai/)
2. Open `js/ai.js` in a text editor
3. Find the `CONFIG` object at the top of the file
4. Replace `'your-api-key-here'` with your actual API key:
   ```javascript
   const CONFIG = {
       GROK_API_KEY: 'xai-your-actual-api-key-here',
       GROK_API_ENDPOINT: 'https://api.x.ai/v1/chat/completions',
       AI_ENABLED: true,
       MAX_RETRIES: 3,
       RETRY_DELAY: 1000,
       MODEL: 'grok-beta'
   };
   ```
5. Save the file and refresh your browser

## How to Get Grok API Access

1. Visit [xAI Console](https://console.x.ai/)
2. Sign up or log in
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key and add it to `js/ai.js` as described above

**Note**: The Grok API may require payment or have usage limits. Check xAI's pricing and terms of service.

## Game Controls

### Making Moves
1. Click on a piece to select it (highlighted in green)
2. Legal moves will be shown with dots
3. Click on a highlighted square to move
4. Click the selected piece again to deselect

### Buttons
- **New Game**: Start a fresh game
- **Flip Board**: Rotate the board 180 degrees

### Game Modes
- **Player vs AI** (default): You play as White, AI plays as Black
- **Player vs Player**: Play against another human (AI disabled)

## Configuration

You can customize the game by modifying configuration in `js/game.js`:

```javascript
const CONFIG = {
    PLAYER_COLOR: 'white',  // 'white' or 'black' - your color when playing vs AI
    AI_ENABLED: true,        // Enable/disable AI opponent
    AI_DELAY: 500            // Delay in ms before AI moves (for better UX)
};
```

Or programmatically via the browser console:
```javascript
ChessGame.configure({
    PLAYER_COLOR: 'black',
    AI_ENABLED: true
});
```

## Technology Stack

- **HTML5**: Structure and layout
- **CSS3**: Styling with modern flexbox/grid
- **Vanilla JavaScript (ES6+)**: Game logic and interactivity
- **[chess.js](https://github.com/jhlywa/chess.js) v0.10.3**: Chess rules engine and move validation (included locally)
- **xAI Grok API**: AI opponent moves

**Note**: The chess.js library is included locally in `js/chess.min.js`. No CDN dependencies required!

## Project Structure

```
/
├── index.html           # Main game page
├── css/
│   └── style.css       # Complete game styling
├── js/
│   ├── chess.min.js    # Chess.js library (v0.10.3)
│   ├── board.js        # Board rendering and UI interactions
│   ├── game.js         # Game logic and state management
│   └── ai.js           # Grok AI integration
├── assets/
│   ├── pieces/         # Chess piece images (placeholder for custom assets)
│   └── sounds/         # Game sounds (placeholder)
├── package.json        # NPM dependencies (chess.js)
├── README.md           # This file
└── ASSETS.md           # Guide for creating custom chess piece assets
```

## Current Implementation

### Piece Rendering
Currently uses Unicode chess symbols (♔♕♖♗♘♙♚♛♜♝♞♟) for simplicity and zero dependencies. The code is structured to easily swap to image-based pieces - see `ASSETS.md` for details.

### AI Behavior
- Sends board state to Grok API in FEN notation
- Requests move in UCI format (e.g., `e2e4`)
- Validates returned move against legal moves
- Falls back to random legal move if API fails or returns invalid move
- Includes retry logic (3 attempts by default)

## Future Enhancements

Planned features for future versions:

- [ ] Time controls and clock
- [ ] Difficulty levels for AI
- [ ] Take-back move functionality
- [ ] Save/load games (PGN format)
- [ ] Opening book integration
- [ ] Position analysis mode
- [ ] Multiple themes
- [ ] Sound effects
- [ ] Animation for piece movements
- [ ] AI vs AI mode
- [ ] Multiplayer over network

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

Requires a modern browser with ES6 support.

## Troubleshooting

### AI Not Making Moves
1. Check browser console (F12) for error messages
2. Verify your API key is correctly set in `js/ai.js`
3. Ensure you have an active internet connection
4. Check if you have remaining API credits at xAI Console

### Board Not Displaying
1. Ensure you're opening `index.html` (not individual JS files)
2. Check browser console for JavaScript errors
3. Verify all files are in correct directories

### Legal Moves Not Showing
This is controlled by the `chess.js` library. If moves seem incorrect, it's likely a valid chess rule you might not be familiar with (like en passant or pinned pieces).

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
- AI: [Grok](https://x.ai/) by xAI
- Created for the RTSduncan repository

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the browser console for errors
3. Open an issue on GitHub
4. Check [xAI documentation](https://docs.x.ai/) for API-related questions

---

**Enjoy the game! ♔♛**
