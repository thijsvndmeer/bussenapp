import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const Root = () => {
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
  }, []);

  return <App />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);