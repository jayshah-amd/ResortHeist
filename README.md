# Case #7734 - Mobile-First ARG/Escape Room Game

A complete mobile-first web game combining ARG, escape room, and heist mystery elements. Runs entirely client-side with no server required.

## 🎮 Quick Start

### Option 1: Open Directly (No Server Needed)
Simply double-click `index.html` to open in your browser. The game works entirely offline using LocalStorage.

### Option 2: Use a Local Server (Optional)
```bash
npx http-server -p 3000 --cors
# Then open http://localhost:3000
```

## 🔄 How to Reset the Game

There are 3 ways to reset the game and start over:

1. **URL Parameter**: Add `?reset=true` to the URL
   - Example: `index.html?reset=true`
   - Example: `http://localhost:3000?reset=true`

2. **Keyboard Shortcut**: Press `Ctrl+Shift+R`
   - A confirmation dialog will appear

3. **Browser DevTools**: Clear localStorage manually
   - Open DevTools (F12) → Application → LocalStorage → Clear

## 🎯 Game Features

### Screens
1. **Resort Notice** - Professional resort styling, legal disclaimer
2. **Thief Introduction** - Terminal-style with typewriter effect
3. **Investigation** - Timer, puzzles, evidence collection
4. **Warning** - Pre-reveal warning screen
5. **Team Selection** - Gender or random draft
6. **Chase Mode** - Photo capture, QR sharing
7. **Victory** - Stats and celebration

### Technical Features
- ✅ 45-minute countdown timer with penalties
- ✅ Answer validation with typo detection (Levenshtein distance)
- ✅ Escalating penalties for wrong answers
- ✅ LocalStorage state persistence
- ✅ Works offline - no server required
- ✅ Mobile-first responsive design
- ✅ Glassmorphism modern UI
- ✅ Web Audio API sound effects
- ✅ Native Share API with WhatsApp fallback

## 📱 Mobile Optimizations
- Touch targets minimum 44x44px
- No zoom on input focus
- Full viewport layout (no scrolling)
- Dynamic viewport height support
- Hardware-accelerated animations

## 🔧 Debug Mode

Add `?debug=true` to the URL to see:
- All puzzle answers in console
- Skip to different phases with `?phase=2`
- Set custom timer with `?time=300` (in seconds)

## 📁 File Structure

```
├── index.html          # Main game (single HTML file)
├── css/
│   └── styles.css      # Modern glassmorphism styles
├── js/
│   ├── game.js         # Core game logic & state
│   ├── timer.js        # Countdown system
│   ├── screens.js      # Screen management
│   └── audio.js        # Web Audio sound effects
├── vendor/
│   ├── typed.umd.js    # Typewriter effect library
│   └── qrcode.js       # QR code generator
└── assets/             # (Optional images/icons)
```

## 🎨 Customization

### Change Puzzles
Edit `js/game.js` and modify the `PUZZLES` object:
```javascript
const PUZZLES = {
    safeCombination: {
        title: 'Your Puzzle Title',
        description: 'Your puzzle text...',
        answers: ['ANSWER1', 'ANSWER2'],  // Multiple accepted answers
        hint: 'Your hint text...'
    }
    // Add more puzzles...
};
```

### Change Thief Name
Edit `js/game.js`:
```javascript
CONFIG.THIEF_IDENTITY = 'NAME';
```
Also update the `thiefIdentity` puzzle answers.

### Change Timer
Edit `js/game.js`:
```javascript
CONFIG.INVESTIGATION_TIME = 45 * 60; // 45 minutes in seconds
CONFIG.CHASE_TIME = 20 * 60;         // 20 minutes in seconds
```

## 🚀 Deployment

The game is 100% static files. Deploy to any static hosting:
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Any web server

Just upload all files maintaining the folder structure.

## 📜 License

MIT License - feel free to customize for your own events!
