import packageJson from '../package.json';
import whatsNewNl from '../distribution/whatsnew/whatsnew-nl-NL?raw';
import whatsNewEn from '../distribution/whatsnew/whatsnew-en-US?raw';

export const CURRENT_APP_VERSION = packageJson.version;
export const PATCH_NOTES_VERSION = packageJson.version;
export const PATCH_NOTES_SEEN_KEY = `bus-app-patch-notes-seen-version`;

const parseWhatsNew = (rawText: string): string[] => {
  if (!rawText) return [];
  return rawText
    .split('\n')
    .map(line => line.trim())
    .filter(
      line =>
        line.length > 0 &&
        !line.toLowerCase().includes('in deze update') &&
        !line.toLowerCase().includes("what's new") &&
        !line.toLowerCase().includes('nieuwe release')
    )
    .map(line => (line.startsWith('-') || line.startsWith('•') || line.startsWith('*') ? line.substring(1).trim() : line))
    .filter(line => line.length > 0);
};

export const getPatchNotesList = (lang: string = 'nl'): string[] => {
  const isEn = lang && lang.toLowerCase().startsWith('en');
  const raw = isEn ? whatsNewEn : whatsNewNl;
  return parseWhatsNew(raw);
};

export const hasPatchNotes = (lang: string = 'nl'): boolean => {
  return getPatchNotesList(lang).length > 0;
};
