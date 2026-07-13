import fs from 'fs';
import path from 'path';

const i18nContent = fs.readFileSync('i18n.ts', 'utf-8');
const enMatch = i18nContent.match(/en: \{([\s\S]*?)\n    \}/);
const dict = {};

if (enMatch) {
  const lines = enMatch[1].split('\n');
  for (const line of lines) {
    const match = line.match(/"(.*?)": "(.*?)"/);
    if (match) {
      dict[match[1]] = match[2];
    }
  }
}

const files = ['App.tsx', 'components/SettingsPanel.tsx', 'components/PlayerCard.tsx', 'components/PlayingCard.tsx', 'components/PlayerList.tsx', 'components/ClassicFaceCard.tsx'];

const missingKeys = new Set();
const rawTextCandidates = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  
  // Find t("...") or t('...')
  const tMatches = [...content.matchAll(/t\(['"](.*?)['"]\)/g)];
  for (const match of tMatches) {
    const key = match[1];
    if (!dict[key]) {
      missingKeys.add(key);
    }
  }

  // Find raw JSX text (heuristic): > Text <
  const rawMatches = [...content.matchAll(/>([^<>{]+)</g)];
  for (const match of rawMatches) {
    const text = match[1].trim();
    // Exclude short, non-alphabetical or simple punctuation
    if (text.length > 1 && /[a-zA-Z]/.test(text) && !text.includes('://')) {
      rawTextCandidates.push({ file, text });
    }
  }
}

console.log("=== MISSING KEYS IN i18n.ts ===");
for (const key of missingKeys) {
  console.log(`"${key}": "${key}",`);
}

console.log("\n=== POTENTIAL UNTRANSLATED JSX TEXT ===");
for (const cand of rawTextCandidates) {
  console.log(`${cand.file}: ${cand.text}`);
}
