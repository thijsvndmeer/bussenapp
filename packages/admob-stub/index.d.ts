export interface InitializeOptions {
  appId?: string;
  requestTrackingAuthorization?: boolean;
}

export interface InterstitialAdOptions {
  adId: string;
  adName?: string;
}

export interface AdMobPlugin {
  initialize?: (options?: InitializeOptions) => Promise<void>;
  prepareInterstitial?: (options: InterstitialAdOptions) => Promise<void>;
  showInterstitial?: () => Promise<void>;
}

export const AdMob: AdMobPlugin;
export default AdMob;
