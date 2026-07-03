import { useEffect, useRef } from 'react';

type ResizeSnapshot = {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
};

type ResizeCallback = (snapshot: ResizeSnapshot) => void;

const subscribers = new Set<ResizeCallback>();
let rafId: number | null = null;
let listening = false;
let lastSnapshot: ResizeSnapshot | null = null;

const getSnapshot = (): ResizeSnapshot => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0, orientation: 'portrait' };
  }

  const width = Math.round(window.innerWidth);
  const height = Math.round(window.innerHeight);

  return {
    width,
    height,
    orientation: width >= height ? 'landscape' : 'portrait',
  };
};

const snapshotsEqual = (a: ResizeSnapshot | null, b: ResizeSnapshot) => (
  a !== null
  && a.width === b.width
  && a.height === b.height
  && a.orientation === b.orientation
);

const notifySubscribers = () => {
  rafId = null;
  const nextSnapshot = getSnapshot();

  if (snapshotsEqual(lastSnapshot, nextSnapshot)) return;

  lastSnapshot = nextSnapshot;
  subscribers.forEach((subscriber) => subscriber(nextSnapshot));
};

const scheduleNotify = () => {
  if (typeof window === 'undefined' || rafId !== null) return;

  rafId = window.requestAnimationFrame(notifySubscribers);
};

const addWindowListeners = () => {
  if (typeof window === 'undefined' || listening) return;

  window.addEventListener('resize', scheduleNotify, { passive: true });
  window.addEventListener('orientationchange', scheduleNotify, { passive: true });
  listening = true;
};

const removeWindowListeners = () => {
  if (typeof window === 'undefined' || !listening || subscribers.size > 0) return;

  window.removeEventListener('resize', scheduleNotify);
  window.removeEventListener('orientationchange', scheduleNotify);
  listening = false;

  if (rafId !== null) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
};

export const useThrottledResize = (
  callback: ResizeCallback,
  enabled = true,
  fireOnMount = true,
) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const subscriber: ResizeCallback = (snapshot) => callbackRef.current(snapshot);
    subscribers.add(subscriber);
    addWindowListeners();

    let mountRafId: number | null = null;

    if (fireOnMount) {
      mountRafId = window.requestAnimationFrame(() => {
        mountRafId = null;
        if (subscribers.has(subscriber)) {
          callbackRef.current(getSnapshot());
        }
      });
    }

    return () => {
      if (mountRafId !== null) {
        window.cancelAnimationFrame(mountRafId);
      }

      subscribers.delete(subscriber);
      removeWindowListeners();
    };
  }, [enabled, fireOnMount]);
};

export type { ResizeSnapshot };
