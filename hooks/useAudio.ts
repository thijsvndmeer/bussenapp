import { useCallback, useEffect, useRef } from 'react';

export type SoundEffect =
  | 'draw'
  | 'success'
  | 'fail'
  | 'playerAdd'
  | 'playerRemove'
  | 'celebrate'
  | 'busEnter'
  | 'busStep'
  | 'busFail'
  | 'reshuffle'
  | 'disco'
  | 'stopDisco';

const DANGER_ALARM_SRC = '/assets/sounds/danger_alarm.m4a';

const createOscillatorSound = (
  ctx: AudioContext,
  {
    frequency,
    duration = 0.15,
    type = 'sine',
    volume = 0.12,
    attack = 0.01,
    decay = 0.12,
  }: {
    frequency: number;
    duration?: number;
    type?: OscillatorType;
    volume?: number;
    attack?: number;
    decay?: number;
  }
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  const now = ctx.currentTime;
  const start = now + 0.001;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration + decay);

  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + decay + 0.05);
};

export const useAudio = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const discoAudioRef = useRef<HTMLAudioElement | null>(null);
  const dangerAlarmRef = useRef<HTMLAudioElement | null>(null);

  const ensureAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return null;
      audioCtxRef.current = new AudioCtor();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(e => console.warn('Audio context resume failed', e));
    }
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    if (typeof Audio === 'undefined') return;

    const dangerAlarm = new Audio(DANGER_ALARM_SRC);
    dangerAlarm.preload = 'auto';
    dangerAlarm.load();
    dangerAlarmRef.current = dangerAlarm;

    return () => {
      dangerAlarm.pause();
      dangerAlarmRef.current = null;
      discoAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const unlock = () => ensureAudioContext();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, [ensureAudioContext]);

  const playTone = useCallback(
    (opts: Parameters<typeof createOscillatorSound>[1]) => {
      const ctx = ensureAudioContext();
      if (!ctx) return;
      createOscillatorSound(ctx, opts);
    },
    [ensureAudioContext]
  );

  const playSound = useCallback(
    (sound: SoundEffect) => {
      switch (sound) {
        case 'draw':
          playTone({ frequency: 180, duration: 0.08, type: 'triangle', volume: 0.08 });
          playTone({ frequency: 260, duration: 0.08, type: 'triangle', volume: 0.08, attack: 0.02 });
          break;
        case 'success':
          playTone({ frequency: 540, duration: 0.12, type: 'sine', volume: 0.12 });
          setTimeout(() => playTone({ frequency: 720, duration: 0.14, type: 'triangle', volume: 0.1 }), 60);
          break;
        case 'fail':
          playTone({ frequency: 220, duration: 0.16, type: 'sawtooth', volume: 0.12 });
          setTimeout(() => playTone({ frequency: 140, duration: 0.2, type: 'sine', volume: 0.08 }), 70);
          break;
        case 'playerAdd':
          playTone({ frequency: 420, duration: 0.12, type: 'square', volume: 0.1 });
          setTimeout(() => playTone({ frequency: 620, duration: 0.1, type: 'triangle', volume: 0.08 }), 50);
          break;
        case 'playerRemove':
          playTone({ frequency: 160, duration: 0.14, type: 'square', volume: 0.09 });
          break;
        case 'celebrate':
          playTone({ frequency: 620, duration: 0.12, type: 'triangle', volume: 0.12 });
          setTimeout(() => playTone({ frequency: 780, duration: 0.16, type: 'sine', volume: 0.1 }), 70);
          setTimeout(() => playTone({ frequency: 980, duration: 0.18, type: 'sine', volume: 0.08 }), 140);
          break;
        case 'busEnter':
          playTone({ frequency: 110, duration: 0.18, type: 'sawtooth', volume: 0.12 });
          setTimeout(() => playTone({ frequency: 220, duration: 0.22, type: 'triangle', volume: 0.09 }), 90);
          break;
        case 'busStep':
          playTone({ frequency: 320 + Math.random() * 80, duration: 0.1, type: 'triangle', volume: 0.1 });
          break;
        case 'busFail':
          playTone({ frequency: 200, duration: 0.14, type: 'sine', volume: 0.12 });
          setTimeout(() => playTone({ frequency: 120, duration: 0.16, type: 'sawtooth', volume: 0.1 }), 80);
          break;
        case 'reshuffle':
          playTone({ frequency: 260, duration: 0.08, type: 'triangle', volume: 0.08 });
          setTimeout(() => playTone({ frequency: 310, duration: 0.08, type: 'triangle', volume: 0.08 }), 40);
          setTimeout(() => playTone({ frequency: 360, duration: 0.08, type: 'triangle', volume: 0.08 }), 80);
          break;
        case 'disco': {
          const baseAudio = dangerAlarmRef.current;
          const audio = baseAudio ? (baseAudio.cloneNode(true) as HTMLAudioElement) : null;
          if (!audio) return;

          if (discoAudioRef.current) {
            discoAudioRef.current.pause();
            discoAudioRef.current.currentTime = 0;
          }

          audio.volume = 1.0;
          audio.play().catch(e => console.warn('Disco sound failed', e));
          discoAudioRef.current = audio;
          break;
        }
        case 'stopDisco': {
          if (discoAudioRef.current) {
            discoAudioRef.current.pause();
            discoAudioRef.current.currentTime = 0;
            discoAudioRef.current = null;
          }
          break;
        }
      }
    },
    [playTone]
  );

  return { playSound, ensureAudioContext };
};
