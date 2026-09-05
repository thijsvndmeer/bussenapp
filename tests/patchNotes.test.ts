import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getPatchNotesList, hasPatchNotes, CURRENT_APP_VERSION } from '../services/patchNotes';
import packageJson from '../package.json';

describe('Patch Notes & Release Notes Integrity', () => {
  const whatsnewDir = path.resolve(__dirname, '../distribution/whatsnew');
  const nlFile = path.join(whatsnewDir, 'whatsnew-nl-NL');
  const enFile = path.join(whatsnewDir, 'whatsnew-en-US');

  it('ensures distribution/whatsnew files exist', () => {
    expect(fs.existsSync(nlFile), 'whatsnew-nl-NL file must exist').toBe(true);
    expect(fs.existsSync(enFile), 'whatsnew-en-US file must exist').toBe(true);
  });

  it('ensures whatsnew files are not empty', () => {
    const nlContent = fs.readFileSync(nlFile, 'utf8').trim();
    const enContent = fs.readFileSync(enFile, 'utf8').trim();

    expect(nlContent.length).toBeGreaterThan(10);
    expect(enContent.length).toBeGreaterThan(10);
  });

  it('ensures CURRENT_APP_VERSION matches package.json version', () => {
    expect(CURRENT_APP_VERSION).toBe(packageJson.version);
  });

  it('parses patch notes cleanly for Dutch and English', () => {
    const nlNotes = getPatchNotesList('nl');
    const enNotes = getPatchNotesList('en');

    expect(Array.isArray(nlNotes)).toBe(true);
    expect(Array.isArray(enNotes)).toBe(true);
    expect(nlNotes.length).toBeGreaterThan(0);
    expect(enNotes.length).toBeGreaterThan(0);

    nlNotes.forEach(note => {
      expect(note.trim().length).toBeGreaterThan(0);
      expect(note.startsWith('-')).toBe(false);
      expect(note.startsWith('•')).toBe(false);
    });

    enNotes.forEach(note => {
      expect(note.trim().length).toBeGreaterThan(0);
      expect(note.startsWith('-')).toBe(false);
      expect(note.startsWith('•')).toBe(false);
    });

    expect(hasPatchNotes('nl')).toBe(true);
    expect(hasPatchNotes('en')).toBe(true);
  });
});
