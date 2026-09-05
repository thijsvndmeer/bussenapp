import os

file_path = os.path.join(os.path.dirname(__file__), '..', 'App.tsx')
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

def remove_lines(start, end):
    for i in range(start - 1, end):
        lines[i] = ''

# 57-102: getSuitSymbol to getFullRankName
remove_lines(57, 102)

# 183-230: SoundEffect to createOscillatorSound
remove_lines(183, 230)

# 260-338: resizeImage to shuffleDeck
remove_lines(260, 338)

# 343-375: Confetti
remove_lines(343, 375)

# 445-565: CalmBackground and BeerBackground
remove_lines(445, 565)

# 567-758: PlayerAvatar, ThemeLabel, ThemeHeader
remove_lines(567, 758)

imports_to_add = """
import { getSuitSymbol, getRankChar, getRankString, getFullRankName, ALL_SUITS, PREVIEW_CARD, createDeck, shuffleDeck } from './src/lib/utils/deck';
import { createOscillatorSound, SoundEffect } from './src/lib/utils/audio';
import { resizeImage, cropToSquareDataUrl } from './src/lib/utils/image';
import { Confetti } from './src/components/backgrounds/Confetti';
import { CalmBackground } from './src/components/backgrounds/CalmBackground';
import { BeerBackground } from './src/components/backgrounds/BeerBackground';
import { PlayerAvatar } from './src/components/ui/PlayerAvatar';
import { ThemeLabel, ThemeHeader } from './src/components/ui/ThemeComponents';
"""

lines.insert(16, imports_to_add)

new_content = '\n'.join([line for line in lines if line != ''])
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully refactored App.tsx")
