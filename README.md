
https://thijsvndmeer.github.io/bussenapp/

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Build for Android

The project is configured for a Capacitor wrapper so you can ship the web UI as a native Android app.

1. Install the Android SDK and Android Studio.
2. Install dependencies (may require network access to npm):
   `npm install`
3. Add the native platform once:
   `npx cap add android`
4. Sync the compiled web assets into the Android project:
   `npm run cap:android`
5. Open and run the project from Android Studio:
   `npx cap open android`

> Tip: if you are behind a proxy, disable the proxy-related npm environment variables before installing (`unset npm_config_http_proxy npm_config_https_proxy`).

## Deploy to GitHub Pages

The Vite build now supports relative asset paths so it can be served from GitHub Pages without broken links.

1. Optionally set the base path for a project page:
   * Bash: `export VITE_BASE_PATH=/REPO_NAME/`
   * PowerShell: `$env:VITE_BASE_PATH="/REPO_NAME/"`
   If you publish to a user/organization page you can skip this step because the default `./` base works there.
2. Build the site: `npm run build`
3. Publish the generated `dist` folder to your `gh-pages` branch (for example with [`gh-pages`](https://github.com/tschaub/gh-pages) or a GitHub Actions workflow).

