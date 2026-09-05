import { describe, it, expect } from 'vitest';
const {
  parseSemver,
  formatSemver,
  semverToCode,
  resolveNextVersionState,
} = require('../scripts/resolve-version-code.cjs');

describe('Version Resolver & Auto-Bump Logic', () => {
  it('parses standard semver versions', () => {
    expect(parseSemver('1.5.6')).toEqual({ major: 1, minor: 5, patch: 6, prerelease: null });
    expect(parseSemver('v2.0.1')).toEqual({ major: 2, minor: 0, patch: 1, prerelease: null });
    expect(parseSemver('1.5.8-beta.1')).toEqual({ major: 1, minor: 5, patch: 8, prerelease: 'beta.1' });
    expect(parseSemver('invalid')).toBeNull();
  });

  it('formats semver versions correctly', () => {
    expect(formatSemver({ major: 1, minor: 5, patch: 7, prerelease: null })).toBe('1.5.7');
    expect(formatSemver({ major: 2, minor: 1, patch: 0, prerelease: 'rc1' })).toBe('2.1.0-rc1');
  });

  it('computes integer version codes consistently', () => {
    expect(semverToCode('1.5.6')).toBe(156);
    expect(semverToCode('1.5.7')).toBe(157);
    expect(semverToCode('2.0.0')).toBe(200);
  });

  it('detects no collision when package version is higher than remote', () => {
    const gitInfo = { maxCode: 157, maxTag: 'v1.5.7', maxParsed: { major: 1, minor: 5, patch: 7 } };
    const result = resolveNextVersionState('1.5.8', gitInfo, 157);

    expect(result.hasCollision).toBe(false);
    expect(result.finalCode).toBe(158);
    expect(result.finalVersion).toBe('1.5.8');
  });

  it('resolves collision by bumping code and patch version monotonically', () => {
    const gitInfo = { maxCode: 157, maxTag: 'v1.5.7', maxParsed: { major: 1, minor: 5, patch: 7 } };
    const result = resolveNextVersionState('1.5.6', gitInfo, 157);

    expect(result.hasCollision).toBe(true);
    expect(result.finalCode).toBe(158);
    expect(result.finalVersion).toBe('1.5.8');
  });

  it('handles Google Play live code being higher than Git tags', () => {
    const gitInfo = { maxCode: 155, maxTag: 'v1.5.5', maxParsed: { major: 1, minor: 5, patch: 5 } };
    const playMaxCode = 160;
    const result = resolveNextVersionState('1.5.6', gitInfo, playMaxCode);

    expect(result.hasCollision).toBe(true);
    expect(result.finalCode).toBe(161);
    expect(result.finalVersion).toBe('1.5.6'); // or auto-bumped from remote
  });
});
