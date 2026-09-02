const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Helper to remove lines (1-indexed)
// We replace them with empty lines to preserve line numbers for the next removals
function removeLines(start, end) {
  for (let i = start - 1; i <= end - 1; i++) {
    lines[i] = '';
  }
}

// 57-102: getSuitSymbol to getFullRankName
removeLines(57, 102);

// 183-230: SoundEffect to createOscillatorSound
removeLines(183, 230);

// 260-338: resizeImage to shuffleDeck
removeLines(260, 338);

// 343-375: Confetti
removeLines(343, 375);

// 445-565: CalmBackground and BeerBackground
removeLines(445, 565);

// 567-758: PlayerAvatar, ThemeLabel, ThemeHeader
removeLines(567, 758);

// Add imports at line 16 (after some other imports, before i18n)
const importsToAdd = `
import { getSuitSymbol, getRankChar, getRankString, getFullRankName, ALL_SUITS, PREVIEW_CARD, createDeck, shuffleDeck } from './src/lib/utils/deck';
import { createOscillatorSound, SoundEffect } from './src/lib/utils/audio';
import { resizeImage, cropToSquareDataUrl } from './src/lib/utils/image';
import { Confetti } from './src/components/backgrounds/Confetti';
import { CalmBackground } from './src/components/backgrounds/CalmBackground';
import { BeerBackground } from './src/components/backgrounds/BeerBackground';
import { PlayerAvatar } from './src/components/ui/PlayerAvatar';
import { ThemeLabel, ThemeHeader } from './src/components/ui/ThemeComponents';
`;

lines.splice(16, 0, importsToAdd);

const newContent = lines.filter(line => line !== '').join('\n');
fs.writeFileSync(filePath, newContent);
console.log('Successfully refactored App.tsx');
