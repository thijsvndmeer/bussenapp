import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bussen.app',
  appName: 'Bussen Companion',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      initializeOnId: 'ca-app-pub-7627297114391750~5463450367',
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