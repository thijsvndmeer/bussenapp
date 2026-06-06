import { CapacitorConfig } from '@capacitor/cli';
import { loadEnv } from 'vite';

// Load environment variables using Vite helper
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), 'VITE_');

const config: CapacitorConfig = {
  appId: 'com.bussen.app',
  appName: 'Bussen',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      initializeOnId: env.VITE_ADMOB_APP_ID || 'ca-app-pub-3940256099942544~3347511713',
      appOpen: {
        enabled: true
      },
      interstitial: {
        enabled: true
      },
      rewarded: {
        enabled: true
      },
      banner: {
        enabled: true
      }
    },
    Camera: {
      androidPhotoPicker: true
    },
    StatusBar: {
      overlaysWebView: true
    }
  }
};

export default config;