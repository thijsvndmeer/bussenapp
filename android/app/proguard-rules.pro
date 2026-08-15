# Capacitor ProGuard / R8 Rules
-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
    @android.webkit.JavascriptInterface public *;
}

# Preserve line numbers for stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Google AdMob & Plugins
-keep class com.google.android.gms.ads.** { *; }
-keep class com.capacitorcommunity.admob.** { *; }
-keep class com.capacitor.camera.** { *; }
