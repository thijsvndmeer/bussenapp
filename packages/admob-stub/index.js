export const AdMob = {
  async initialize() {
    console.warn('[AdMob stub] initialize called; real plugin not present.');
  },
  async prepareInterstitial() {
    console.warn('[AdMob stub] prepareInterstitial called; returning fallback.');
  },
  async showInterstitial() {
    console.warn('[AdMob stub] showInterstitial called; no ad will display.');
  },
};

export default AdMob;
