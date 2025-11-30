# Bussen App

## Project Overview
-   **Purpose:** The Bussen App is a companion application for the popular card-based drinking game "Bussen". It automates card distribution, manages game phases (setup, pyramid, bus ride), and facilitates player interaction, enhancing the gameplay experience.
-   **Key Features:**
    *   Interactive game setup and player management.
    *   Automated card dealing for each game phase.
    *   Intuitive UI for "Pyramid" and "Bus Ride" stages.
    *   Support for haptic feedback for game events.
    *   AdMob integration.
    *   Mobile-first design, deployable on iOS and Android via Capacitor.
-   **Tech Stack:**
    *   **Frontend:** React (with Hooks), TypeScript
    *   **Build Tool:** Vite
    *   **Mobile Platform:** Capacitor
    *   **Styling:** Tailwind CSS (inferred from existing components)
    *   **Icons:** Lucide React
    *   **Device APIs:** Haptics
    *   **Monetization:** AdMob (Capacitor plugin)

## Installation

### Prerequisites
Before you begin, ensure you have the following installed:
*   **Node.js:** v18 or higher (includes npm)
*   **npm:** Node Package Manager (comes with Node.js)
*   **Git:** For cloning the repository
*   **Android Studio:** Required for building and running on Android devices/emulators.
*   **Xcode:** Required for building and running on iOS devices/simulators (macOS only).

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/thijsvndmeer/bussenapp.git
    cd bussenapp
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Build the web assets:**
    ```bash
    npm run build
    ```
4.  **Add desired mobile platforms (if not already added):**
    ```bash
    npx cap add android
    npx cap add ios
    ```
5.  **Sync Capacitor with web assets:**
    ```bash
    npx cap sync
    ```

## Usage

### Getting Started (Web Development)
To run the application in your browser for development:
```bash
npm run dev
```
This will start a local development server, usually accessible at `localhost`.

### Running on Mobile Devices/Emulators

1.  **Open the native project:**
    *   **Android:**
        ```bash
        npx cap open android
        ```
        This will open the Android project in Android Studio. From there, you can run the app on an emulator or a connected device.
    *   **iOS (macOS only):**
        ```bash
        npx cap open ios
        ```
        This will open the iOS project in Xcode. From there, you can run the app on a simulator or a connected device.

2.  **To apply web changes to the native app:**
    After making changes to your React code, you must rebuild the web assets and sync them to the native project:
    ```bash
    npm run build
    npx cap sync
    ```
    Then, re-run or redeploy from Android Studio/Xcode.

## Configuration

### Environment Variables
The application may utilize environment variables, especially for services like AdMob. These are typically configured within your native project settings (Android Studio / Xcode) or Capacitor's configuration.

*   `ADMOB_APP_ID_ANDROID`: Your AdMob App ID for Android.
*   `ADMOB_APP_ID_IOS`: Your AdMob App ID for iOS.
*   `ADMOB_BANNER_ID_ANDROID`: Your AdMob Banner Ad Unit ID for Android.
*   `ADMOB_BANNER_ID_IOS`: Your AdMob Banner Ad Unit ID for iOS.

*Note: Specific environment variable handling (e.g., using `.env` files with Vite) may be implemented, but native AdMob IDs are typically configured directly in the respective platform projects.*

### App Settings
In-app settings for the game (e.g., number of players, specific game rules, sound/haptic preferences) are managed directly within the application's UI.

## Contributing
We welcome contributions! Please follow these guidelines:

1.  **Fork** the repository.
2.  **Create a new branch** for your feature or bugfix: `git checkout -b feature/your-feature-name` or `bugfix/issue-description`.
3.  **Make your changes**, adhering to the existing coding style and TypeScript conventions.
4.  **Test your changes** thoroughly to ensure no regressions and that functionality is preserved.
5.  **Commit your changes** with clear and descriptive commit messages.
6.  **Push your branch** to your forked repository.
7.  **Open a Pull Request** to the `main` branch of the original repository, describing your changes in detail.

### Code of Conduct
Please review our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing. (Placeholder - create this file if needed).

## Support
If you encounter any issues or have questions, please use the [GitHub Issues](https://github.com/YOUR_USERNAME/bussen-app/issues) page to report them.

Copyright (c) 2025 Thijs van der Meer

All Rights Reserved.
