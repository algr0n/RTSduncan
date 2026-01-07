# Chess Piece Assets Guide

This guide will help you create or obtain custom chess piece images to replace the default Unicode symbols.

## Current Implementation

The game currently uses Unicode chess symbols (♔♕♖♗♘♙♚♛♜♝♞♟) which work great but may not fit all aesthetic preferences. The code is structured to make switching to custom images straightforward.

## Required Assets

You need **12 chess piece images** in total:

### White Pieces (6)
- `white-king.png`
- `white-queen.png`
- `white-rook.png`
- `white-bishop.png`
- `white-knight.png`
- `white-pawn.png`

### Black Pieces (6)
- `black-king.png`
- `black-queen.png`
- `black-rook.png`
- `black-bishop.png`
- `black-knight.png`
- `black-pawn.png`

## Image Specifications

### Size
- **Recommended**: 128x128 pixels or 256x256 pixels
- **Minimum**: 64x64 pixels
- **Maximum**: 512x512 pixels

The images will be scaled to fit the board squares (70px by default, responsive on mobile).

### Format
- **Recommended**: PNG with transparency
- **Alternative**: SVG for scalability (requires code modification)
- **Not recommended**: JPG (no transparency support)

### Background
- **Transparent** (alpha channel)
- Pieces should not have their own background color
- This allows them to blend with the board squares

### Style Guidelines
- **Consistency**: All pieces should follow the same art style
- **Clarity**: Pieces should be easily distinguishable
- **Contrast**: White and black pieces should be clearly different
- **Orientation**: All pieces should face the same direction
- **Padding**: Leave some space around edges (10-20% margin)

## How to Get Assets

### Option 1: AI Image Generators

Use AI tools to generate consistent chess piece sets:

#### DALL-E / ChatGPT
```
Generate a complete set of chess pieces in [style] style:
- Wooden/Classic/Modern/Minimalist design
- White pieces should be light colored
- Black pieces should be dark colored
- Transparent background
- High contrast and clear details
- Consistent art style across all pieces
- 512x512 pixels
```

#### Midjourney
```
chess piece set, [king/queen/rook/bishop/knight/pawn], 
white/black wood, isometric view, clean design, 
transparent background, studio lighting, 
high detail, 4k --ar 1:1
```

#### Stable Diffusion
```
professional chess piece, [piece type], [white/black] color,
studio photography, transparent background, PNG, 
centered, high quality, detailed
```

### Option 2: Free Asset Resources

#### Free Chess Piece Sets
- **Wikimedia Commons**: Search for "chess pieces PNG"
  - URL: https://commons.wikimedia.org/wiki/Category:PNG_chess_pieces
- **OpenGameArt**: Chess piece collections
  - URL: https://opengameart.org/
- **Kenney.nl**: Game assets including chess pieces
  - URL: https://kenney.nl/
- **Itch.io**: Free game assets
  - URL: https://itch.io/game-assets/free

### Option 3: Create Your Own

#### Using Inkscape (Free, Open Source)
1. Download from https://inkscape.org/
2. Create vector chess pieces
3. Export as PNG with transparency
4. Recommended size: 256x256px or 512x512px

#### Using GIMP (Free, Open Source)
1. Download from https://www.gimp.org/
2. Create or edit raster images
3. Use transparent background
4. Export as PNG

#### Using Figma (Free for personal use)
1. Sign up at https://figma.com/
2. Design chess pieces with vector tools
3. Export as PNG with transparency

### Option 4: Purchase Professional Sets

#### Asset Marketplaces
- **Unity Asset Store**: Many chess piece sets ($5-$50)
- **Unreal Marketplace**: High-quality 3D renders
- **GraphicRiver**: 2D chess piece collections
- **Creative Market**: Designer chess sets

## Installation Instructions

Once you have your assets:

### Step 1: Add Images to Project
1. Save all 12 PNG files to the `assets/pieces/` directory
2. Ensure filenames match exactly:
   - `white-king.png`, `white-queen.png`, etc.
   - `black-king.png`, `black-queen.png`, etc.

### Step 2: Update CSS
Open `css/style.css` and:

1. Find the comment section that says:
   ```css
   /* Future: Image-based pieces */
   ```

2. Uncomment the CSS code below it (remove `/*` and `*/`)

3. Comment out or remove the Unicode piece styles if desired

### Step 3: Update JavaScript
Open `js/board.js` and:

1. Find the `renderPiece()` function

2. Replace the Unicode rendering with image rendering:
   ```javascript
   function renderPiece(piece) {
       const colorName = piece.color === 'w' ? 'white' : 'black';
       const pieceName = {
           'p': 'pawn', 'r': 'rook', 'n': 'knight',
           'b': 'bishop', 'q': 'queen', 'k': 'king'
       }[piece.type];
       
       return `<img src="assets/pieces/${colorName}-${pieceName}.png" 
                    class="piece" 
                    alt="${colorName} ${pieceName}" />`;
   }
   ```

3. Update the `PIECES` object (or create `PIECE_IMAGES`):
   ```javascript
   const PIECE_IMAGES = {
       'p': 'assets/pieces/black-pawn.png',
       'r': 'assets/pieces/black-rook.png',
       'n': 'assets/pieces/black-knight.png',
       'b': 'assets/pieces/black-bishop.png',
       'q': 'assets/pieces/black-queen.png',
       'k': 'assets/pieces/black-king.png',
       'P': 'assets/pieces/white-pawn.png',
       'R': 'assets/pieces/white-rook.png',
       'N': 'assets/pieces/white-knight.png',
       'B': 'assets/pieces/white-bishop.png',
       'Q': 'assets/pieces/white-queen.png',
       'K': 'assets/pieces/white-king.png'
   };
   ```

### Step 4: Test
1. Open `index.html` in your browser
2. Verify all pieces display correctly
3. Check both white and black pieces
4. Test on mobile devices for scaling

## Design Tips

### Color Palette Suggestions

#### Classic Wood
- White pieces: `#F4E4C1` to `#E8D4A8`
- Black pieces: `#4A3728` to `#6B4423`

#### Modern Minimalist
- White pieces: `#FFFFFF` with gray shadows
- Black pieces: `#1A1A1A` with subtle highlights

#### Bold Contrast
- White pieces: Pure white with blue accents
- Black pieces: Pure black with red accents

### Testing Your Assets
1. **Visibility**: Can you distinguish pieces at a glance?
2. **Contrast**: Do pieces stand out on both light and dark squares?
3. **Scale**: Do pieces look good at different screen sizes?
4. **Style**: Do all pieces feel like they belong together?

## Troubleshooting

### Images Not Showing
- Check file paths are correct
- Verify filenames match exactly (case-sensitive on some systems)
- Ensure images are in `assets/pieces/` directory
- Check browser console for 404 errors

### Images Too Large/Small
- Adjust CSS: `.piece { width: 60px; height: 60px; }`
- Or edit source images to match recommended size

### Images Have White Background
- Re-export with transparency enabled
- Use GIMP/Photoshop to remove background
- Add `mix-blend-mode: multiply;` in CSS (may help)

### Poor Quality on Mobile
- Use larger source images (256x256 or 512x512)
- Consider SVG format for perfect scaling
- Test on actual devices, not just browser resize

## Example: Simple SVG Pieces

For the ultimate flexibility, consider SVG pieces:

```html
<!-- King example -->
<svg viewBox="0 0 45 45" class="piece">
  <path d="M22.5 11.63V6M20 8h5M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/>
  <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z"/>
</svg>
```

SVG benefits:
- Perfect scaling at any size
- Smaller file size
- Easy to recolor with CSS
- Crisp on retina displays

## Additional Resources

- **Chess Pieces Reference**: [Wikipedia Chess Symbols](https://en.wikipedia.org/wiki/Chess_symbols_in_Unicode)
- **Color Theory**: [Adobe Color](https://color.adobe.com/)
- **Image Optimization**: [TinyPNG](https://tinypng.com/)
- **SVG Editor**: [Inkscape](https://inkscape.org/)

---

**Happy designing! Create chess pieces that match your vision for the game.**
