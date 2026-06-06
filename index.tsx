import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { useTranslation } from './i18n';
import { BusFront } from 'lucide-react';

const Root = () => {
  const { t } = useTranslation();
  const [showCrashNotification, setShowCrashNotification] = useState(false);
  const [crashMessage, setCrashMessage] = useState('');

  useEffect(() => {
    // 1. Record actual load time for next time
    const loadStartTime = (window as any).__loader_start;
    if (loadStartTime) {
      const loadTime = performance.now() - loadStartTime;
      localStorage.setItem('last_load_dur', Math.round(loadTime).toString());
    }

    // 2. Trigger completion and fade
    const portal = document.getElementById('loader-portal');
    if (portal) {
      // Force 100% state instantly before/during fade to prevent drift
      document.documentElement.classList.add('loader-complete');
      
      // Start fade
      portal.classList.add('loader-fading');
      
      // Remove from DOM after transition finishes
      setTimeout(() => {
        portal.remove();
        document.documentElement.classList.remove('loader-complete', 'loader-instant');
      }, 300);
    }

    // 3. Check for crash
    try {
      const crashed = localStorage.getItem('bus_app_crashed');
      if (crashed === 'true') {
        const msg = localStorage.getItem('bus_app_crash_msg') || '';
        setCrashMessage(msg);
        setShowCrashNotification(true);
        localStorage.removeItem('bus_app_crashed');
        localStorage.removeItem('bus_app_crash_msg');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const renderCrashNotification = () => {
    if (!showCrashNotification) return null;

    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl"
        onClick={() => setShowCrashNotification(false)}
      >
        <div 
          className="w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.25)] flex flex-col items-center text-center relative p-8 animate-pop"
          onClick={e => e.stopPropagation()}
        >
          {/* Animated Bus and Explosion */}
          <div className="relative h-32 w-32 flex items-center justify-center mb-6">
            <div className="animate-bus-crash text-red-500 relative z-10">
              <BusFront size={64} className="filter drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]" />
            </div>
            <div className="absolute top-2 right-2 text-3xl animate-explosion">💥</div>
            <div className="absolute bottom-2 left-2 text-2xl animate-explosion">🔥</div>
          </div>

          <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">
            {t("De bus is gecrasht!")}
          </h3>
          
          <p className="text-slate-300 text-sm leading-relaxed mb-8 px-2">
            {t("Het spel is herstart om de fout op te lossen.")}
            {crashMessage && (
              <span className="block mt-4 text-xs font-mono bg-black/40 border border-white/5 rounded-lg p-2.5 text-red-400 overflow-x-auto max-w-full select-text text-left max-h-32">
                {crashMessage}
              </span>
            )}
          </p>

          <button
            onClick={() => setShowCrashNotification(false)}
            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-[0_4px_15px_rgba(239,68,68,0.4)] active:scale-95 transition-all uppercase tracking-widest"
          >
            {t("Sluiten")}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <App />
      {renderCrashNotification()}
    </>
  );
};


class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
    triggerCrashRestart(error?.message || String(error));
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const triggerCrashRestart = (msg: string) => {
  try {
    const lastCrash = localStorage.getItem('bus_app_last_crash_time');
    const now = Date.now();
    
    // Prevent infinite loop if crash happens within 5 seconds of loading
    if (lastCrash && (now - parseInt(lastCrash)) < 5000) {
      console.error("Infinite loop crash prevention. Not reloading.");
      return;
    }
    
    localStorage.setItem('bus_app_last_crash_time', now.toString());
    localStorage.setItem('bus_app_crashed', 'true');
    localStorage.setItem('bus_app_crash_msg', msg);
  } catch (e) {
    console.error("Failed to write crash data to localStorage", e);
  }
  window.location.reload();
};

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (!event.error && !event.message) return;
    console.error("Global error caught:", event.error || event.message);
    triggerCrashRestart(event.error?.message || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error("Global promise rejection caught:", event.reason);
    triggerCrashRestart(event.reason?.message || String(event.reason));
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>
);