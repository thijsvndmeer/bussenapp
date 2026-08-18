// scripts/resolve-version-code.cjs
const fs = require('fs');
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

function getGitMaxVersionCode() {
  try {
    const tags = execSync('git tag -l "v*"', { encoding: 'utf8' }).trim().split('\n');
    const codes = [];
    for (const tag of tags) {
      const match = tag.trim().match(/^v?(\d+)\.(\d+)\.(\d+)$/);
      if (match) {
        codes.push(parseInt(`${match[1]}${match[2]}${match[3]}`, 10));
      }
    }
    return codes.length > 0 ? Math.max(...codes) : 0;
  } catch {
    return 0;
  }
}

async function main() {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const baseVersion = pkg.version;
  const baseVersionCode = parseInt(pkg.version.replace(/[^0-9]/g, ''), 10);

  const gitMax = getGitMaxVersionCode();
  const playConfig = process.env.PLAY_CONFIG_JSON || process.env.PLAY_JSON || '';
  const playMax = playConfig ? await getGooglePlayMaxVersionCode(playConfig, 'com.bussen.app') : null;

  const maxKnown = Math.max(gitMax, playMax || 0);

  console.log(`[VersionResolver] package.json version: ${baseVersion} (code: ${baseVersionCode})`);
  console.log(`[VersionResolver] Highest Git tag version code: ${gitMax}`);
  if (playMax !== null) {
    console.log(`[VersionResolver] Google Play live max version code: ${playMax}`);
  }

  let finalCode = baseVersionCode;
  if (finalCode <= maxKnown) {
    finalCode = maxKnown + 1;
    console.log(`[VersionResolver] ⚠️ Version code collision detected (${baseVersionCode} <= ${maxKnown})! Auto-bumping version code to: ${finalCode}`);
  } else {
    console.log(`[VersionResolver] ✅ Version code ${finalCode} is unique and valid.`);
  }

  let finalVersion = baseVersion;
  const digits = String(finalCode);
  if (digits.length >= 3) {
    finalVersion = `${digits[0]}.${digits[1]}.${digits.slice(2)}`;
  }

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${finalVersion}\nversion_code=${finalCode}\n`);
  }
  console.log(`[VersionResolver] Output -> version=${finalVersion}, version_code=${finalCode}`);
}

main().catch(err => {
  console.error('[VersionResolver] Error:', err);
  process.exit(1);
});
