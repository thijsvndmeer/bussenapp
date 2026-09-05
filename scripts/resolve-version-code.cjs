// scripts/resolve-version-code.cjs
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { execSync } = require('child_process');

function postJson(urlStr, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const isJson = headers['Content-Type'] === 'application/json';
    const body = isJson ? JSON.stringify(data) : new URLSearchParams(data).toString();
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': isJson ? 'application/json' : 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        ...headers
      }
    }, res => {
      let resData = '';
      res.on('data', chunk => { resData += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(resData));
        } catch {
          resolve(resData);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJson(urlStr, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers
    }, res => {
      let resData = '';
      res.on('data', chunk => { resData += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(resData));
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function deleteReq(urlStr, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'DELETE',
      headers
    }, res => {
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.on('error', reject);
    req.end();
  });
}

async function getGooglePlayMaxVersionCode(serviceAccountJson, packageName) {
  try {
    const creds = typeof serviceAccountJson === 'object' ? serviceAccountJson : JSON.parse(serviceAccountJson);
    if (!creds.client_email || !creds.private_key) return null;

    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claimSet = Buffer.from(JSON.stringify({
      iss: creds.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: creds.token_uri || 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    })).toString('base64url');

    const signature = crypto.createSign('RSA-SHA256')
      .update(`${header}.${claimSet}`)
      .sign(creds.private_key, 'base64url');

    const jwt = `${header}.${claimSet}.${signature}`;

    const tokenRes = await postJson(creds.token_uri || 'https://oauth2.googleapis.com/token', {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    });

    const accessToken = tokenRes.access_token;
    if (!accessToken) return null;

    const editRes = await postJson(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits`,
      {},
      { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    );
    const editId = editRes.id;
    if (!editId) return null;

    const bundlesRes = await getJson(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits/${editId}/bundles`,
      { Authorization: `Bearer ${accessToken}` }
    );
    const tracksRes = await getJson(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits/${editId}/tracks`,
      { Authorization: `Bearer ${accessToken}` }
    );

    try {
      await deleteReq(
        `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits/${editId}`,
        { Authorization: `Bearer ${accessToken}` }
      );
    } catch {}

    const versionCodes = [];
    if (bundlesRes && Array.isArray(bundlesRes.bundles)) {
      bundlesRes.bundles.forEach(b => {
        if (b.versionCode) versionCodes.push(parseInt(b.versionCode, 10));
      });
    }
    if (tracksRes && Array.isArray(tracksRes.tracks)) {
      tracksRes.tracks.forEach(t => {
        if (t.releases) {
          t.releases.forEach(r => {
            if (Array.isArray(r.versionCodes)) {
              r.versionCodes.forEach(vc => versionCodes.push(parseInt(vc, 10)));
            }
          });
        }
      });
    }

    if (versionCodes.length > 0) {
      return Math.max(...versionCodes.filter(n => !isNaN(n)));
    }
  } catch (err) {
    console.warn('[VersionResolver] Note: Could not query Google Play directly:', err.message);
  }
  return null;
}

function parseSemver(versionStr) {
  const match = String(versionStr).trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
  };
}

function formatSemver(parsed) {
  const base = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
  return parsed.prerelease ? `${base}-${parsed.prerelease}` : base;
}

function semverToCode(versionStr) {
  const parsed = parseSemver(versionStr);
  if (!parsed) {
    const numeric = parseInt(String(versionStr).replace(/[^0-9]/g, ''), 10);
    return isNaN(numeric) ? 1 : numeric;
  }
  return parseInt(`${parsed.major}${parsed.minor}${parsed.patch}`, 10);
}

function getGitTagsList(cwd = process.cwd()) {
  try {
    const raw = execSync('git tag -l "v*"', { cwd, encoding: 'utf8' }).trim();
    if (!raw) return [];
    return raw.split('\n').map(t => t.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function getGitMaxVersionInfo(cwd = process.cwd()) {
  const tags = getGitTagsList(cwd);
  let maxCode = 0;
  let maxTag = null;
  let maxParsed = null;

  for (const tag of tags) {
    const parsed = parseSemver(tag);
    if (parsed) {
      const code = semverToCode(tag);
      if (code > maxCode) {
        maxCode = code;
        maxTag = tag;
        maxParsed = parsed;
      }
    }
  }
  return { maxCode, maxTag, maxParsed };
}

function resolveNextVersionState(baseVersion, gitMaxInfo, playMaxCode) {
  const parsedBase = parseSemver(baseVersion) || { major: 1, minor: 0, patch: 0 };
  const baseCode = semverToCode(baseVersion);
  const maxRemoteCode = Math.max(gitMaxInfo.maxCode || 0, playMaxCode || 0);

  let finalCode = baseCode;
  let finalVersion = formatSemver(parsedBase);

  if (finalCode <= maxRemoteCode) {
    finalCode = maxRemoteCode + 1;
    // Derive new semver if git tag or remote exists
    if (gitMaxInfo.maxParsed) {
      const candidatePatch = gitMaxInfo.maxParsed.patch + 1;
      finalVersion = `${gitMaxInfo.maxParsed.major}.${gitMaxInfo.maxParsed.minor}.${candidatePatch}`;
    } else {
      finalVersion = `${parsedBase.major}.${parsedBase.minor}.${parsedBase.patch + 1}`;
    }
  }

  return {
    baseVersion,
    baseCode,
    maxRemoteCode,
    finalCode,
    finalVersion,
    hasCollision: baseCode <= maxRemoteCode,
  };
}

function syncVersionToFiles(newVersion, newCode, rootDir = process.cwd()) {
  const pkgPath = path.join(rootDir, 'package.json');
  const pkgLockPath = path.join(rootDir, 'package-lock.json');
  const gradlePath = path.join(rootDir, 'android/app/build.gradle');

  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`[VersionResolver] Updated ${pkgPath} -> version: ${newVersion}`);
  }

  if (fs.existsSync(pkgLockPath)) {
    try {
      const pkgLock = JSON.parse(fs.readFileSync(pkgLockPath, 'utf8'));
      pkgLock.version = newVersion;
      if (pkgLock.packages && pkgLock.packages['']) {
        pkgLock.packages[''].version = newVersion;
      }
      fs.writeFileSync(pkgLockPath, JSON.stringify(pkgLock, null, 2) + '\n');
      console.log(`[VersionResolver] Updated ${pkgLockPath} -> version: ${newVersion}`);
    } catch (e) {
      console.warn(`[VersionResolver] Note: could not update package-lock.json:`, e.message);
    }
  }

  if (fs.existsSync(gradlePath)) {
    let gradleContent = fs.readFileSync(gradlePath, 'utf8');
    gradleContent = gradleContent.replace(
      /versionCode\s+\(System\.getenv\("VERSION_CODE"\)\s*\?\s*Integer\.parseInt\(System\.getenv\("VERSION_CODE"\)\)\s*:\s*\d+\)/,
      `versionCode (System.getenv("VERSION_CODE") ? Integer.parseInt(System.getenv("VERSION_CODE")) : ${newCode})`
    );
    gradleContent = gradleContent.replace(
      /versionName\s+\(System\.getenv\("VERSION_NAME"\)\s*\?:\s*"[^"]+"\)/,
      `versionName (System.getenv("VERSION_NAME") ?: "${newVersion}")`
    );
    fs.writeFileSync(gradlePath, gradleContent);
    console.log(`[VersionResolver] Updated ${gradlePath} fallback values -> code: ${newCode}, name: ${newVersion}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isCheckMode = args.includes('--check') || args.includes('-c');
  const isWriteMode = args.includes('--write') || args.includes('-w');
  const bumpIdx = args.indexOf('--bump');
  const bumpType = bumpIdx !== -1 ? args[bumpIdx + 1] : null;

  const pkgPath = path.resolve(process.cwd(), './package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('[VersionResolver] package.json not found!');
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  let baseVersion = pkg.version;

  if (bumpType) {
    const parsed = parseSemver(baseVersion) || { major: 1, minor: 0, patch: 0 };
    if (bumpType === 'major') parsed.major += 1, parsed.minor = 0, parsed.patch = 0;
    else if (bumpType === 'minor') parsed.minor += 1, parsed.patch = 0;
    else parsed.patch += 1;
    baseVersion = formatSemver(parsed);
  }

  const gitMaxInfo = getGitMaxVersionInfo();
  const playConfig = process.env.PLAY_CONFIG_JSON || process.env.PLAY_JSON || '';
  const playMax = playConfig ? await getGooglePlayMaxVersionCode(playConfig, 'com.bussen.app') : null;

  const state = resolveNextVersionState(baseVersion, gitMaxInfo, playMax);

  console.log(`[VersionResolver] Base version: ${state.baseVersion} (code: ${state.baseCode})`);
  console.log(`[VersionResolver] Highest Git tag version code: ${gitMaxInfo.maxCode} (tag: ${gitMaxInfo.maxTag || 'none'})`);
  if (playMax !== null) {
    console.log(`[VersionResolver] Google Play live max version code: ${playMax}`);
  }

  if (state.hasCollision) {
    console.log(`[VersionResolver] ⚠️ Version code collision detected (${state.baseCode} <= ${state.maxRemoteCode})! Auto-resolved to version: ${state.finalVersion}, code: ${state.finalCode}`);
    if (isCheckMode) {
      console.error(`[VersionResolver] Check failed: package.json version ${state.baseVersion} collides with deployed code ${state.maxRemoteCode}`);
      process.exit(1);
    }
  } else {
    console.log(`[VersionResolver] ✅ Version ${state.finalVersion} (code ${state.finalCode}) is unique and valid.`);
  }

  if (isWriteMode) {
    syncVersionToFiles(state.finalVersion, state.finalCode);
  }

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${state.finalVersion}\nversion_code=${state.finalCode}\n`);
  }
  console.log(`[VersionResolver] Output -> version=${state.finalVersion}, version_code=${state.finalCode}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('[VersionResolver] Error:', err);
    process.exit(1);
  });
}

module.exports = {
  parseSemver,
  formatSemver,
  semverToCode,
  getGitMaxVersionInfo,
  resolveNextVersionState,
  syncVersionToFiles,
};
