package com.bussen.app;

import androidx.annotation.NonNull;

import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;

@CapacitorPlugin(name = "AdMob")
public class AdMobPlugin extends Plugin {
    private static final String TAG = "AdMobPlugin";

    private InterstitialAd interstitialAd;
    private boolean isLoading = false;
    private boolean isInitialized = false;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @PluginMethod
    public void initialize(PluginCall call) {
        String appId = call.getString("appId", "");
        synchronized (this) {
            if (isInitialized) {
                JSObject result = new JSObject();
                result.put("status", "initialized");
                result.put("appId", appId);
                call.resolve(result);
                return;
            }
            isInitialized = true;
        }

        mainHandler.post(() -> MobileAds.initialize(getContext(), status -> {
            JSObject result = new JSObject();
            result.put("status", "initialized");
            result.put("appId", appId);
            call.resolve(result);
        }));
    }

    @PluginMethod
    public void prepareInterstitial(PluginCall call) {
        String adId = call.getString("adId");
        String adName = call.getString("adName", "");
        String placement = call.getString("placement", "");

        if (adId == null || adId.isEmpty()) {
            call.reject("adId is required to load an interstitial ad.");
            return;
        }

        synchronized (this) {
            if (interstitialAd != null) {
                JSObject result = new JSObject();
                result.put("adName", adName);
                result.put("placement", placement);
                call.resolve(result);
                return;
            }

            if (isLoading) {
                call.reject("An interstitial ad is already loading.");
                return;
            }

            isLoading = true;
        }

        mainHandler.post(() -> {
            AdRequest request = new AdRequest.Builder().build();

            InterstitialAd.load(getContext(), adId, request, new InterstitialAdLoadCallback() {
                @Override
                public void onAdLoaded(@NonNull InterstitialAd ad) {
                    synchronized (AdMobPlugin.this) {
                        interstitialAd = ad;
                        isLoading = false;
                    }
                    attachFullScreenCallbacks(ad, adName, placement);

                    JSObject result = new JSObject();
                    result.put("adName", adName);
                    result.put("placement", placement);
                    notifyEvent("loaded", adName, placement);
                    call.resolve(result);
                }

                @Override
                public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                    synchronized (AdMobPlugin.this) {
                        interstitialAd = null;
                        isLoading = false;
                    }
                    notifyEvent("loadFailed", adName, placement);
                    call.reject(loadAdError.getMessage());
                }
            });
        });
    }

    @PluginMethod
    public void showInterstitial(PluginCall call) {
        String adName = call.getString("adName", "");
        mainHandler.post(() -> {
            InterstitialAd adToShow;
            synchronized (AdMobPlugin.this) {
                adToShow = interstitialAd;
            }

            if (adToShow == null) {
                call.reject("Interstitial ad is not ready yet.");
                return;
            }

            adToShow.show(getActivity());
            JSObject result = new JSObject();
            result.put("adName", adName);
            call.resolve(result);
        });
    }

    private void attachFullScreenCallbacks(InterstitialAd ad, String adName, String placement) {
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                synchronized (AdMobPlugin.this) {
                    interstitialAd = null;
                }
                notifyEvent("dismissed", adName, placement);
            }

            @Override
            public void onAdFailedToShowFullScreenContent(AdError adError) {
                synchronized (AdMobPlugin.this) {
                    interstitialAd = null;
                }
                notifyEvent("showFailed", adName, placement);
            }

            @Override
            public void onAdShowedFullScreenContent() {
                notifyEvent("shown", adName, placement);
            }

            @Override
            public void onAdClicked() {
                notifyEvent("clicked", adName, placement);
            }

            @Override
            public void onAdImpression() {
                notifyEvent("impression", adName, placement);
            }
        });
    }

    private void notifyEvent(String eventName, String adName, String placement) {
        JSObject payload = new JSObject();
        payload.put("event", eventName);
        payload.put("adName", adName);
        payload.put("placement", placement);
        notifyListeners(eventName, payload);
    }

    @Override
    protected void handleOnDestroy() {
        synchronized (this) {
            interstitialAd = null;
            isLoading = false;
        }
        super.handleOnDestroy();
    }
}
