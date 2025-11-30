import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bussen.app',
  appName: 'Bussen Companion',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    AdMob: {
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
    }
  }
};

export default config;