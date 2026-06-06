
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card, GamePhase, Player, Rank, RoundStep, Suit, GameMode, GameSettings, CardStyle, UITheme } from './types';
import PlayingCard from './components/PlayingCard';
import { Users, Beer, Play, Settings, Check, X, ChevronUp, ChevronDown, Trophy, ArrowRight, Shield, ThumbsUp, ThumbsDown, Sparkles, Camera as CameraIcon, Zap, Skull, HeartPulse, BusFront, Image as ImageIcon, ArrowUpDown, GripVertical, Pencil, Plus, Trash2, RotateCcw, Video, Eye, Clapperboard } from 'lucide-react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { AdMob, RewardAdOptions, AdMobRewardItem, AdOptions, AdLoadInfo } from '@capacitor-community/admob';
import { StatusBar } from '@capacitor/status-bar';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import './styles/animations.css';
import { useTranslation, currentLanguage, setLanguage } from "./i18n";

const ADMOB_APP_ID = 'ca-app-pub-7627297114391750~5463450367';
const ADMOB_INTERSTITIAL_QUIT_UNIT_ID = 'ca-app-pub-7627297114391750/6867442667';
const ADMOB_INTERSTITIAL_LEADERBOARD_UNIT_ID = 'ca-app-pub-7627297114391750/7299276212';
const ADMOB_REWARDED_UNIT_ID = 'ca-app-pub-7627297114391750/9512575855';
const INTERSTITIAL_PLACEMENT = 'post_leaderboard_continue'; // Placement: after leaderboard, at end of round

// --- HELPERS ---

const getRankString = (rank: Rank) => {
  switch (rank) {
    case Rank.JACK: return 'J';
    case Rank.QUEEN: return 'Q';
    case Rank.KING: return 'K';
    case Rank.ACE: return 'A';
    default: return rank.toString();
  }
};

// --- CONSTANTS & PHRASES ---

const DEFAULT_SUCCESS_PHRASES_NL = [
  "Lekker pik!", "Vo!", "Hoppa!", "👨‍🍳👨‍🍳", "Strijder!",
  "ez W,", "Netjes!", "dat is m!", "Biem!", "Jaja!",
  "locked in,", "Heerlijk!", "top!", "insane!",
  "keurig,", "Bingo!", "clean.", "bam!",
  "big brain,", "slayy,"
];

const DEFAULT_FAILURE_PHRASES_NL = [
  "Helaas pindakaas!", "Drinken pik!", "Zuur!", "Aii,",
  "zuipen kut,", "jezus alweer??", "waarom ben je zo slecht,", "skill issue,",
  "Dom dom dom!", "Pech gehad!", "Oef...", "Foutje,",
  "trek gwn een bak pussy.", "lol,", "ha bier,", "maat..",
  "Huilie huilie!", "zo slecht!", "Niet te geloven!", "Koekoek!", "Incapabele ziel.."
];

const DEFAULT_LOSER_TITLES_NL = [
  "🍺🍺🍺", "De Lul", "L gepakt", "hahaha",
  "🧌🧌", "Succes Vriend", "ai ai ai", "daar ga je",
  "💀💀", "🤡🤡", "zo slecht", "Kansloos",
  "Coma zuipen!!", "Proost!"
];

const DEFAULT_SUCCESS_PHRASES_EN = [
  "Nice one!", "Nice!", "Boom!", "👨‍🍳👨‍🍳", "Warrior!",
  "ez W,", "Clean!", "that's it!", "Bam!", "Yes sir!",
  "locked in,", "Lovely!", "perfect!", "insane!",
  "neat,", "Bingo!", "clean.", "bam!",
  "big brain,", "slayy,"
];

const DEFAULT_FAILURE_PHRASES_EN = [
  "Bad luck!", "Drink up!", "Ouch!", "Aii,",
  "cheers,", "lord, again??", "why are you so bad,", "skill issue,",
  "Stupid!", "Out of luck!", "Oof...", "My bad,",
  "just down it.", "lol,", "ha beer,", "mate..",
  "Crybaby!", "so bad!", "Unbelievable!", "Cuckoo!", "Incapable soul.."
];

const DEFAULT_LOSER_TITLES_EN = [
  "🍺🍺🍺", "The Loser", "Caught the L", "hahaha",
  "🧌🧌", "Good luck friend", "ai ai ai", "there you go",
  "💀💀", "🤡🤡", "so bad", "Hopeless",
  "Drink up!!", "Cheers!"
];

type PhraseCategory = 'success' | 'failure' | 'loser';

const DEFAULT_PHRASES: Record<string, Record<PhraseCategory, string[]>> = {
  nl: { success: DEFAULT_SUCCESS_PHRASES_NL, failure: DEFAULT_FAILURE_PHRASES_NL, loser: DEFAULT_LOSER_TITLES_NL },
  en: { success: DEFAULT_SUCCESS_PHRASES_EN, failure: DEFAULT_FAILURE_PHRASES_EN, loser: DEFAULT_LOSER_TITLES_EN },
};

const CUSTOM_PHRASES_KEY = 'bus-app-custom-phrases-v1';

const PYRAMID_WARNING_PHRASES = [
  "Hoho! Begin onderaan, stiekemerds!",
  "Niet zo valsspelen he...",
  "Dat is een no-go zone, vriend!",
  "Eerst de basis, dan de top!",
  "Geduld is een schone zaak (onderaan)",
  "Piramide-etiquette, waar is die?",
  "Niet smokkelen, hè?",
  "Onderste kaart eerst!",
  "wat doe je debiel...",
  "Je bent betrapt!",
  "Zo werkt het niet!",
  "Begin onderaan!",
  "Niet vals spelen!",
  "Eerst de onderste rij!",
  "Kom op joh...",
  "Niet zo oneerlijk!",
  "Hou je aan de regels!",
];

// --- UTILS & FX ---

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const triggerHaptic = async (
  type:
    | 'light'
    | 'medium'
    | 'heavy'
    | 'success'
    | 'warning'
    | 'error'
    | 'majorLoss'
) => {
  try {
    switch (type) {
      case 'light': await Haptics.impact({ style: ImpactStyle.Light }); break;
      case 'medium': await Haptics.impact({ style: ImpactStyle.Medium }); break;
      case 'heavy': await Haptics.impact({ style: ImpactStyle.Heavy }); break;
      case 'success': await Haptics.notification({ type: NotificationType.Success }); break;
      case 'warning': await Haptics.notification({ type: NotificationType.Warning }); break;
      case 'error': await Haptics.impact({ style: ImpactStyle.Heavy }); break;
      case 'majorLoss': await Haptics.vibrate({ duration: 650 }); break;
    }
  } catch (e) {
    // Fallback to web API if native fails or is unavailable
    if (navigator.vibrate) {
      switch (type) {
        case 'light': navigator.vibrate(10); break;
        case 'medium': navigator.vibrate(40); break;
        case 'heavy': navigator.vibrate(80); break;
        case 'success': navigator.vibrate([25, 30, 25]); break;
        case 'warning': navigator.vibrate([50, 30, 50]); break;
        case 'error': navigator.vibrate([90, 40, 90]); break;
        case 'majorLoss': navigator.vibrate([200, 150, 200, 150, 300]); break;
      }
    }
  }
};

type SoundEffect =
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

const PLAYER_DATA_KEY = 'bus-app-player-data-v1';
const GAME_STATE_KEY = 'bus-app-game-state-v1';
const PYRAMID_INSTRUCTIONS_COLLAPSED_KEY = 'bus-app-pyramid-instructions-collapsed-v1';
const BUS_INSTRUCTIONS_COLLAPSED_KEY = 'bus-app-bus-instructions-collapsed-v1';
const GAME_SETTINGS_KEY = 'bus-app-game-settings-v1';
const PATCH_NOTES_VERSION = '1.2';
const PATCH_NOTES_SEEN_KEY = 'bus-app-patch-notes-seen-version';
const storageAvailable = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const UPDATE_1_2_PATCH_NOTES = [
  '🚌 Gedeelde bus animaties en UI vernieuwd voor nóg meer plezier!',
  '🃏 De busrit gebruikt nu alleen nog ongespeelde kaarten van de piramide',
  '🍻 Nieuwe, beter zichtbare biertjes (🍺) als slok-indicatoren',
  '✨ De "Naar het Einde" knop ziet er spectaculairder uit',
  '🌍 Volledige Engelse vertaling toegevoegd',
  '🔇 Automatisch verbergen van de statusbalk voor een full-screen ervaring',
  '🎵 Disco geluid stopt nu netjes als je verder speelt',
  '🛡️ Duidelijkere tekst voor spelers die immuun zijn (Ging vorige ronde al in de bus)',
  '📺 Mogelijkheid toegevoegd om (vrijwillig) een ad te kijken voor nieuwe kaartstijlen!',
];

const queueStorageWrite = (key: string, value: string, label: string) => {
  if (!storageAvailable) return;

  const write = () => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Kon ${label} niet opslaan`, error);
    }
  };

  const requester = (window as typeof window & { requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number }).requestIdleCallback;

  if (typeof requester === 'function') {
    requester(() => write(), { timeout: 500 });
  } else {
    setTimeout(write, 0);
  }
};

const resizeImage = (file: File, maxDimension = 640, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Kon afbeelding niet lezen'));
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context ontbreekt'));

        // Crop to center square first
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const outputSize = Math.min(side, maxDimension);

        canvas.width = outputSize;
        canvas.height = outputSize;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, outputSize, outputSize);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Kon afbeelding niet laden'));
      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
};

const cropToSquareDataUrl = (dataUrl: string, maxDimension = 640, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context ontbreekt'));

      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const outputSize = Math.min(side, maxDimension);

      canvas.width = outputSize;
      canvas.height = outputSize;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, outputSize, outputSize);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Kon afbeelding niet laden'));
    img.src = dataUrl;
  });
};

const ALL_SUITS: Suit[] = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];

const PREVIEW_CARD: Card = { suit: Suit.HEARTS, rank: Rank.KING, id: 'preview-king' };

const createDeck = (): Card[] => {
  const suits = ALL_SUITS;
  const ranks = [Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE];
  const deck: Card[] = [];
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({ suit, rank, id: `${suit}-${rank}-${Math.random()}` });
    });
  });
  return deck;
};

const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};


// --- COMPONENTS ---

const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<{ id: number, left: string, color: string, delay: string, duration: string }[]>([]);

  useEffect(() => {
    const colors = ['#ef4444', '#3b82f6', '#eab308', '#10b981', '#a855f7', '#ec4899'];
    const newParticles = Array.from({ length: 75 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: `${Math.random() * 0.5}s`,
      duration: `${2 + Math.random() * 2}s`
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute w-3 h-3 rounded-sm shadow-lg" // Remove top-0
          style={{
            top: `${-10 - Math.random() * 10}%`, // Start slightly above (e.g., -10% to -20%)
            left: p.left,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration} linear forwards`,
            animationDelay: p.delay
          }}
        />
      ))}
    </div>
  );
};



// --- ROOT CONTAINER ---

interface RootContainerProps {
  children: React.ReactNode;
  className?: string;
  shake?: boolean;
  variant?: 'default' | 'pyramid';
  isDiscoActive?: boolean; // Add this
  style?: React.CSSProperties;
  disableBaseBg?: boolean;
  showTexture?: boolean;
  disableSafeTop?: boolean;
  showChest?: boolean;
  theme?: UITheme; // Added theme
}

interface PersistedPlayerState {
  players: Player[];
  newPlayerName: string;
  newPlayerImage: string | null;
}

interface PersistedGameState {
  settings: GameSettings;
  phase: GamePhase;
  deck: Card[];
  immunePlayerId: string | null;
  activePlayerIndex: number;
  roundStep: RoundStep;
  feedback: { text: string; type: 'success' | 'error' | 'neutral' | 'info' } | null;
  lastDrawnCard: Card | null;
  isWaitingForNextPlayer: boolean;
  pyramid: (Card | null)[][];
  revealedPyramidCards: string[];
  pendingMatches: { card: Card; sips: number; matches: { player: Player; cardIndex: number }[] } | null;
  loserReveal: { player: Player; title: string } | null;
  isPyramidComplete: boolean;
  busDriver: Player | null;
  busPassengers: Player[];
  busCards: Card[];
  currentBusIndex: number;
  busWrongCardIndex: number | null;
  isBusEntrance: boolean;
  isBusWon: boolean;
  busMode: 'physical' | 'digital' | null;
  physicalBusPosition: number;
  busDecksUsed: number;
  pyramidMode: 'physical' | 'digital';
  busSelectionCandidateId: string | null;
  usedPhrases: string[];
}

type Feedback = NonNullable<PersistedGameState['feedback']>;



const GlobalAnimations = () => (



  <style>{`



    @keyframes disco-gradient {
      0% { background-position: 0% 50%; }
      100% { background-position: 100% 50%; }
    }

    @keyframes end-gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    @keyframes bounce-subtle {



      0%, 100% { transform: translateY(0); }



      50% { transform: translateY(-5px); }



    }



  `}</style>



);







// --- AMBIENT BACKGROUND COMPONENTS ---

const CalmBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute w-[250px] h-[250px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.15),_transparent_70%)] blur-[30px] -top-10 -right-10 animate-pulse" style={{ animationDuration: '10s' }} />
    <div className="absolute w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.1),_transparent_70%)] blur-[35px] -bottom-12 -left-10 animate-pulse" style={{ animationDuration: '7s' }} />
  </div>
);

const BeerBackground: React.FC = () => {
  const bubbles = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 5 + 3}px`,
    duration: `${Math.random() * 4 + 4}s`,
    delay: `${Math.random() * 5}s`
  })), []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {bubbles.map(b => (
        <div 
          key={b.id} 
          className="bubble-elem" 
          style={{ left: b.left, width: b.size, height: b.size, animationDuration: b.duration, animationDelay: b.delay }}
        />
      ))}
    </div>
  );
};

const MetroBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-15">
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <path d="M -20,100 L 150,100 L 220,170 L 360,170" stroke="var(--theme-accent)" strokeWidth="2" fill="none" strokeDasharray="4 4"/>
      <path d="M 120,-20 L 120,150 L 180,210 L 180,640" stroke="#DC2626" strokeWidth={1.5} fill="none"/>
    </svg>
  </div>
);

const RootContainer: React.FC<RootContainerProps> = ({ children, className = '', shake = false, variant = 'default', isDiscoActive = false, style, disableBaseBg = false, showTexture = true, disableSafeTop = false, showChest = false, theme = UITheme.CLASSIC }) => {
  const [showPatchChest, setShowPatchChest] = useState(() => {
    if (!storageAvailable) return true;
    try {
      return localStorage.getItem(PATCH_NOTES_SEEN_KEY) !== PATCH_NOTES_VERSION;
    } catch {
      return true;
    }
  });

  const [isPatchNotesOpen, setIsPatchNotesOpen] = useState(false);

  const openPatchNotes = useCallback(() => {
    setIsPatchNotesOpen(true);
    setShowPatchChest(false);
    if (!storageAvailable) return;
    try {
      localStorage.setItem(PATCH_NOTES_SEEN_KEY, PATCH_NOTES_VERSION);
    } catch (error) {
      console.warn('Kon patch notes status niet opslaan', error);
    }
  }, []);

  let bgClass = disableBaseBg ? '' : 'bg-animated-gradient';
  let additionalStyles: React.CSSProperties = {};

  if (variant === 'pyramid') bgClass = 'bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black';

  if (isDiscoActive) {
    bgClass = ''; // Clear default bgClass
    additionalStyles = {
      background: 'linear-gradient(120deg, #ff3a7f, #ffb347, #5ac8fa, #7c3aed, #0ea5e9, #22d3ee, #f472b6)',
      backgroundSize: '400% 400%',
      animation: 'disco-gradient 3s ease infinite',
    };
  }

  const combinedStyles = { ...additionalStyles, ...style };

  const isAndroid = Capacitor.getPlatform() === 'android';
  const safeTopPadding = isAndroid ? 'max(env(safe-area-inset-top, 0px), 16px)' : 'env(safe-area-inset-top, 0px)';
  const containerPaddingTop = disableSafeTop ? '0px' : safeTopPadding;

  const finalStyle = {
    paddingTop: containerPaddingTop,
    '--safe-top': safeTopPadding,
    ...combinedStyles,
  } as React.CSSProperties;

  return (
    <div className={`h-[100dvh] w-full flex flex-col overflow-hidden relative ${bgClass} ${className} ${shake ? 'animate-shake' : ''}`} style={finalStyle}>
      <GlobalAnimations />

      {/* Ambient background visual effects based on theme */}
      {theme === UITheme.CALM && <CalmBackground />}
      {theme === UITheme.BEER && <BeerBackground />}
      {theme === UITheme.METRO && <MetroBackground />}

      {showChest && showPatchChest && (
        <button
          type="button"
          onClick={openPatchNotes}
          aria-label={`Open update ${PATCH_NOTES_VERSION} patch notes`}
          title={`Update ${PATCH_NOTES_VERSION}`}
          className="fixed z-[99] p-2.5 rounded-2xl bg-amber-500/20 border border-amber-300/60 text-amber-100 backdrop-blur-sm shadow-[0_0_28px_rgba(251,191,36,0.65)] hover:scale-105 hover:bg-amber-400/25 active:scale-95 transition-all duration-200"
          style={{ top: 'calc(var(--safe-top, 0px) + 0.75rem)', right: '1rem' }}
        >
          <span className="absolute inset-0 rounded-2xl shadow-[0_0_36px_rgba(251,191,36,0.55)] pointer-events-none" />
          <svg viewBox="0 0 24 24" className="w-6 h-6 relative" fill="none" aria-hidden="true">
            <rect x="3" y="8" width="18" height="12" rx="2" className="fill-amber-700" />
            <path d="M3 12h18" className="stroke-amber-300" strokeWidth="2" strokeLinecap="round" />
            <path d="M8 8a4 4 0 0 1 8 0" className="stroke-amber-300" strokeWidth="2" strokeLinecap="round" />
            <rect x="10" y="12" width="4" height="4" rx="1" className="fill-amber-200" />
          </svg>
        </button>
      )}

      {/* Scanlines / Overlay effect */}
      {showTexture && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>}

      {isPatchNotesOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in" onClick={() => setIsPatchNotesOpen(false)}>
          <div className="w-full max-w-lg p-6 flex flex-col max-h-[85vh] bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl relative mx-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setIsPatchNotesOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
            <div className="mb-6 shrink-0 pr-8">
              <h1 className="text-3xl font-black text-white flex items-center gap-2 mb-1 tracking-tight">
                🪙 Update {PATCH_NOTES_VERSION}
              </h1>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <ul className="space-y-3 text-slate-300 text-sm leading-relaxed mb-4">
                {UPDATE_1_2_PATCH_NOTES.map((note, index) => (
                  <li key={index} className="flex items-start p-3.5 rounded-xl border border-slate-700/30 bg-slate-800/40 shadow-sm">
                    <span className="mr-3 text-lg leading-none">{note.split(' ')[0]}</span>
                    <span className="flex-1">{note.substring(note.indexOf(' ') + 1)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setIsPatchNotesOpen(false)}
              className="mt-6 w-full py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-xl uppercase tracking-widest active:scale-95 transition-transform shrink-0"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}

      {children}
    </div>
  );
};

// --- APP COMPONENT ---

const App: React.FC = () => {
  const { t, lang, setLanguage } = useTranslation();
  const getSipsText = (count: number) => `${count} ${count === 1 ? t('slok') : t('slokken')}`;
  // --- STATE ---
  const [settings, setSettings] = useState<GameSettings>(() => {
    const defaultSettings: GameSettings = {
      mode: GameMode.DIGITAL,
      physicalMode: false,
      pyramidRows: 4,
      sharedBus: false,
      busLength: 6,
      busDecks: 1,
      cardStyle: CardStyle.CLASSIC,
      doublePyramidCards: true,
      theme: UITheme.CLASSIC,
    };

    if (!storageAvailable) return defaultSettings;

    try {
      const saved = localStorage.getItem(GAME_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migration: CREATIVE/NEON_GLASS -> NEON
        if (parsed.cardStyle === 'CREATIVE' || parsed.cardStyle === 'NEON_GLASS') {
          parsed.cardStyle = CardStyle.NEON;
        }
        // Merge to ensure new settings get defaults
        return { ...defaultSettings, ...parsed };
      }
    } catch (e) {
      console.warn("Kon instellingen niet laden, gebruik standaardinstellingen", e);
      localStorage.removeItem(GAME_SETTINGS_KEY);
    }

    return defaultSettings;
  });

  const renderStyleUnlockModal = () => {
    if (!styleToUnlock) return null;

    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setStyleToUnlock(null)}>
        <div 
          className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center text-center relative"
          onClick={e => e.stopPropagation()}
        >
          <div className="pt-10 pb-6 px-8 flex flex-col items-center">
            {/* Reward Icon / Graphic */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-xl relative z-10 border border-amber-200/50">
                <Clapperboard size={48} className="text-amber-950" />
              </div>
            </div>

            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
              {t("Stijl Wisselen")}
            </h3>
            
            <p className="text-slate-400 text-sm leading-relaxed mb-8 px-2">
              {t("Kijk een korte video om direct over te schakelen naar de")} <span className="text-amber-400 font-bold">{t(styleToUnlock === CardStyle.MODERN ? "Modern" : styleToUnlock === CardStyle.DARK ? "Donker" : styleToUnlock === CardStyle.CLASSIC ? "Klassiek" : "Neon")}</span> {t("stijl!")}
            </p>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={async () => {
                  const style = styleToUnlock;
                  setStyleToUnlock(null);
                  const played = await showRewardedAd();
                  if (played) {
                    const n = { ...settings, cardStyle: style };
                    setSettings(n);
                    queueStorageWrite(GAME_SETTINGS_KEY, JSON.stringify(n), 'instellingen');
                    triggerHaptic('heavy');
                  }
                }}
                className="w-full py-5 bg-gradient-to-r from-amber-400 to-amber-600 text-amber-950 font-black rounded-2xl shadow-[0_8px_0_rgb(180,83,9)] hover:brightness-110 active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <Play size={22} fill="currentColor" /> {t("Video Kijken")}
              </button>
              
              <button
                onClick={() => setStyleToUnlock(null)}
                className="w-full py-4 text-slate-500 font-bold hover:text-white transition-colors"
              >
                {t("Nee bedankt")}
              </button>
            </div>
          </div>
          
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        </div>
      </div>
    );
  };

  const renderDeckPreview = () => {
    if (!previewDeckStyle) return null;

    const sampleCards: Card[] = [
      { suit: Suit.HEARTS, rank: Rank.ACE, id: 'p1' },
      { suit: Suit.HEARTS, rank: Rank.KING, id: 'p2' },
      { suit: Suit.DIAMONDS, rank: Rank.QUEEN, id: 'p3' },
      { suit: Suit.CLUBS, rank: Rank.JACK, id: 'p4' },
      { suit: Suit.SPADES, rank: Rank.TEN, id: 'p5' },
    ];

    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in" onClick={() => setPreviewDeckStyle(null)}>
        <div className="w-full max-w-lg p-6 flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-8 shrink-0">
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                {t(previewDeckStyle === CardStyle.MODERN ? "Modern" : 
                   previewDeckStyle === CardStyle.DARK ? "Donker" : 
                   previewDeckStyle === CardStyle.CLASSIC ? "Klassiek" : "Neon")} {t("Stijl")}
              </h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t("Volledig Deck Voorbeeld")}</p>
            </div>
            <button onClick={() => setPreviewDeckStyle(null)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 gap-6 pb-10">
              {/* Back Preview (Achterkant) First */}
              <div className="flex flex-col items-center gap-3 animate-pop">
                <PlayingCard card={sampleCards[0]} isFaceDown size="md" style={previewDeckStyle} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t("Achterkant")}</span>
              </div>

              {sampleCards.map(card => (
                <div key={card.id} className="flex flex-col items-center gap-3 animate-pop">
                  <PlayingCard card={card} size="md" style={previewDeckStyle} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t(card.suit)} {getRankString(card.rank)}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPreviewDeckStyle(null)}
            className="mt-6 w-full py-4 bg-white text-black font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-transform shrink-0"
          >
            {t("Sluiten")}
          </button>
        </div>
      </div>
    );
  };

  // Quit confirmation state
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  // Physical mode info popup state
  const [showPhysicalModeInfo, setShowPhysicalModeInfo] = useState(false);
  const [previewDeckStyle, setPreviewDeckStyle] = useState<CardStyle | null>(null);
  const [styleToUnlock, setStyleToUnlock] = useState<CardStyle | null>(null);

  const [phase, setPhase] = useState<GamePhase>(GamePhase.SETUP);
  const [players, setPlayers] = useState<Player[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [immunePlayerId, setImmunePlayerId] = useState<string | null>(null);

  // Setup State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerImage, setNewPlayerImage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMoreSettingsOpen, setIsMoreSettingsOpen] = useState(false);
  const [isPhotoOptionsModalOpen, setIsPhotoOptionsModalOpen] = useState(false); // New state for photo options modal
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputCameraRef = useRef<HTMLInputElement>(null);
  const adMobReadyRef = useRef(false);
  const adInterstitialPromiseRef = useRef<Promise<void> | null>(null);
  const adRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAdShownRef = useRef<number>(0);
  const AD_COOLDOWN_MS = 60_000; // 1 minute cooldown between ads

  // Visuals State
  const [screenShake, setScreenShake] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDiscoActive, setIsDiscoActive] = useState(false);

  // Phrase Randomization State
  const [usedPhrases, setUsedPhrases] = useState<Set<string>>(new Set());
  const [customPhrases, setCustomPhrases] = useState<Record<string, Record<PhraseCategory, string[]>>>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PHRASES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return { nl: { success: [], failure: [], loser: [] }, en: { success: [], failure: [], loser: [] } };
  });
  const [isPhraseEditorOpen, setIsPhraseEditorOpen] = useState(false);
  const [editorCategory, setEditorCategory] = useState<PhraseCategory>('success');
  const [editingPhraseText, setEditingPhraseText] = useState('');

  // Round 1-4 State
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [roundStep, setRoundStep] = useState<RoundStep>(RoundStep.RED_BLACK);
  const [feedback, setFeedback] = useState<{ text: string, type: 'success' | 'error' | 'neutral' | 'info' } | null>(null);
  const [lastDrawnCard, setLastDrawnCard] = useState<Card | null>(null);
  const [isWaitingForNextPlayer, setIsWaitingForNextPlayer] = useState(false);
  const [pyramidMode, setPyramidMode] = useState<'physical' | 'digital'>(
    settings.mode === GameMode.PHYSICAL ? 'physical' : 'digital'
  );

  // Pyramid State
  const [pyramid, setPyramid] = useState<(Card | null)[][]>([]);
  const [revealedPyramidCards, setRevealedPyramidCards] = useState<Set<string>>(new Set());
  const [pendingMatches, setPendingMatches] = useState<{ card: Card, sips: number, matches: { player: Player, cardIndex: number }[] } | null>(null);
  const [loserReveal, setLoserReveal] = useState<{ player: Player, title: string } | null>(null);
  const [isPyramidComplete, setIsPyramidComplete] = useState(false);
  const [isSelectingBusPlayer, setIsSelectingBusPlayer] = useState(false);
  const [isPyramidInstructionsCollapsed, setIsPyramidInstructionsCollapsed] = useState(false);
  const [isPyramidDoubleSetup, setIsPyramidDoubleSetup] = useState(false);
  const [pyramidDoubleSetupRow, setPyramidDoubleSetupRow] = useState(0);
  const [doubledPyramidCardIds, setDoubledPyramidCardIds] = useState<Set<string>>(new Set());
  const [pulseValidCards, setPulseValidCards] = useState(false);
  const [warningCooldown, setWarningCooldown] = useState(false);

  // Bus State
  const [busDriver, setBusDriver] = useState<Player | null>(null);
  const [busPassengers, setBusPassengers] = useState<Player[]>([]);
  const [busCards, setBusCards] = useState<Card[]>([]);
  const [currentBusIndex, setCurrentBusIndex] = useState(1);
  const [busWrongCardIndex, setBusWrongCardIndex] = useState<number | null>(null);
  const [isBusEntrance, setIsBusEntrance] = useState(false);
  const [isBusWon, setIsBusWon] = useState(false);
  const [busDecksUsed, setBusDecksUsed] = useState(1);
  const [busDeck, setBusDeck] = useState<Card[]>([]);
  const [isBusDeckExhausted, setIsBusDeckExhausted] = useState(false);
  const [busFocusIndex, setBusFocusIndex] = useState<number | null>(null);
  const [busWinBurst, setBusWinBurst] = useState(false);
  const [busMode, setBusMode] = useState<'physical' | 'digital' | null>(null);
  const [physicalBusPosition, setPhysicalBusPosition] = useState(1);
  const [isBusInstructionsCollapsed, setIsBusInstructionsCollapsed] = useState(false);
  const [busSelectionCandidateId, setBusSelectionCandidateId] = useState<string | null>(null);
  const busScrollRef = useRef<HTMLDivElement>(null);
  const busCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const busProgressContainerRef = useRef<HTMLDivElement>(null);
  const busProgressContentRef = useRef<HTMLDivElement>(null);
  const busProgressItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [busProgressScale, setBusProgressScale] = useState(1);

  const activePlayer = useMemo(() => players[activePlayerIndex], [players, activePlayerIndex]);
  const currentDealerIndex = useMemo(() => players.findIndex(p => p.isDealer), [players]);
  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => (b.drinksTaken + b.adtjes * 5) - (a.drinksTaken + a.adtjes * 5)),
    [players]
  );



  // Audio FX
  const audioCtxRef = useRef<AudioContext | null>(null);
  const discoAudioRef = useRef<HTMLAudioElement | null>(null);

  const ensureAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtor = (window as typeof window & { webkitAudioContext?: typeof AudioContext }).AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return null;
      audioCtxRef.current = new AudioCtor();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

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
          if (discoAudioRef.current) {
            discoAudioRef.current.pause();
            discoAudioRef.current.currentTime = 0;
          }
          const audio = new Audio('/assets/sounds/danger_alarm.m4a');
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

  const resetBusState = useCallback(() => {
    setBusMode(null);
    setBusPassengers([]);
    setBusCards([]);
    setBusDeck([]);
    setBusDecksUsed(1);
    setIsBusDeckExhausted(false);
    setBusWrongCardIndex(null);
    setBusFocusIndex(null);
    setIsBusWon(false);
    setIsBusEntrance(false);
    setBusWinBurst(false);
    setCurrentBusIndex(1);
    setPhysicalBusPosition(1);
    setFeedback(null);
  }, []);

const initializeAdMob = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || adMobReadyRef.current) return;

    try {
      await AdMob.initialize({
        initializeForTesting: false,
      });
      adMobReadyRef.current = true;
    } catch (error) {
      console.warn('AdMob initialisatie mislukt', error);
    }
  }, []);

  // Pre-load an interstitial ad so it's ready to display instantly
  const prepareAdInterstitial = useCallback((adId: string) => {
    // If we're already loading or have loaded an ad, just return that Promise
    if (adInterstitialPromiseRef.current) return adInterstitialPromiseRef.current;

    // Clear any existing retry timeout
    if (adRetryTimeoutRef.current) {
      clearTimeout(adRetryTimeoutRef.current);
      adRetryTimeoutRef.current = null;
    }

    if (!Capacitor.isNativePlatform()) return Promise.resolve();

    const loadAd = async () => {
      try {
        if (!adMobReadyRef.current) {
          await AdMob.initialize({
            initializeForTesting: false,
          });
          adMobReadyRef.current = true;
        }

        await AdMob.prepareInterstitial({ adId });
      } catch (error) {
        console.warn('Interstitial voorbereiden mislukt', error);
        adInterstitialPromiseRef.current = null; // Clear so we can try again later

        // Schedule a retry after 15 seconds
        if (adRetryTimeoutRef.current) clearTimeout(adRetryTimeoutRef.current);
        adRetryTimeoutRef.current = setTimeout(() => {
          adRetryTimeoutRef.current = null;
          prepareAdInterstitial(adId);
        }, 15_000);
      }
    };

    adInterstitialPromiseRef.current = loadAd();
    return adInterstitialPromiseRef.current;
  }, []);

  // Cleanup ad retry timeout on unmount
  useEffect(() => {
    return () => {
      if (adRetryTimeoutRef.current) {
        clearTimeout(adRetryTimeoutRef.current);
      }
    };
  }, []);

  const prepareRewardedAd = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await AdMob.prepareRewardVideoAd({ adId: ADMOB_REWARDED_UNIT_ID });
    } catch (error) {
      console.warn('AdMob rewarded preload failed', error);
    }
  }, []);

  const showRewardedAd = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return true; // Always success on web for testing

    try {
      await prepareRewardedAd();
      const reward = await AdMob.showRewardVideoAd();
      return !!reward;
    } catch (error) {
      console.warn('AdMob rewarded show failed', error);
      return false;
    }
  }, [prepareRewardedAd]);

  // Interstitial ad
  // Includes 1-minute cooldown to prevent multiple ads from stacking
  const showInterstitialAd = useCallback(async (type: 'QUIT' | 'LEADERBOARD') => {
    if (!Capacitor.isNativePlatform()) return;

    const now = Date.now();
    if (now - lastAdShownRef.current < AD_COOLDOWN_MS) {
      console.log('Ad cooldown actief, overgeslagen');
      return;
    }

    const adId = type === 'QUIT' ? ADMOB_INTERSTITIAL_QUIT_UNIT_ID : ADMOB_INTERSTITIAL_LEADERBOARD_UNIT_ID;

    try {
      // Ensure it is prepared (this will wait if a background preload is still running)
      await prepareAdInterstitial(adId);

      await AdMob.showInterstitial();
      lastAdShownRef.current = Date.now();
      adInterstitialPromiseRef.current = null; // Reset – force fresh preload for next time
    } catch (error) {
      console.warn('Interstitial tonen mislukt', error);
      adInterstitialPromiseRef.current = null; // Reset on failure too
    }
  }, [prepareAdInterstitial]);

  const persistPlayers = useCallback(() => {
    const payload: PersistedPlayerState = {
      players,
      newPlayerName,
      newPlayerImage,
    };
    queueStorageWrite(PLAYER_DATA_KEY, JSON.stringify(payload), 'spelersdata');
  }, [players, newPlayerName, newPlayerImage]);

  // Hydrate players only
  const hydratePlayers = useCallback(() => {
    if (!storageAvailable) return;
    try {
      const saved = localStorage.getItem(PLAYER_DATA_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<PersistedPlayerState>;
      if (parsed.players) setPlayers(parsed.players);
      if (parsed.newPlayerName !== undefined) setNewPlayerName(parsed.newPlayerName);
      if (parsed.newPlayerImage !== undefined) setNewPlayerImage(parsed.newPlayerImage);
    } catch (error) {
      console.error('Herstellen spelersdata mislukt', error);
      localStorage.removeItem(PLAYER_DATA_KEY);
    }
  }, [storageAvailable, setPlayers, setNewPlayerName, setNewPlayerImage]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-classic', 'theme-metro', 'theme-calm', 'theme-beer');
    root.classList.add(`theme-${settings.theme}`, 'theme-transition');
  }, [settings.theme]);

  // Main hydration effect on component mount
  useEffect(() => {
    hydratePlayers(); // Always hydrate players
    if (storageAvailable) {
      localStorage.removeItem(GAME_STATE_KEY); // Ensure game state never persists between sessions
    }

    // Hide status bar on native devices
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => { });
      StatusBar.hide().catch((e) => console.warn('Could not hide status bar', e));
    }
  }, [hydratePlayers, storageAvailable]);

  useEffect(() => {
    if (!storageAvailable) return;

    try {
      const savedPyramid = localStorage.getItem(PYRAMID_INSTRUCTIONS_COLLAPSED_KEY);
      const savedBus = localStorage.getItem(BUS_INSTRUCTIONS_COLLAPSED_KEY);

      if (savedPyramid !== null) {
        setIsPyramidInstructionsCollapsed(savedPyramid === 'true');
      }

      if (savedBus !== null) {
        setIsBusInstructionsCollapsed(savedBus === 'true');
      }
    } catch (error) {
      console.warn('Kon instructiestatus niet herstellen', error);
    }
  }, [storageAvailable]);

  useEffect(() => {
    if (!storageAvailable) return;
    try {
      queueStorageWrite(
        PYRAMID_INSTRUCTIONS_COLLAPSED_KEY,
        String(isPyramidInstructionsCollapsed),
        'piramide-instructies'
      );
    } catch (error) {
      console.warn('Kon piramide-instructies niet opslaan', error);
    }
  }, [isPyramidInstructionsCollapsed, storageAvailable]);

  useEffect(() => {
    if (!storageAvailable) return;
    try {
      queueStorageWrite(
        BUS_INSTRUCTIONS_COLLAPSED_KEY,
        String(isBusInstructionsCollapsed),
        'bus-instructies'
      );
    } catch (error) {
      console.warn('Kon bus-instructies niet opslaan', error);
    }
  }, [isBusInstructionsCollapsed, storageAvailable]);

  useEffect(() => {
    if (!storageAvailable) return;
    try {
      queueStorageWrite(GAME_SETTINGS_KEY, JSON.stringify(settings), 'instellingen');
    } catch (error) {
      console.warn('Kon instellingen niet opslaan', error);
    }
  }, [settings, storageAvailable]);

  useEffect(() => {
    if (settings.mode === GameMode.DIGITAL) {
      setPyramidMode('digital');
    }
  }, [settings.mode]);



  useEffect(() => {
    if (!storageAvailable) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistPlayers(); // Only persist players on web visibility change
      }
    };

    const handleBeforeUnload = () => persistPlayers(); // Only persist players on web beforeunload

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [persistPlayers]); // Dependency array changes to persistPlayers

  useEffect(() => {
    if (!storageAvailable) return;

    const isNativeApp = Capacitor.getPlatform() !== 'web';
    if (!isNativeApp) return;

    const handleAppPause = () => {
      persistPlayers();
    }

    document.addEventListener('pause', handleAppPause);
    document.addEventListener('resume', handleAppPause); // Resume does not need to save state

    return () => {
      document.removeEventListener('pause', handleAppPause);
      document.removeEventListener('resume', handleAppPause);
    };
  }, [persistPlayers]); // Dependency array changes


  useEffect(() => {
    const unlock = () => ensureAudioContext();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, [ensureAudioContext]);

  useEffect(() => {
    initializeAdMob();
  }, [initializeAdMob]);

  useEffect(() => {
    const manageBars = async () => {
      try {
        if (phase === GamePhase.SETUP || phase === GamePhase.GAME_OVER) {
          await StatusBar.show();
        } else {
          await StatusBar.hide();
        }
      } catch (e) {
        // Ignored in web
      }
    };
    manageBars();
  }, [phase]);

  // --- HELPERS ---

  const triggerShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);
  };

  const triggerFileCapture = (mode: 'camera' | 'gallery' = 'camera') => {
    if (mode === 'camera') {
      const input = fileInputCameraRef.current;
      if (input) input.click();
    } else {
      const input = fileInputRef.current;
      if (input) input.click();
    }
  };

  const tryNativePhoto = async (
    source: 'CAMERA' | 'PHOTOS'
  ): Promise<{ dataUrl: string | null; cancelled: boolean; available: boolean }> => {
    if (!Capacitor.isPluginAvailable('Camera')) {
      return { dataUrl: null, cancelled: false, available: false };
    }

    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source === 'CAMERA' ? CameraSource.Camera : CameraSource.Photos,
        width: 640,
        height: 640,
      });

      return { dataUrl: photo?.dataUrl ?? null, cancelled: false, available: true };
    } catch (error: any) {
      const message = (error?.message ?? '').toLowerCase();
      const cancelled = message.includes('cancel') || message.includes('no image selected');

      if (!cancelled) {
        console.error('Camera capture failed', error);
      }

      return { dataUrl: null, cancelled, available: true };
    }
  };

  const getEffectivePhrases = (category: PhraseCategory): string[] => {
    const langPhrases = customPhrases[lang]?.[category] || [];
    if (langPhrases.length > 0) return langPhrases;
    return DEFAULT_PHRASES[lang][category] || DEFAULT_PHRASES['nl'][category];
  };

  const getUniquePhrase = (poolOrCategory: string[] | PhraseCategory) => {
    const pool = Array.isArray(poolOrCategory) ? poolOrCategory : getEffectivePhrases(poolOrCategory as PhraseCategory);
    let available = pool.filter(p => !usedPhrases.has(p));
    if (available.length === 0) {
      // Reset if all used
      available = pool;
      setUsedPhrases(new Set());
    }
    const phrase = available[Math.floor(Math.random() * available.length)];

    setUsedPhrases(prev => {
      const newSet = new Set(prev);
      if (newSet.size >= pool.length * 2) newSet.clear(); // Safety clear
      newSet.add(phrase);
      return newSet;
    });
    return phrase;
  };

  const drawCard = () => {
    if (deck.length === 0) {
      const newD = shuffleDeck(createDeck());
      const [card, ...remaining] = newD;
      setDeck(remaining);
      return card;
    }
    const [card, ...remaining] = deck;
    setDeck(remaining);
    return card;
  };

  const recalcBusProgressScale = useCallback(() => {
    const container = busProgressContainerRef.current;
    const content = busProgressContentRef.current;
    if (!container || !content) return;

    const availableWidth = container.clientWidth;
    const contentWidth = content.scrollWidth;

    if (!contentWidth) return;

    const nextScale = Math.min(1, availableWidth / contentWidth);
    setBusProgressScale(Math.max(0.65, nextScale));
  }, []);

  const busCardStates = useMemo(() => {
    return busCards.map((card, index) => {
      const isBase = index === 0;
      const isHistory = index < currentBusIndex;
      const isReference = index === currentBusIndex - 1;
      const isTarget = index === currentBusIndex;
      const isFocused = busFocusIndex === index;
      const isWrong = index === busWrongCardIndex;
      const isRevealed = isBase || isHistory || isWrong || isBusWon;

      let containerClass = '';
      if (isBusWon) {
        containerClass = 'opacity-100 scale-100 z-10';
      } else {
        containerClass = 'opacity-50 scale-90 grayscale drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)]';

        if (isReference) {
          containerClass = 'opacity-100 scale-110 z-20';
        } else if (isTarget) {
          containerClass = 'opacity-100 scale-100 z-10';
        } else if (isWrong) {
          containerClass = 'opacity-100 scale-110 z-20';
        }

        if (isFocused) {
          containerClass += ' saturate-150 drop-shadow-[0_0_50px_rgba(248,113,113,0.45)]';
        }
      }

      return {
        card,
        index,
        isBase,
        isHistory,
        isReference,
        isFocused,
        isRevealed,
        containerClass,
        isWrong,
      };
    });
  }, [busCards, currentBusIndex, busWrongCardIndex, isBusWon, busFocusIndex]);

  // --- SCROLL HELPERS ---
  useEffect(() => {
    // Keep refs array in sync with cards
    busCardRefs.current = busCardRefs.current.slice(0, busCards.length);
  }, [busCards.length]);

  useEffect(() => {
    busProgressItemRefs.current = busProgressItemRefs.current.slice(0, settings.busLength);
  }, [settings.busLength]);

  useEffect(() => {
    if (phase !== GamePhase.THE_BUS || busCards.length === 0) return;

    const container = busScrollRef.current;
    if (!container) return;

    if (busWrongCardIndex !== null) {
      const focusIndex = Math.max(0, Math.min(busCards.length - 1, busWrongCardIndex));
      setBusFocusIndex(focusIndex);

      const wrongCardEl = busCardRefs.current[focusIndex];
      wrongCardEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      return;
    }

    const previousIndex = Math.max(0, currentBusIndex - 1);
    const targetIndex = Math.max(0, Math.min(busCards.length - 1, currentBusIndex));
    setBusFocusIndex(targetIndex);

    const previousEl = busCardRefs.current[previousIndex];
    const targetEl = busCardRefs.current[targetIndex];

    if (previousEl && targetEl) {
      const containerRect = container.getBoundingClientRect();
      const previousRect = previousEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      const left = Math.min(previousRect.left, targetRect.left) - containerRect.left + container.scrollLeft;
      const right = Math.max(previousRect.right, targetRect.right) - containerRect.left + container.scrollLeft;

      const desiredCenter = (left + right) / 2;
      const newScrollLeft = desiredCenter - containerRect.width / 2;

      container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  }, [currentBusIndex, phase, busCards.length, busWrongCardIndex]);

  useEffect(() => {
    if (phase !== GamePhase.THE_BUS || settings.mode !== GameMode.PHYSICAL || busMode !== 'physical') return;

    recalcBusProgressScale();
    const handleResize = () => recalcBusProgressScale();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [busMode, phase, recalcBusProgressScale, settings.busLength, settings.mode]);

  useEffect(() => {
    if (phase !== GamePhase.THE_BUS || settings.mode !== GameMode.PHYSICAL || busMode !== 'physical') return;

    const targetIndex = Math.min(settings.busLength - 1, Math.max(0, physicalBusPosition - 1));
    const targetEl = busProgressItemRefs.current[targetIndex];

    targetEl?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [busMode, phase, physicalBusPosition, settings.busLength, settings.mode]);

  useEffect(() => {
    if (isBusWon) {
      setBusWinBurst(true);
      prepareAdInterstitial(ADMOB_INTERSTITIAL_LEADERBOARD_UNIT_ID); // Pre-cook ad as soon as bus is won
      const t = setTimeout(() => setBusWinBurst(false), 1800);
      return () => clearTimeout(t);
    }
  }, [isBusWon, prepareAdInterstitial]);



  // --- PHASE HANDLERS ---

  const handleTakePhoto = async () => {
    setIsPhotoOptionsModalOpen(false); // Close modal
    const { dataUrl, cancelled, available } = await tryNativePhoto('CAMERA');

    if (dataUrl) {
      try {
        const squared = await cropToSquareDataUrl(dataUrl);
        setNewPlayerImage(squared);
      } catch {
        setNewPlayerImage(dataUrl);
      }
      triggerHaptic('light');
      return;
    }

    if (cancelled) return;

    setFeedback({
      text: available
        ? 'Er is een fout opgetreden bij de fotoselectie. Probeer opnieuw of kies lokaal bestand.'
        : 'Camera niet beschikbaar. Kies lokaal bestand.',
      type: available ? 'error' : 'info'
    });

    triggerFileCapture('camera');
  };

  const handleSelectFromGallery = async () => {
    setIsPhotoOptionsModalOpen(false); // Close modal
    const { dataUrl, cancelled, available } = await tryNativePhoto('PHOTOS');

    if (dataUrl) {
      try {
        const squared = await cropToSquareDataUrl(dataUrl);
        setNewPlayerImage(squared);
      } catch {
        setNewPlayerImage(dataUrl);
      }
      triggerHaptic('light');
      return;
    }

    if (cancelled) return;

    setFeedback({
      text: available
        ? 'Er is een fout opgetreden bij de fotoselectie. Probeer opnieuw of kies lokaal bestand.'
        : 'Galerij niet beschikbaar. Kies lokaal bestand.',
      type: available ? 'error' : 'info'
    });

    triggerFileCapture('gallery');
  };


  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedback({ text: t('Kies een afbeelding om te gebruiken als profielfoto.'), type: 'error' });
      return;
    }

    try {
      const resized = await resizeImage(file);
      setNewPlayerImage(resized);
      triggerHaptic('light');
      setTimeout(() => inputRef.current?.focus(), 10);
    } catch (error) {
      console.error('Afbeelding verwerken mislukt', error);
      setFeedback({ text: t('Kon de foto niet laden. Controleer de rechten of probeer een kleinere afbeelding.'), type: 'error' });
    }
  };

  const addPlayer = () => {
    if (newPlayerName.trim() && players.length < 12) {
      triggerHaptic('success');
      playSound('playerAdd');
      setPlayers([...players, {
        id: Date.now().toString(),
        name: newPlayerName.trim(),
        hand: [],
        drinksTaken: 0,
        drinksDistributed: 0,
        adtjes: 0,
        isDealer: false,
        isImmune: false,
        image: newPlayerImage || undefined
      }]);
      setNewPlayerName('');
      setNewPlayerImage(null);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  const removePlayer = (id: string) => {
    triggerHaptic('light');
    playSound('playerRemove');
    setPlayers(players.filter(p => p.id !== id));
  };

  // --- DRAG-AND-DROP PLAYER REORDER ---
  const [dragPlayerIndex, setDragPlayerIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);
  const dragStartYRef = useRef<number>(0);
  const dragItemHeightRef = useRef<number>(0);
  const playerListRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent, index: number) => {
    e.stopPropagation();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragPlayerIndex(index);
    setDragOverIndex(index);
    dragStartYRef.current = clientY;
    const target = (e.currentTarget as HTMLElement).closest('[data-player-item]') as HTMLElement;
    if (target) {
      dragNodeRef.current = target as HTMLDivElement;
      dragItemHeightRef.current = target.getBoundingClientRect().height + 8; // height + gap
    }
    triggerHaptic('light');
  };

  const handleDragMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (dragPlayerIndex === null) return;
    e.preventDefault();
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const diff = clientY - dragStartYRef.current;
    const indexOffset = Math.round(diff / dragItemHeightRef.current);
    const newIndex = Math.max(0, Math.min(players.length - 1, dragPlayerIndex + indexOffset));
    setDragOverIndex(newIndex);
  }, [dragPlayerIndex, players.length]);

  const handleDragEnd = useCallback(() => {
    if (dragPlayerIndex !== null && dragOverIndex !== null && dragPlayerIndex !== dragOverIndex) {
      const newPlayers = [...players];
      const [movedPlayer] = newPlayers.splice(dragPlayerIndex, 1);
      newPlayers.splice(dragOverIndex, 0, movedPlayer);
      setPlayers(newPlayers);
      triggerHaptic('medium');
    }
    setDragPlayerIndex(null);
    setDragOverIndex(null);
  }, [dragPlayerIndex, dragOverIndex, players]);

  useEffect(() => {
    if (dragPlayerIndex === null) return;
    const onMove = (e: TouchEvent | MouseEvent) => handleDragMove(e);
    const onEnd = () => handleDragEnd();
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    return () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
    };
  }, [dragPlayerIndex, handleDragMove, handleDragEnd]);

  const handleGameOverContinue = async () => {
    await showInterstitialAd('LEADERBOARD');
    setPhase(GamePhase.SETUP);
  };

  const handleStartPress = () => {
    if (players.length < 2) return;
    triggerHaptic('medium');
    confirmStart(settings.physicalMode ? GameMode.PHYSICAL : GameMode.DIGITAL);
  };

  const handleQuitGame = async () => {
    setShowQuitConfirm(false);
    await showInterstitialAd('QUIT');
    setPhase(GamePhase.SETUP);
    setFeedback(null);
    setLastDrawnCard(null);
    setShowConfetti(false);
    playSound('stopDisco');
    setIsDiscoActive(false);
  };

  const confirmStart = (mode: GameMode) => {
    triggerHaptic('heavy');
    resetBusState();
    setSettings(prev => ({ ...prev, mode }));
    setPyramidMode(mode === GameMode.PHYSICAL ? 'physical' : 'digital');
    setDeck(shuffleDeck(createDeck()));

    const dealerIndex = players.length - 1; // Dealer is the last player so index 0 goes first
    const updatedPlayers = players.map((p, i) => ({
      ...p,
      hand: [],
      drinksTaken: 0,
      drinksDistributed: 0,
      adtjes: 0,
      isDealer: i === dealerIndex,
      isImmune: p.id === immunePlayerId
    }));

    setPlayers(updatedPlayers);
    setActivePlayerIndex((dealerIndex + 1) % players.length);
    setUsedPhrases(new Set()); // Reset phrases for new game

    setPhase(GamePhase.ROUNDS_1_4);
    setRoundStep(RoundStep.RED_BLACK);
    setFeedback(null);
    setIsWaitingForNextPlayer(true);
  };

  // --- ROUNDS 1-4 LOGIC ---

  const nextPlayerTurn = () => {
    triggerHaptic('light');
    setFeedback(null);
    setLastDrawnCard(null);
    setShowConfetti(false);
    playSound('stopDisco');
    setIsDiscoActive(false); // <--- Add this line

    const dealerIndex = currentDealerIndex;
    if (activePlayerIndex === dealerIndex) {
      if (roundStep === RoundStep.SUIT) {
        initializePyramid();
      } else {
        setRoundStep(prev => prev + 1);
        const next = (dealerIndex + 1) % players.length;
        setActivePlayerIndex(next);
        setIsWaitingForNextPlayer(true);
      }
    } else {
      const next = (activePlayerIndex + 1) % players.length;
      setActivePlayerIndex(next);
      setIsWaitingForNextPlayer(true);
    }
  };

  const handlePhysicalGuess = (correct: boolean) => {
    const sips = roundStep;
    const newPlayers = [...players];
    const currentPlayer = newPlayers[activePlayerIndex];

    const placeholderCard: Card = { suit: Suit.SPADES, rank: Rank.ACE, id: `physical-${Date.now()}` };
    currentPlayer.hand.push(placeholderCard);

    if (correct) {
      triggerHaptic('success');
      playSound('success');
      const phrase = getUniquePhrase('success');
      setFeedback({ text: `${t(phrase)} ${t("Goed geraden!")}`, type: 'success' });
      setShowConfetti(true);
      playSound('celebrate');
    } else {
      triggerHaptic('error');
      triggerShake();
      playSound('fail');
      const phrase = getUniquePhrase('failure');
      setFeedback({ text: `${t(phrase)} ${t("drink zelf")} ${getSipsText(sips)}.`, type: 'error' });
      currentPlayer.drinksTaken += sips;
    }
    setPlayers(newPlayers);
  };

  const handleDigitalGuess = (guess: string) => {
    const card = drawCard();
    if (!card) return;
    playSound('draw');
    setLastDrawnCard(card);

    const player = activePlayer;
    let correct = false;
    const sips = roundStep;

    if (roundStep === RoundStep.RED_BLACK) {
      const isRed = card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS;
      correct = (guess === 'RED' && isRed) || (guess === 'BLACK' && !isRed);
    }
    else if (roundStep === RoundStep.HIGH_LOW) {
      const baseCard = player.hand[0];
      correct = (guess === 'HIGHER' && card.rank > baseCard.rank) ||
        (guess === 'LOWER' && card.rank < baseCard.rank) ||
        (guess === 'EQUAL' && card.rank === baseCard.rank);
    }
    else if (roundStep === RoundStep.IN_OUT) {
      const c1 = player.hand[0].rank;
      const c2 = player.hand[1].rank;
      const low = Math.min(c1, c2);
      const high = Math.max(c1, c2);
      if (guess === 'BETWEEN') correct = card.rank > low && card.rank < high;
      else correct = card.rank < low || card.rank > high || card.rank === low || card.rank === high;
    }
    else if (roundStep === RoundStep.SUIT) {
      const hasSuit = player.hand.some(h => h.suit === card.suit);
      correct = (guess === 'MATCH' && hasSuit) || (guess === 'NO_MATCH' && !hasSuit);
    }

    const newPlayers = [...players];
    const currentPlayer = newPlayers[activePlayerIndex];

    if (correct) {
      triggerHaptic('success');
      playSound('success');
      const phrase = getUniquePhrase('success');
      setFeedback({ text: `${t(phrase)} ${t("Goed geraden!")}`, type: 'success' });
      setShowConfetti(true);
      playSound('celebrate');
    } else {
      triggerHaptic('error');
      triggerShake();
      playSound('fail');
      const phrase = getUniquePhrase('failure');
      setFeedback({ text: `${t(phrase)} ${t("Drink zelf")} ${getSipsText(sips)}.`, type: 'error' });
      currentPlayer.drinksTaken += sips;
    }

    currentPlayer.hand.push(card);
    setPlayers(newPlayers);
  };

  const handleDiscoAttempt = () => {
    const player = activePlayer;
    const uniqueSuits = new Set(player.hand.map(h => h.suit));
    if (uniqueSuits.size !== 3) return;

    const missingSuit = ALL_SUITS.find(s => !uniqueSuits.has(s));
    const card = drawCard();
    if (!card) return;

    playSound('draw');
    setLastDrawnCard(card);

    const newPlayers = [...players];
    const currentPlayer = newPlayers[activePlayerIndex];

    if (missingSuit && card.suit === missingSuit) {
      triggerHaptic('success');
      playSound('disco');
      setShowConfetti(true);
      setIsDiscoActive(true);
      setFeedback({ text: `${t("DISCO! Iedereen behalve")} ${currentPlayer.name} ${t("drinkt 1 slok.")}`, type: 'success' });

      newPlayers.forEach((p, idx) => {
        if (idx !== activePlayerIndex) p.drinksTaken += 1;
      });
      currentPlayer.drinksDistributed += Math.max(0, newPlayers.length - 1);
    } else {
      triggerHaptic('error');
      triggerShake();
      playSound('fail');
      const sips = roundStep;
      const phrase = getUniquePhrase('failure');
      setFeedback({ text: `${t(phrase)} ${t("Jammer! Drink zelf")} ${getSipsText(sips)}.`, type: 'error' });
      currentPlayer.drinksTaken += sips;
    }

    currentPlayer.hand.push(card);
    setPlayers(newPlayers);
  };

  // --- PYRAMID LOGIC ---

  const generateDigitalPyramid = () => {
    let currentDeck = deck;
    const required = (settings.pyramidRows * (settings.pyramidRows + 1)) / 2;
    if (currentDeck.length < required) currentDeck = shuffleDeck(createDeck());

    const newPyramid: Card[][] = [];
    for (let i = 1; i <= settings.pyramidRows; i++) {
      const rowCards: Card[] = [];
      for (let j = 0; j < i; j++) {
        rowCards.push(currentDeck.pop()!);
      }
      newPyramid.push(rowCards);
    }
    setDeck(currentDeck);
    setPyramid(newPyramid);
  };

  const initializePyramid = () => {
    triggerHaptic('medium');
    setPhase(GamePhase.PYRAMID);
    setFeedback(null);
    setRevealedPyramidCards(new Set());
    setLoserReveal(null);
    setIsPyramidComplete(false);
    
    // Reset double setup state
    setDoubledPyramidCardIds(new Set());
    if (settings.doublePyramidCards) {
      setIsPyramidDoubleSetup(true);
      setPyramidDoubleSetupRow(settings.pyramidRows - 1);
    } else {
      setIsPyramidDoubleSetup(false);
    }

    if (settings.mode === GameMode.DIGITAL) {
      generateDigitalPyramid();
    }
    if (settings.mode === GameMode.PHYSICAL) {
      const newPyramid: Card[][] = [];
      for (let i = 1; i <= settings.pyramidRows; i++) {
        const rowCards = Array(i).fill(null).map((_, idx) => ({
          suit: Suit.SPADES, rank: Rank.ACE, id: `phys-${i}-${idx}`
        }));
        newPyramid.push(rowCards);
      }
      setPyramid(newPyramid);
    }
  };

  const handleDoubleCardSelection = (rowIndex: number, cardIndex: number) => {
    const row = pyramid[rowIndex];
    if (!row) return;
    const card = row[cardIndex];
    if (!card) return;

    triggerHaptic('light');
    const newDoubled = new Set(doubledPyramidCardIds);
    newDoubled.add(card.id);
    setDoubledPyramidCardIds(newDoubled);

    if (pyramidDoubleSetupRow > 1) {
      setPyramidDoubleSetupRow(pyramidDoubleSetupRow - 1);
    } else {
      setIsPyramidDoubleSetup(false);
    }
  };

  const triggerPyramidWarning = () => {
    if (warningCooldown) return;

    triggerHaptic('warning');
    setFeedback({ text: t("Deze kaart kan nog niet!"), type: 'warning' });
    setPulseValidCards(true);
    setWarningCooldown(true);

    setTimeout(() => {
      setFeedback(null);
      setPulseValidCards(false);
    }, 1500);

    setTimeout(() => {
      setWarningCooldown(false);
    }, 2000);
  };

  const pyramidContainerRef = useRef<HTMLDivElement>(null);
  const pyramidContentRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pyramidScale, setPyramidScale] = useState(1);

  const calculatePyramidScale = useCallback(() => {
    const container = pyramidContainerRef.current;
    const content = pyramidContentRef.current;

    if (container && content) {
      const containerWidth = container.clientWidth - 40; // Subtract padding for a buffer
      const containerHeight = container.clientHeight - 40; // Subtract padding for a buffer
      const contentWidth = content.scrollWidth;
      const contentHeight = content.scrollHeight;

      // If content dimensions are 0 (e.g., not yet rendered), use a default scale
      if (contentWidth === 0 || contentHeight === 0) {
        setPyramidScale(1); // Or a sensible default
        return;
      }

      const widthScale = containerWidth / contentWidth;
      const heightScale = containerHeight / contentHeight;
      let fitScale = Math.min(widthScale, heightScale);

      // Ensure a reasonable minimum scale, but allow smaller if necessary to fit
      const minAbsoluteScale = 0.3; // Prevent cards from becoming tiny, adjust as needed

      // Prioritize fitting, but don't go below minAbsoluteScale unless absolutely necessary
      if (fitScale < minAbsoluteScale) {
        // If content is too large, allow it to shrink more to fit
        setPyramidScale(fitScale);
      } else {
        // Otherwise, use a comfortable scale, but don't exceed 1 (original size)
        setPyramidScale(Math.min(1, fitScale));
      }
      return;
    }

    setPyramidScale(1); // Default scale if refs are not available
  }, []);

  useEffect(() => {
    calculatePyramidScale();
  }, [calculatePyramidScale, pyramid, revealedPyramidCards]);

  useEffect(() => {
    const handleResize = () => calculatePyramidScale();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [calculatePyramidScale]);

  const revealPyramidCard = (rowIndex: number, cardIndex: number) => {
    const card = pyramid[rowIndex][cardIndex];
    if (!card || revealedPyramidCards.has(card.id)) return;

    // Find the highest rowIndex (bottom-most row) that still has an unrevealed card
    let lowestAvailableRowIndex = -1;
    for (let i = pyramid.length - 1; i >= 0; i--) {
      if (pyramid[i].some(c => c && !revealedPyramidCards.has(c.id))) {
        lowestAvailableRowIndex = i;
        break;
      }
    }

    if (rowIndex !== lowestAvailableRowIndex) {
      triggerPyramidWarning();
      return;
    }

    triggerHaptic('medium');
    const newRevealed = new Set(revealedPyramidCards);
    newRevealed.add(card.id);
    setRevealedPyramidCards(newRevealed);

    const sips = settings.pyramidRows - rowIndex;
    const isTop = rowIndex === 0;

    const totalCards = (settings.pyramidRows * (settings.pyramidRows + 1)) / 2;
    const isFinished = newRevealed.size === totalCards;

    if (settings.mode === GameMode.PHYSICAL && pyramidMode === 'physical') {
      setFeedback({
        text: isTop ? t("ADTJE VOOR DE ZAAL!") : `${t("Wie heeft deze kaart?")} ${getSipsText(sips)}!`,
        type: 'info'
      });
      if (isFinished) setIsPyramidComplete(true);
      return;
    }

    if (settings.mode === GameMode.PHYSICAL && pyramidMode === 'digital') {
      setFeedback({ text: `${t("Deze kaart is")} ${getSipsText(sips)} ${t("waard.")}`, type: 'info' });
      if (isFinished) setIsPyramidComplete(true);
      return;
    }

    const matches: { player: Player, cardIndex: number }[] = [];
    players.forEach(p => {
      const matchIndex = p.hand.findIndex(h => h.rank === card.rank);
      if (matchIndex !== -1) {
        matches.push({ player: p, cardIndex: matchIndex });
      }
    });

    if (matches.length > 0) {
      triggerHaptic('success');
      playSound('success');
      const isDoubled = card && doubledPyramidCardIds.has(card.id);
      setPendingMatches({
        card: card,
        sips: (isTop ? 5 : sips) * (isDoubled ? 2 : 1),
        matches: matches
      });
    } else {
      if (isFinished) {
        setIsPyramidComplete(true);
      }
    }
  };

  const resolveMatch = (playerId: string) => {
    if (!pendingMatches) return;
    triggerHaptic('light');
    const newPlayers = [...players];
    const pIndex = newPlayers.findIndex(p => p.id === playerId);
    if (pIndex === -1) return;

    const player = newPlayers[pIndex];
    const handIndex = player.hand.findIndex(c => c.rank === pendingMatches.card.rank);

    if (handIndex !== -1) {
      player.hand.splice(handIndex, 1);
      player.drinksDistributed += pendingMatches.sips;
    }

    setPlayers(newPlayers);
    const remainingMatches = pendingMatches.matches.filter(m => m.player.id !== playerId);

    if (remainingMatches.length === 0) {
      setPendingMatches(null);
      const totalCards = (settings.pyramidRows * (settings.pyramidRows + 1)) / 2;
      if (revealedPyramidCards.size === totalCards) {
        setIsPyramidComplete(true);
      }
    } else {
      setPendingMatches({ ...pendingMatches, matches: remainingMatches });
    }
  };

  const dismissMatchModal = () => {
    setPendingMatches(null);
    const totalCards = (settings.pyramidRows * (settings.pyramidRows + 1)) / 2;
    if (revealedPyramidCards.size === totalCards) {
      setIsPyramidComplete(true);
    }
  };

  const findLoser = () => {
    const eligiblePlayers = players.filter(p => !p.isImmune);
    const candidates = eligiblePlayers.length > 0 ? eligiblePlayers : players;

    // Check if any candidate still has cards in hand (relevant for both digital and physical mode if tracked)
    const playersWithCards = candidates.filter(p => p.hand.length > 0);

    if (playersWithCards.length > 0) {
      // Prioritize cards: most cards, then highest total rank value
      const stats = playersWithCards.map(p => {
        let totalValue = 0;
        p.hand.forEach(c => { totalValue += c.rank; });
        return { id: p.id, count: p.hand.length, val: totalValue };
      });

      stats.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.val - a.val;
      });

      const victimId = stats[0].id;
      return players.find(p => p.id === victimId)!;
    }

    // Fallback: most drinks taken (original physical mode logic)
    const playerStats = candidates.map(p => ({
      id: p.id,
      count: p.drinksTaken,
      val: p.drinksDistributed
    }));

    playerStats.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.val - a.val;
    });

    const victimId = playerStats[0].id;
    return players.find(p => p.id === victimId)!;
  };

  const goToBusSelection = () => {
    resetBusState();
    const victim = findLoser();
    const driver = players.find(p => p.isDealer) || players[0];
    const title = getUniquePhrase('loser');

    setBusDriver(driver);
    setBusPassengers([victim]);
    setLoserReveal({ player: victim, title: title });

    if (settings.sharedBus) setPhase(GamePhase.BUS_TEAM_SELECTION);
    else startBus([victim]);
  };

  const determineLoserAndAnimate = () => {
    resetBusState();
    if (settings.mode === GameMode.PHYSICAL && pyramidMode === 'physical') {
      goToBusSelection();
      return;
    }
    triggerHaptic('majorLoss');
    const victim = findLoser();
    const driver = players.find(p => p.isDealer) || players[0];
    const title = getUniquePhrase('loser');

    setBusDriver(driver);
    setBusPassengers([victim]);
    setLoserReveal({ player: victim, title: title });

    setTimeout(() => {
      if (settings.sharedBus) {
        setBusMode(settings.mode === GameMode.PHYSICAL ? 'physical' : 'digital');
        setPhase(GamePhase.BUS_TEAM_SELECTION);
      }
      else startBus([victim]);
    }, 2500);
  };

  const proceedToBus = () => {
    if (settings.mode === GameMode.PHYSICAL) {
      setIsSelectingBusPlayer(true);
      return;
    }
    determineLoserAndAnimate();
  };

  const handleManualBusPassengerSelect = (passenger: Player) => {
    triggerHaptic('medium');
    const driver = players.find(p => p.isDealer) || players[0];
    setBusDriver(driver);
    resetBusState();
    setLoserReveal({ player: passenger, title: getUniquePhrase('loser') });
    setBusPassengers([passenger]);
    setBusMode('physical');
    setIsSelectingBusPlayer(false);

    setTimeout(() => {
      if (settings.sharedBus) {
        setPhase(GamePhase.BUS_TEAM_SELECTION);
      } else {
        startBus([passenger]);
      }
    }, 2500);
  };

  const handleSharedBusSelection = (partner: Player | null) => {
    triggerHaptic('medium');
    const currentPassengers = busPassengers.length ? busPassengers : [];
    const updatedPassengers = partner ? [...currentPassengers, partner] : currentPassengers;
    setBusPassengers(updatedPassengers);
    startBus(updatedPassengers, { showEntrance: !!partner });
  };

  // --- BUS LOGIC ---

  const startDigitalBus = (passengers: Player[], options?: { skipEntrance?: boolean; showEntrance?: boolean }) => {
    const selectedPassengers = passengers.length ? passengers : busPassengers;
    if (!options?.skipEntrance) {
      const driver = players.find(p => p.isDealer) || players[0];
      setBusDriver(driver);
      resetBusState();
      setBusPassengers(selectedPassengers);
    }
    const shouldShowEntrance = settings.sharedBus && options?.showEntrance && !options?.skipEntrance;

    if (shouldShowEntrance) {
      setIsBusEntrance(true);
      setPhase(GamePhase.THE_BUS);
      setTimeout(() => startDigitalBus(selectedPassengers, { skipEntrance: true }), 3000);
      return;
    }

    setIsBusEntrance(false);
    setBusMode('digital');
    setBusDecksUsed(1); // Reset bus decks used at the start of bus phase
    setIsBusDeckExhausted(false);
    setBusFocusIndex(null);
    setIsBusWon(false);
    playSound('busEnter');

    const needed = settings.busLength;
    
    // Only subtract rotated/played cards from bus pakje
    // We do this by taking the remaining deck and adding back unrevealed pyramid cards and unplayed player cards.
    const unrevealedPyramidCards = pyramid
      .flat()
      .filter((c): c is Card => c !== null && !revealedPyramidCards.has(c.id));
    const unplayedPlayerCards = players.flatMap(p => p.hand.filter(c => !c.isPlayed));
    
    const combinedDeck = [...deck, ...unrevealedPyramidCards, ...unplayedPlayerCards];
    
    // If somehow we don't have enough cards to even start the bus, add a fresh deck
    const freshBusDeck = shuffleDeck(combinedDeck.length >= needed ? combinedDeck : [...combinedDeck, ...createDeck()]);
    
    const newBusCards = freshBusDeck.slice(0, needed);
    setBusDeck(freshBusDeck.slice(needed));
    setBusCards(newBusCards);
    setCurrentBusIndex(1);
    setBusWrongCardIndex(null);
    setPhase(GamePhase.THE_BUS);
    setFeedback(null);
  };

  const startPhysicalBus = (passengersOverride?: Player[], options?: { skipEntrance?: boolean; showEntrance?: boolean }) => {
    const passengers = passengersOverride ?? busPassengers;
    if (passengers.length === 0) {
      setFeedback({ text: t('Selecteer eerst wie de bus in gaat.'), type: 'error' });
      setPhase(GamePhase.PYRAMID);
      return;
    }

    if (!options?.skipEntrance) {
      const driver = players.find(p => p.isDealer) || players[0];
      setBusDriver(driver);
      resetBusState();
      setBusPassengers(passengers);
      setBusMode('physical');
    }

    const shouldShowEntrance = settings.sharedBus && options?.showEntrance && !options?.skipEntrance;

    if (shouldShowEntrance) {
      setIsBusEntrance(true);
      setPhase(GamePhase.THE_BUS);
      setTimeout(() => startPhysicalBus(passengers, { skipEntrance: true }), 3000);
      return;
    }

    setIsBusEntrance(false);
    triggerHaptic('medium');
    playSound('busEnter');
    setIsBusWon(false);
    setBusWrongCardIndex(null);
    setBusFocusIndex(null);
    setBusCards([]);
    setBusDeck([]);
    setBusDecksUsed(1);
    setIsBusDeckExhausted(false);
    setPhysicalBusPosition(2);
    setCurrentBusIndex(1);
    setFeedback(null);
    setPhase(GamePhase.THE_BUS);
  };

  const startBus = (passengers: Player[], options?: { showEntrance?: boolean }) => {
    if (settings.mode === GameMode.PHYSICAL) {
      startPhysicalBus(passengers, { showEntrance: options?.showEntrance });
      return;
    }

    startDigitalBus(passengers, { showEntrance: options?.showEntrance });
  };

  const restartBus = () => {
    setBusWrongCardIndex(null);
    const configuredBusLength = settings.busLength;

    // Recycle unrevealed cards from the previous failed attempt
    // These are cards that were laid out but never flipped/seen
    const unrevealed = busCards.slice(currentBusIndex + 1);
    const recycledDeck = shuffleDeck([...busDeck, ...unrevealed]);

    let tempAvailableDeck = recycledDeck;
    let infoFeedback: Feedback | null = null;

    let actualBusDecksUsed = busDecksUsed; // Use temp variable for current count

    // If the current deck is exhausted or has less than configuredBusLength cards left
    if (tempAvailableDeck.length < configuredBusLength) { // This condition determines if a new deck is needed
      if (busDecksUsed >= settings.busDecks) {
        setIsBusWon(true);
        playSound('celebrate');
        setImmunePlayerId(busPassengers[0].id);
        setFeedback({ text: t('Geen kaarten meer! Je bent vrij!'), type: 'success' });
        return;
      } else {
        tempAvailableDeck = shuffleDeck(createDeck()); // Shuffle new deck
        actualBusDecksUsed = busDecksUsed + 1; // Increment counter
        setBusDecksUsed(actualBusDecksUsed);
        playSound('reshuffle');
        infoFeedback = { text: `${t("Pakje")} ${actualBusDecksUsed} / ${settings.busDecks}. ${t("Hoger of lager?")}`, type: 'info' };
      }
    }

    // Determine how many cards to draw for this round of the bus
    // This ensures we draw all remaining cards if less than configuredBusLength
    const cardsToDraw = Math.min(configuredBusLength, tempAvailableDeck.length);

    const newBusCards = tempAvailableDeck.slice(0, cardsToDraw);
    setBusDeck(tempAvailableDeck.slice(cardsToDraw));
    setBusCards(newBusCards);
    setCurrentBusIndex(1);
    setFeedback(infoFeedback);
    setIsBusDeckExhausted(false);
  };

  const handleBusGuess = (guess: 'HIGHER' | 'LOWER' | 'EQUAL') => {
    const prevCard = busCards[currentBusIndex - 1];
    const targetCard = busCards[currentBusIndex];
    const isHigher = targetCard.rank > prevCard.rank;
    const isLower = targetCard.rank < prevCard.rank;
    const isEqual = targetCard.rank === prevCard.rank;

    let correct = false;
    if (guess === 'HIGHER' && isHigher) correct = true;
    if (guess === 'LOWER' && isLower) correct = true;
    if (guess === 'EQUAL' && isEqual) correct = true;

    if (correct) {
      triggerHaptic('success');
      playSound('busStep');
      if (currentBusIndex === busCards.length - 1) {
        setIsBusWon(true);
        playSound('celebrate');
        setImmunePlayerId(busPassengers[0].id);
      } else {
        setFeedback(null);
        setCurrentBusIndex(prev => prev + 1);
      }
    } else {
      triggerHaptic('error');
      triggerShake();
      playSound('busFail');
      const sips = currentBusIndex + 1;
      const phrase = getUniquePhrase('failure');
      setFeedback({ text: `${t(phrase)} ${getSipsText(sips)} & ${t("Opnieuw!")}`, type: 'error' });
      setBusWrongCardIndex(currentBusIndex);

      const newPlayers = [...players];
      busPassengers.forEach(bp => {
        const p = newPlayers.find(p => p.id === bp.id);
        if (p) p.drinksTaken += sips;
      });
      setPlayers(newPlayers);
      setTimeout(restartBus, 2500);
    }
  };

  const handlePhysicalBusGuess = (result: 'correct' | 'incorrect') => {
    if (busPassengers.length === 0 || isBusWon) return;

    triggerHaptic('heavy');

    if (result === 'correct') {
      triggerHaptic('success');
      playSound('busStep');

      const nextPosition = Math.min(settings.busLength, physicalBusPosition + 1);
      if (nextPosition >= settings.busLength) {
        setIsBusWon(true);
        playSound('celebrate');
        setImmunePlayerId(busPassengers[0].id);
        setPhysicalBusPosition(settings.busLength);
        setFeedback({ text: t('Je hebt de bus overleefd! Vrijstelling!'), type: 'success' });
        return;
      }

      setPhysicalBusPosition(nextPosition + 1);
      setFeedback({ text: `${t("Goed! Kaart")} ${nextPosition} ${t("klaar.")}`, type: 'info' });
      return;
    }

    triggerHaptic('error');
    triggerShake();
    playSound('busFail');
    const sips = physicalBusPosition;
    const phrase = getUniquePhrase('failure');
    setFeedback({ text: `${t(phrase)} ${getSipsText(sips)} & ${t("opnieuw!")}`, type: 'error' });

    const newPlayers = [...players];
    busPassengers.forEach(bp => {
      const p = newPlayers.find(p => p.id === bp.id);
      if (p) p.drinksTaken += sips;
    });
    setPlayers(newPlayers);
    setPhysicalBusPosition(2);
    setIsBusWon(false);
  };

  // --- RENDERING HELPERS ---

  const renderQuitModal = () => showQuitConfirm && (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl w-full max-w-sm mx-4 space-y-4 animate-in zoom-in-95 duration-300">
        <h3 className="text-xl font-black text-white text-center">{t("Spel stoppen?")}</h3>
        <p className="text-slate-400 text-sm text-center">{t("Weet je zeker dat je het huidige spel wilt stoppen? Alle voortgang gaat verloren.")}</p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowQuitConfirm(false)}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-colors active:scale-95"
          >
            {t("Annuleren")}
          </button>
          <button
            id="confirm-quit-btn"
            onClick={handleQuitGame}
            className="flex-1 py-3 bg-gradient-to-r from-red-700 to-red-900 hover:brightness-110 text-white font-bold rounded-xl border border-red-600/50 transition-all active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
          >
            {t("Stoppen")}
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuitButton = (className = "ml-2 w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-400 hover:bg-slate-800/60 transition-all active:scale-90") => (
    <button
      onClick={() => setShowQuitConfirm(true)}
      className={className}
      aria-label="Quit game"
    >
      <X size={14} />
    </button>
  );

  // --- RENDERING ---

  // Global fixed quit button shown during active gameplay (not on SETUP or GAME_OVER)
  const isInActiveGame = phase !== GamePhase.SETUP && phase !== GamePhase.GAME_OVER;

  // 1. SETUP
  if (phase === GamePhase.SETUP) {
    return (
      <RootContainer className="p-4" showChest={true} theme={settings.theme}>
        <div className="flex-none mb-6 mt-2 animate-in slide-in-from-top-4 duration-700">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 tracking-tighter uppercase drop-shadow-[0_2px_10px_rgba(220,38,38,0.5)] animated-gradient-text">
            {t("Bussen")}
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] ml-1 neon-text"></p>
        </div>

        <div className="flex-1 flex flex-col min-h-0 mb-4 glass-panel rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-red-900/20">
          <div className="flex justify-between items-center p-4 border-b border-slate-700/50 bg-slate-900/60 sticky top-0 z-10">
            <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide"><Users size={16} className="text-red-500" /> {t("Spelers")}</h2>
            <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">{players.length}/12</span>
          </div>

          <div ref={playerListRef} className="flex-1 overflow-y-auto p-3 space-y-2 scroll-smooth">
            {players.map((p, index) => {
              const isDragging = dragPlayerIndex === index;
              const isOver = dragOverIndex === index && dragPlayerIndex !== null && dragPlayerIndex !== index;
              return (
                <div key={p.id} data-player-item className={`relative transition-transform duration-150 ${isDragging ? 'opacity-40 scale-95' : ''}`}>
                  {isOver && dragPlayerIndex !== null && dragPlayerIndex > index && (
                    <div className="absolute -top-1.5 left-2 right-2 h-[3px] bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] z-10" />
                  )}
                  <div className="flex justify-between items-center bg-slate-800/40 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 shadow-lg animate-pop">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border-2 border-slate-600/50 font-bold text-white shadow-md overflow-hidden shrink-0">
                        {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-white text-sm tracking-tight truncate flex-1 min-w-0">{p.name}</span>
                      {p.isImmune && <Shield size={14} className="text-yellow-400 drop-shadow-md shrink-0" />}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <div
                        onTouchStart={(e) => handleDragStart(e, index)}
                        onMouseDown={(e) => handleDragStart(e, index)}
                        className="text-slate-600 hover:text-slate-400 p-2 cursor-grab active:cursor-grabbing transition-colors touch-none select-none"
                      >
                        <GripVertical size={18} />
                      </div>
                      <button onClick={() => removePlayer(p.id)} className="text-slate-500 hover:text-red-500 p-2 transition-all active:scale-90"><X size={18} /></button>
                    </div>
                  </div>
                  {isOver && dragPlayerIndex !== null && dragPlayerIndex < index && (
                    <div className="absolute -bottom-1.5 left-2 right-2 h-[3px] bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] z-10" />
                  )}
                </div>
              );
            })}
            {players.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 opacity-70">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <Users size={24} />
                </div>
                <span className="font-bold text-sm uppercase tracking-widest">{t("Start met toevoegen")}</span>
              </div>
            )}          </div>
        </div>

        {immunePlayerId && players.find(p => p.id === immunePlayerId) && (
          <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-3 flex-none shrink-0 mb-4">
            <Shield size={20} className="text-yellow-400 shrink-0" />
            <p className="text-yellow-200/80 text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-tight">
              <span className="text-white">{players.find(p => p.id === immunePlayerId)?.name}</span> {t("is immuun voor de bus deze ronde")}
            </p>
          </div>
        )}

        <div className="flex-none space-y-3">
          <div className="flex gap-2 h-14">
            <input type="file" ref={fileInputCameraRef} hidden accept="image/*" capture="environment" onChange={handleImageSelect} />
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageSelect} />
            <button
              onClick={() => setIsPhotoOptionsModalOpen(true)} // <--- Modified this onClick handler
              className={`flex-none w-14 h-14 rounded-2xl border border-slate-700 transition-all shadow-lg flex items-center justify-center overflow-hidden active:scale-95 ${newPlayerImage ? 'bg-slate-800 ring-2 ring-green-500' : 'glass-panel hover:bg-slate-800'}`}
            >
              {newPlayerImage ? <img src={newPlayerImage} className="w-full h-full object-cover opacity-80" /> : <CameraIcon size={22} className="text-slate-300" />}
            </button>

            <input
              ref={inputRef}
              type="text"
              placeholder={t("Naam...")}
              className="flex-1 min-w-0 h-full bg-slate-900/80 border border-slate-700 rounded-2xl px-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all text-lg font-bold shadow-inner"
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPlayer()}
              maxLength={12}
            />
            <button onClick={addPlayer} className="flex-none w-14 h-full bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 rounded-2xl text-white border-t border-emerald-400 transition-all shadow-lg active:scale-90 flex items-center justify-center glass-panel">
              <Check size={24} strokeWidth={4} className="text-green-100" />
            </button>
          </div>

          <button
            onClick={handleStartPress}
            disabled={players.length < 2}
            className="w-full bg-gradient-to-r from-red-600 to-red-800 disabled:opacity-50 disabled:grayscale text-white font-black text-xl py-5 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-3 transition-all active:scale-95 hover:brightness-110 border-t border-red-400"
          >
            <Play fill="currentColor" size={24} /> {t("START SPEL")}
          </button>

          <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden transition-all duration-300">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="w-full flex items-center justify-between p-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <Settings size={14} /> {t("Instellingen")}
              </div>
              <div className={`transform transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : 'rotate-0'}`}>
                <ChevronDown size={14} />
              </div>
            </button>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isSettingsOpen ? 'max-h-96' : 'max-h-0'}`}>
              <div className="p-4 space-y-4 bg-black/20 border-t border-slate-800">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">{t("Piramide Hoogte")}</label>
                    <span className="text-red-500 font-bold text-sm">{settings.pyramidRows}</span>
                  </div>
                  <input type="range" min="3" max="7" step="1" value={settings.pyramidRows} onChange={(e) => setSettings({ ...settings, pyramidRows: parseInt(e.target.value) })} className="w-full accent-red-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">{t("Bus Kaarten")}</label>
                    <span className="text-red-500 font-bold text-sm">{settings.busLength}</span>
                  </div>
                  <input type="range" min="3" max="12" step="1" value={settings.busLength} onChange={(e) => setSettings({ ...settings, busLength: parseInt(e.target.value) })} className="w-full accent-red-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">{t("Bus Pakjes")}</label>
                    <span className="text-red-500 font-bold text-sm">{settings.busDecks}</span>
                  </div>
                  <input type="range" min="1" max="5" step="1" value={settings.busDecks} onChange={(e) => setSettings({ ...settings, busDecks: parseInt(e.target.value) })} className="w-full accent-red-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">{t("Gedeelde Bus")}</label>
                  <button onClick={() => { const n = { ...settings, sharedBus: !settings.sharedBus }; setSettings(n); queueStorageWrite(GAME_SETTINGS_KEY, JSON.stringify(n), 'instellingen'); }} className={`w-12 h-6 rounded-full relative transition-all ${settings.sharedBus ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.sharedBus ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">{t("Dubbele kaarten in de piramide")}</label>
                  <button onClick={() => { const n = { ...settings, doublePyramidCards: !settings.doublePyramidCards }; setSettings(n); queueStorageWrite(GAME_SETTINGS_KEY, JSON.stringify(n), 'instellingen'); }} className={`w-12 h-6 rounded-full relative transition-all ${settings.doublePyramidCards ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.doublePyramidCards ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>



                <button
                  onClick={() => setIsMoreSettingsOpen(true)}
                  className="w-full mt-4 py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-inner border border-slate-700 active:scale-95"
                >
                  {t("Meer Instellingen")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Options Modal */}
        {isPhotoOptionsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={(e) => { if (e.target === e.currentTarget) setIsPhotoOptionsModalOpen(false); }}>
            <div className="bg-slate-900/90 rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-sm m-4 space-y-4 animate-in zoom-in-50 duration-300">
              <h3 className="text-xl font-bold text-white text-center mb-4">{t("Profielfoto kiezen")}</h3>
              <button
                onClick={handleTakePhoto}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
              >
                <CameraIcon size={20} /> {t("Maak foto")}
              </button>
              <button
                onClick={handleSelectFromGallery}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
              >
                <ImageIcon size={20} /> {t("Kies uit galerij")}
              </button>
              <button
                onClick={() => setIsPhotoOptionsModalOpen(false)}
                className="w-full bg-slate-700/50 text-white font-bold py-3 rounded-xl hover:bg-slate-600/50 active:scale-95 transition-transform"
              >
                {t("Annuleren")}
              </button>
            </div>
          </div>
        )}

        {isMoreSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in" onClick={(e) => { if (e.target === e.currentTarget) setIsMoreSettingsOpen(false); }}>
            <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-sm m-4 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-800 p-6 shrink-0">
                <h3 className="text-xl font-black text-white uppercase tracking-wider">{t("Meer Instellingen")}</h3>
                <button onClick={() => setIsMoreSettingsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex flex-col gap-3 w-full">
                  <h4 className="text-white font-medium">{t("Taal / Language")}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLanguage('nl')}
                      className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${lang === 'nl' ? 'border-amber-400 bg-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'border-slate-700 bg-slate-800 hover:bg-slate-700'}`}
                    >
                      <span className="text-white text-lg font-bold">🇳🇱 NL</span>
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${lang === 'en' ? 'border-amber-400 bg-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'border-slate-700 bg-slate-800 hover:bg-slate-700'}`}
                    >
                      <span className="text-white text-lg font-bold">🇬🇧 EN</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full pt-2">
                  <h4 className="text-white font-medium">{t("Berichten aanpassen")}</h4>
                  <button
                    onClick={() => { setIsMoreSettingsOpen(false); setIsPhraseEditorOpen(true); }}
                    className="w-full py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-inner border border-slate-700 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Pencil size={16} /> {t("Berichten bewerken")}
                  </button>
                </div>

                <div className="flex flex-col gap-3 w-full pt-2">
                  <h4 className="text-white font-medium">{t("Thema")}</h4>
                  <div className="flex bg-slate-800/70 p-1 rounded-2xl gap-1 border border-slate-700/50">
                    {[UITheme.CLASSIC, UITheme.METRO, UITheme.CALM, UITheme.BEER].map(tName => {
                      const isActive = settings.theme === tName;
                      let btnStyle = "";
                      if (isActive) {
                        if (tName === UITheme.CLASSIC) btnStyle = "bg-rose-500 text-white font-bold rounded-xl shadow-md border border-rose-400/20 shadow-rose-500/25";
                        else if (tName === UITheme.METRO) btnStyle = "bg-[var(--theme-accent)] text-white font-black font-mono border-2 border-black rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)]";
                        else if (tName === UITheme.CALM) btnStyle = "bg-[#e5a93b] text-slate-950 font-bold rounded-3xl border border-[#f5b94b]/30 shadow-[0_0_15px_rgba(229,169,59,0.35)]";
                        else if (tName === UITheme.BEER) btnStyle = "bg-gradient-to-b from-[#ffffff] via-[#ffde6a] to-[#f59e0b] text-[#02200c] font-black rounded-xl border-2 border-[#ffcc00] shadow-[inset_0_0_6px_rgba(255,204,0,0.5),_0_4px_12px_rgba(245,158,11,0.4)]";
                      } else {
                        if (tName === UITheme.CLASSIC) btnStyle = "bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:bg-slate-800/80 hover:text-slate-200 rounded-xl";
                        else if (tName === UITheme.METRO) btnStyle = "bg-zinc-900 text-zinc-400 font-mono border border-zinc-700/80 rounded-none hover:bg-zinc-800 hover:text-zinc-200";
                        else if (tName === UITheme.CALM) btnStyle = "bg-slate-900/40 text-[#e5a93b]/70 border border-[#e5a93b]/30 rounded-3xl hover:bg-slate-900 hover:text-[#e5a93b]";
                        else if (tName === UITheme.BEER) btnStyle = "bg-[#02200c]/80 text-[#9edc9e] border border-emerald-800/60 rounded-xl hover:bg-emerald-950 hover:text-[#ffffff]";
                      }
                      return (
                        <button 
                          key={tName}
                          onClick={() => {
                            const n = { ...settings, theme: tName };
                            setSettings(n);
                            queueStorageWrite(GAME_SETTINGS_KEY, JSON.stringify(n), 'instellingen');
                            triggerHaptic('light');
                          }}
                          className={`flex-1 py-1.5 text-xs capitalize transition-all ${btnStyle}`}
                        >
                          {t(tName)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full pt-2">
                  <h4 className="text-white font-medium mb-1">{t("Kaartstijl")}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[CardStyle.MODERN, CardStyle.DARK, CardStyle.CLASSIC, CardStyle.NEON].map((style) => (
                      <button
                        key={style}
                        onPointerDown={() => {
                          if (settings.cardStyle === style) return;
                          longPressTimerRef.current = setTimeout(() => {
                            const n = { ...settings, cardStyle: style };
                            setSettings(n);
                            queueStorageWrite(GAME_SETTINGS_KEY, JSON.stringify(n), 'instellingen');
                            triggerHaptic('heavy');
                            longPressTimerRef.current = null;
                          }, 3000);
                        }}
                        onPointerUp={() => {
                          if (longPressTimerRef.current) {
                            clearTimeout(longPressTimerRef.current);
                            longPressTimerRef.current = null;
                          }
                        }}
                        onPointerLeave={() => {
                          if (longPressTimerRef.current) {
                            clearTimeout(longPressTimerRef.current);
                            longPressTimerRef.current = null;
                          }
                        }}
                        onClick={async () => {
                          if (settings.cardStyle === style) return;
                          setStyleToUnlock(style);
                          triggerHaptic('light');
                        }}
                        className={`py-4 rounded-2xl border relative flex flex-col items-center justify-center gap-3 transition-all ${settings.cardStyle === style ? 'border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-red-500/50' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 hover:border-slate-600'}`}
                      >
                        {/* Preview eye button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDeckStyle(style);
                            triggerHaptic('light');
                          }}
                          className="absolute top-2 left-2 bg-slate-800/80 rounded-full p-1 border border-slate-600 shadow-lg flex items-center justify-center active:scale-95 transition-transform z-20"
                        >
                          <Eye size={12} className="text-white" />
                        </button>

                        {settings.cardStyle !== style && (
                          <div className="absolute top-2 right-2 bg-slate-800/80 rounded-full p-1 border border-slate-600 shadow-lg flex items-center gap-1">
                            <Video size={12} className="text-amber-400" />
                          </div>
                        )}
                        <div className="scale-[0.55] h-16 flex items-center justify-center">
                          <PlayingCard card={PREVIEW_CARD} size="base" style={style} className="shadow-2xl" />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-widest ${settings.cardStyle === style ? 'text-white' : 'text-slate-400'}`}>
                          {t(style === CardStyle.MODERN ? "Modern" :
                            style === CardStyle.DARK ? "Donker" :
                            style === CardStyle.CLASSIC ? "Klassiek" : "Neon")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4 w-full pt-4 border-t border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-white font-medium">{t("Fysieke Modus")}</h4>
                      <button
                        onClick={() => setShowPhysicalModeInfo(true)}
                        className="w-5 h-5 rounded-full border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 flex items-center justify-center transition-colors text-[12px] font-black leading-none"
                      >
                        i
                      </button>
                    </div>
                    <button onClick={() => { const n = { ...settings, physicalMode: !settings.physicalMode }; setSettings(n); queueStorageWrite(GAME_SETTINGS_KEY, JSON.stringify(n), 'instellingen'); }} className={`w-14 h-7 rounded-full relative transition-all ${settings.physicalMode ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-slate-700 hover:bg-slate-600'}`}>
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${settings.physicalMode ? 'left-8' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-800 shrink-0">
                <button
                  onClick={() => setIsMoreSettingsOpen(false)}
                  className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-transform uppercase tracking-widest"
                >
                  {t("Sluiten")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phrase Editor Modal */}
        {isPhraseEditorOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in" onClick={(e) => { if (e.target === e.currentTarget) setIsPhraseEditorOpen(false); }}>
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full h-[90vh] max-w-lg m-2 flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Pencil size={20} className="text-red-500" />
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">{t("Berichten")} ({lang.toUpperCase()})</h3>
                </div>
                <button onClick={() => { setIsPhraseEditorOpen(false); setIsMoreSettingsOpen(true); }} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-2 p-3 bg-slate-900 overflow-x-auto snap-x hide-scrollbar border-b border-slate-800">
                {(['success', 'failure', 'loser'] as PhraseCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setEditorCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold snap-center whitespace-nowrap transition-all ${editorCategory === cat ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    {t(cat === 'success' ? "Goed" : cat === 'failure' ? "Fout" : "Bus Loser")}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-900/50">
                {(() => {
                  const effectivePhrases = getEffectivePhrases(editorCategory);
                  return effectivePhrases.map((phrase, idx) => (
                    <div key={`${editorCategory}-${idx}`} className="flex justify-between items-center bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 group">
                      <span className="text-slate-200 font-medium break-words flex-1 pr-2">{phrase}</span>
                      <button
                        onClick={() => {
                          const newPhrases = { ...customPhrases };
                          if (!newPhrases[lang]) newPhrases[lang] = { success: [], failure: [], loser: [] };
                          if (newPhrases[lang][editorCategory].length === 0) {
                            newPhrases[lang][editorCategory] = [...DEFAULT_PHRASES[lang][editorCategory]];
                          }
                          newPhrases[lang][editorCategory] = newPhrases[lang][editorCategory].filter((_, i) => i !== idx);
                          setCustomPhrases(newPhrases);
                          localStorage.setItem(CUSTOM_PHRASES_KEY, JSON.stringify(newPhrases));
                          triggerHaptic('light');
                        }}
                        className="text-slate-500 hover:text-red-500 p-2 transition-colors active:scale-95"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ));
                })()}
              </div>

              <div className="p-4 bg-slate-800/80 border-t border-slate-700 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t("Nieuw bericht...")}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                    value={editingPhraseText}
                    onChange={e => setEditingPhraseText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && editingPhraseText.trim()) {
                        const newPhrases = { ...customPhrases };
                        if (!newPhrases[lang]) newPhrases[lang] = { success: [], failure: [], loser: [] };
                        if (newPhrases[lang][editorCategory].length === 0) {
                          newPhrases[lang][editorCategory] = [...DEFAULT_PHRASES[lang][editorCategory]];
                        }
                        newPhrases[lang][editorCategory].push(editingPhraseText.trim());
                        setCustomPhrases(newPhrases);
                        localStorage.setItem(CUSTOM_PHRASES_KEY, JSON.stringify(newPhrases));
                        setEditingPhraseText('');
                        triggerHaptic('success');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (editingPhraseText.trim()) {
                        const newPhrases = { ...customPhrases };
                        if (!newPhrases[lang]) newPhrases[lang] = { success: [], failure: [], loser: [] };
                        if (newPhrases[lang][editorCategory].length === 0) {
                          newPhrases[lang][editorCategory] = [...DEFAULT_PHRASES[lang][editorCategory]];
                        }
                        newPhrases[lang][editorCategory].push(editingPhraseText.trim());
                        setCustomPhrases(newPhrases);
                        localStorage.setItem(CUSTOM_PHRASES_KEY, JSON.stringify(newPhrases));
                        setEditingPhraseText('');
                        triggerHaptic('success');
                      }
                    }}
                    className="bg-red-600 text-white rounded-xl px-4 flex items-center justify-center hover:bg-red-500 transition-colors active:scale-95 shadow-lg"
                  >
                    <Plus size={24} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    const newPhrases = { ...customPhrases };
                    if (newPhrases[lang]) {
                      newPhrases[lang][editorCategory] = [];
                      setCustomPhrases(newPhrases);
                      localStorage.setItem(CUSTOM_PHRASES_KEY, JSON.stringify(newPhrases));
                      triggerHaptic('medium');
                    }
                  }}
                  className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  <RotateCcw size={14} /> {t("Herstel standaardberichten")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Physical Mode Info Modal */}
        {showPhysicalModeInfo && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in" onClick={() => setShowPhysicalModeInfo(false)}>
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl w-full max-w-sm m-4 space-y-4 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <span className="text-amber-400 font-black text-lg">i</span>
                </div>
                <h3 className="text-lg font-black text-white">{t("Fysieke Modus")}</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{t("Gebruik je eigen fysieke spelkaarten in plaats van digitale kaarten. De app begeleidt je alleen door de regels.")}</p>
              <button
                onClick={() => setShowPhysicalModeInfo(false)}
                className="w-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold py-3 rounded-xl transition-colors active:scale-95"
              >
                {t("Sluiten")}
              </button>
            </div>
          </div>
        )}
        {renderDeckPreview()}
        {renderStyleUnlockModal()}
      </RootContainer>
    );
  }
  if (phase === GamePhase.ROUNDS_1_4) {
    const activePlayerSuits = new Set(activePlayer.hand.map(c => c.suit));
    const missingSuit = ALL_SUITS.find(s => !activePlayerSuits.has(s));
    const canAttemptDisco = roundStep === RoundStep.SUIT && activePlayerSuits.size === 3 && !!missingSuit;

    if (isWaitingForNextPlayer) {
      return (
        <RootContainer className="items-center justify-center p-6" theme={settings.theme}>
          <div className="text-center animate-in zoom-in duration-300 flex flex-col items-center">
            <p className="text-slate-400 text-xs mb-4 font-bold uppercase tracking-[0.3em]">{t("Aan de beurt")}</p>
            <div className="w-32 h-32 rounded-full mb-6 bg-gradient-to-b from-slate-800 to-black border-4 border-red-500 flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.4)] relative">
              {activePlayer.image ? (
                <img src={activePlayer.image} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-black text-white">{activePlayer.name.charAt(0).toUpperCase()}</span>
              )}
              <div className="absolute inset-0 rounded-full ring-4 ring-red-500/20 animate-pulse"></div>
            </div>
            <h1 className="text-5xl font-black text-white mb-8 tracking-tight drop-shadow-lg">{activePlayer.name}</h1>
            <button
              onClick={() => setIsWaitingForNextPlayer(false)}
              className="bg-white text-black text-xl font-black px-10 py-4 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center gap-3 mx-auto hover:scale-105 transition-transform active:scale-95"
            >
              {t("Start")} <ArrowRight size={24} strokeWidth={3} />
            </button>
          </div>
        </RootContainer>
      );
    }

    return (
      <RootContainer className="p-2 pb-safe" shake={screenShake} isDiscoActive={isDiscoActive} theme={settings.theme}>
        {showConfetti && <Confetti />}
        <div className="flex-none flex items-center justify-between p-2.5 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 mb-3 z-20 shadow-2xl mx-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-red-600 to-red-800 flex items-center justify-center font-black text-lg text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] ring-2 ring-red-500/20 overflow-hidden">
              {activePlayer?.image ? <img src={activePlayer.image} className="w-full h-full object-cover" /> : activePlayer?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-0.5">{t("Aan de beurt")}</p>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-white text-lg leading-none truncate max-w-[120px] drop-shadow-md">{activePlayer?.name}</p>
                {activePlayer?.isImmune && <Shield size={14} className="text-yellow-400 shrink-0" />}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-3">
              <div className="flex flex-col items-end px-3 border-r border-white/10">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{t("Op")}</span>
                <span className="text-red-400 font-black font-mono text-lg leading-none drop-shadow-sm"><Beer size={12} className="inline mr-1 mb-0.5" />{activePlayer?.drinksTaken}</span>
              </div>
              <div className="flex flex-col items-end pl-1">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{t("Uit")}</span>
                <span className="text-emerald-400 font-black font-mono text-lg leading-none drop-shadow-sm"><ArrowRight size={12} className="inline mr-1 mb-0.5" />{activePlayer?.drinksDistributed}</span>
              </div>
            </div>
            {renderQuitButton()}
          </div>
        </div>

        {renderQuitModal()}



        <div className="flex-1 flex flex-col min-h-0">
          {/* HAND - Fixed Size */}
          <div className="flex-none bg-black/10 rounded-3xl p-3 mb-4 border border-white/5 backdrop-blur-sm shadow-inner relative overflow-hidden min-h-[160px] flex flex-col justify-center">
            {/* Table Felt Texture */}
            <div className="absolute inset-0 bg-[#0f172a]/50 mix-blend-overlay"></div>

            <p className="relative text-center text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-2 opacity-70">{t("Huidige Hand")}</p>

            <div className="relative flex justify-center items-center py-2 gap-2 sm:gap-3 px-2">
              {settings.mode === GameMode.DIGITAL ? (
                Array.from({ length: 4 }).map((_, idx) => {
                  const digitalCards = activePlayer.hand.filter(c => !c.id.startsWith('physical'));
                  const currentCardsCount = digitalCards.length;
                  const isObtained = idx < currentCardsCount;
                  // Only show current card pulse if NOT showing feedback (waiting for next player)
                  const isCurrent = idx === currentCardsCount && !feedback;

                  if (idx >= 4) return null; // Safety check

                  if (isObtained) {
                    const c = digitalCards[idx];
                    return (
                      <div key={c.id} className="flex-none transition-transform hover:-translate-y-2 duration-300 origin-bottom animate-pop" style={{ zIndex: idx }}>
                        <PlayingCard card={c} size="base" className="shadow-lg" style={settings.cardStyle} />
                      </div>
                    );
                  } else if (isCurrent) {
                    return (
                      <div key={`current-${idx}`} className="w-20 h-28 rounded-xl bg-green-500/20 border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] flex flex-col items-center justify-center animate-pulse flex-none" style={{ zIndex: idx }}>
                        <div className="text-green-500 opacity-60 mb-1">
                          {roundStep === 1 && <Sparkles size={20} />}
                          {roundStep === 2 && <ArrowUpDown size={20} />}
                          {roundStep === 3 && <div className="flex gap-0.5 items-center justify-center"><ArrowRight size={12} className="rotate-180" /><ArrowRight size={12} /></div>}
                          {roundStep === 4 && <Zap size={20} />}
                        </div>
                        <span className="text-green-500 font-black text-xl drop-shadow-md">?</span>
                      </div>
                    );
                  } else {
                    return null;
                  }
                })
              ) : (
                <div className="w-full flex justify-center gap-2 sm:gap-3">
                  {Array.from({ length: 4 }).map((_, idx) => {
                    const currentCardsCount = activePlayer.hand.length;
                    const isObtained = idx < currentCardsCount;
                    const isCurrent = idx === currentCardsCount && !feedback;

                    if (isObtained) {
                      return (
                        <div key={`phys-obtained-${idx}`} className="w-20 h-28 rounded-xl bg-[#1e40af] border-[3px] border-white shadow-lg flex items-center justify-center flex-none animate-pop overflow-hidden relative" style={{ zIndex: idx }}>
                          {/* Back texture */}
                          <div className="absolute inset-0 opacity-60" style={{
                            backgroundImage: `radial-gradient(#fff 15%, transparent 16%), radial-gradient(#fff 15%, transparent 16%)`,
                            backgroundSize: '8px 8px',
                            backgroundPosition: '0 0, 4px 4px'
                          }}></div>
                          <div className="w-[80%] h-[40%] rounded-full border-2 border-white/30 flex items-center justify-center backdrop-blur-[1px] relative z-10">
                            <span className="text-white/50 font-serif font-bold italic tracking-widest transform -rotate-12 text-[9px]">BUSSEN</span>
                          </div>
                        </div>
                      );
                    } else if (isCurrent) {
                      return (
                        <div key={`phys-current-${idx}`} className="w-20 h-28 rounded-xl bg-green-500/20 border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] flex flex-col items-center justify-center animate-pulse flex-none" style={{ zIndex: idx }}>
                          <div className="text-green-500 opacity-60 mb-1">
                            {roundStep === 1 && <Sparkles size={20} />}
                            {roundStep === 2 && <ArrowUpDown size={20} />}
                            {roundStep === 3 && <div className="flex gap-0.5 items-center justify-center"><ArrowRight size={12} className="rotate-180" /><ArrowRight size={12} /></div>}
                            {roundStep === 4 && <Zap size={20} />}
                          </div>
                          <span className="text-green-500 font-bold text-2xl drop-shadow-md">?</span>
                        </div>
                      );
                    } else {
                      return null;
                    }
                  })}
                </div>
              )}
            </div>
          </div>

          {/* STAGE */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative z-0">
            <div className="text-center mb-6 relative z-10">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 text-[10px] text-slate-300 font-bold uppercase tracking-widest shadow-lg">
                {t("Ronde")} {roundStep} / 4
              </span>
              <h2 className="text-3xl font-black text-white mt-3 drop-shadow-xl neon-text">
                {roundStep === 1 && t("Rood of Zwart?")}
                {roundStep === 2 && t("Hoger of Lager?")}
                {roundStep === 3 && t("Binnen of Buiten?")}
                {roundStep === 4 && t("Hetzelfde Teken?")}
              </h2>
            </div>

            <div className="relative h-64 w-full flex items-center justify-center perspective-1000 z-0">
              {lastDrawnCard ? (
                <PlayingCard card={lastDrawnCard} size="lg" className="animate-pop shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]" style={settings.cardStyle} />
              ) : (
                settings.mode === GameMode.DIGITAL ? (
                  <div className="w-48 h-64 border-4 border-dashed border-slate-700/50 rounded-2xl flex items-center justify-center bg-slate-900/30 animate-pulse">
                    <span className="text-slate-700 font-serif font-black text-6xl opacity-30">?</span>
                  </div>
                ) : (
                  <div className="w-48 p-6 text-center text-slate-400 text-sm font-medium border-2 border-slate-800 rounded-2xl bg-slate-900/50">
                    {t("Pak een kaart van de stapel...")}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex-none w-full max-w-md mx-auto pt-2 pb-6 px-2 relative z-20">
          {feedback ? (
            <div className="space-y-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
              <div
                key={feedback.text}
                className={`p-4 rounded-2xl text-center font-black text-lg border-2 shadow-xl backdrop-blur-md animate-pop ${feedback.type === 'success' ? 'bg-emerald-900/80 border-emerald-500 text-emerald-100' : 'bg-red-900/80 border-red-500 text-white animate-shake'}`}
              >
                {feedback.text}
              </div>
              <button onClick={nextPlayerTurn} className="w-full bg-white hover:bg-slate-200 text-slate-900 py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                {t("Volgende")} <ArrowRight size={20} strokeWidth={3} />
              </button>
            </div>
          ) : (
            settings.mode === GameMode.PHYSICAL ? (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handlePhysicalGuess(true)} className="bg-gradient-to-b from-emerald-600 to-emerald-800 border-t border-emerald-400 active:scale-95 transition-transform py-4 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(16,185,129,0.3)]">
                  <ThumbsUp size={20} strokeWidth={3} /> {t("GOED")}
                </button>
                <button onClick={() => handlePhysicalGuess(false)} className="bg-gradient-to-b from-red-600 to-red-800 border-t border-red-400 active:scale-95 transition-transform py-4 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(220,38,38,0.3)]">
                  <ThumbsDown size={20} strokeWidth={3} /> {t("FOUT")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {roundStep === 1 && (
                  <>
                    <button onClick={() => handleDigitalGuess('RED')} className="bg-gradient-to-br from-red-600 to-red-800 border-t border-red-400 py-4 rounded-2xl font-black text-white text-lg shadow-lg active:scale-95 transition-transform">{t("ROOD")}</button>
                    <button onClick={() => handleDigitalGuess('BLACK')} className="bg-gradient-to-br from-slate-800 to-black border-t border-slate-600 py-4 rounded-2xl font-black text-white text-lg shadow-lg active:scale-95 transition-transform">{t("ZWART")}</button>
                  </>
                )}
                {roundStep === 2 && (
                  <>
                    <button onClick={() => handleDigitalGuess('HIGHER')} className="bg-gradient-to-br from-blue-600 to-blue-800 border-t border-blue-400 py-4 rounded-2xl font-black text-white text-lg shadow-lg active:scale-95 transition-transform">{t("HOGER")}</button>
                    <button onClick={() => handleDigitalGuess('LOWER')} className="bg-gradient-to-br from-indigo-600 to-indigo-800 border-t border-indigo-400 py-4 rounded-2xl font-black text-white text-lg shadow-lg active:scale-95 transition-transform">{t("LAGER")}</button>
                    <button onClick={() => handleDigitalGuess('EQUAL')} className="col-span-2 bg-slate-800/50 py-3 text-xs font-bold rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">{t("GELIJK")}</button>
                  </>
                )}
                {roundStep === 3 && (
                  <>
                    <button onClick={() => handleDigitalGuess('BETWEEN')} className="bg-gradient-to-br from-emerald-600 to-emerald-800 border-t border-emerald-400 py-4 rounded-2xl font-black text-white text-lg shadow-lg active:scale-95 transition-transform">{t("BINNEN")}</button>
                    <button onClick={() => handleDigitalGuess('OUTSIDE')} className="bg-gradient-to-br from-orange-600 to-orange-800 border-t border-orange-400 py-4 rounded-2xl font-black text-white text-lg shadow-lg active:scale-95 transition-transform">{t("BUITEN")}</button>
                  </>
                )}
                {roundStep === 4 && (
                  <>
                    <button onClick={() => handleDigitalGuess('MATCH')} className="bg-gradient-to-br from-purple-600 to-purple-800 border-t border-purple-400 py-4 rounded-2xl font-black text-white text-lg shadow-lg active:scale-95 transition-transform">{t("ZELFDE")}</button>
                    <button onClick={() => handleDigitalGuess('NO_MATCH')} className="bg-gradient-to-br from-pink-600 to-pink-800 border-t border-pink-400 py-4 rounded-2xl font-black text-white text-lg shadow-lg active:scale-95 transition-transform">{t("ANDERS")}</button>
                    {canAttemptDisco && (
                      <button
                        onClick={handleDiscoAttempt}
                        className="col-span-2 relative overflow-hidden border-2 border-white/20 rounded-2xl font-black text-white text-lg shadow-[0_10px_30px_rgba(236,72,153,0.35)] active:scale-95 transition-transform"
                        style={{
                          background: 'linear-gradient(90deg, #f472b6, #7c3aed, #22d3ee, #f97316, #f472b6)',
                          backgroundSize: '300% 300%',
                          animation: 'disco-gradient 2.2s linear infinite'
                        }}
                      >
                        {t("DISCO!")}
                      </button>
                    )}
                  </>
                )}
              </div>
            )
          )}
        </div>
      </RootContainer>
    );
  }

  // 4. PYRAMID
  if (phase === GamePhase.PYRAMID) {
    const manualBusSelectionOverlay = isSelectingBusPlayer ? (
      <div className="absolute inset-0 z-[95] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) setIsSelectingBusPlayer(false); }}>
        <div className="w-full max-w-lg bg-slate-900/80 border border-white/10 rounded-3xl shadow-2xl p-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase font-black tracking-[0.25em] text-amber-300">{t("de bus in jij")}</p>
            <h3 className="text-3xl font-black text-white leading-tight">{t("Wie heeft nu de meeste kaarten?")}</h3>
            <p className="text-slate-300 text-sm"></p>
          </div>

          <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto">
            {players.filter(p => !p.isImmune).map((p) => (
              <button
                key={p.id}
                onClick={() => handleManualBusPassengerSelect(p)}
                className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl p-3 text-left hover:border-amber-400 hover:bg-amber-500/10 transition-all active:scale-95"
              >
                <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden border border-slate-500">
                  {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : (
                    <span className="w-full h-full flex items-center justify-center text-white font-black text-lg">{p.name.charAt(0)}</span>
                  )}
                </div>
                <span className="text-white font-bold truncate">{p.name}</span>
              </button>
            ))}
            {players.filter(p => p.isImmune).map((p) => (
              <button
                key={p.id}
                disabled
                className="flex items-center gap-3 bg-black/20 border border-white/5 rounded-2xl p-3 text-left cursor-not-allowed opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden border border-slate-500 grayscale">
                  {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : (
                    <span className="w-full h-full flex items-center justify-center text-white/70 font-black text-lg">{p.name.charAt(0)}</span>
                  )}
                </div>
                <span className="text-white/70 font-bold truncate line-through">{p.name}</span>
                <Shield size={20} className="text-yellow-400 ml-auto" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsSelectingBusPlayer(false)}
            className="w-full bg-slate-800 text-slate-200 font-bold py-3 rounded-2xl border border-white/10 hover:border-slate-500 active:scale-95 transition-all"
          >
            {t("Annuleren")}
          </button>
        </div>
      </div>
    ) : null;

    if (settings.mode === GameMode.PHYSICAL && pyramidMode === 'physical') {
      return (
        <RootContainer className="p-4 sm:p-6 items-center justify-center overflow-y-auto" variant="pyramid" theme={settings.theme}>
          {manualBusSelectionOverlay}
        {renderQuitModal()}

        {loserReveal && (
            <div className="absolute inset-0 z-[90] bg-red-950 flex flex-col items-center justify-center p-6 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600/30 to-black animate-pulse"></div>

              {/* Strobe effect overlay */}
              <div className="absolute inset-0 bg-white/5 animate-[pulse_0.1s_ease-in-out_infinite]"></div>

              <h2 className="relative z-10 text-3xl font-black text-red-500 uppercase mb-8 tracking-[0.5em] animate-bounce drop-shadow-[0_0_10px_rgba(0,0,0,1)] text-center">{loserReveal.title}</h2>

              <div className="relative z-10 w-48 h-48 mb-8">
                <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-40"></div>
                <div className="absolute inset-0 bg-red-600 rounded-full animate-[ping_1s_infinite] opacity-20 delay-75"></div>
                <div className="relative w-48 h-48 rounded-full bg-gradient-to-b from-slate-900 to-black border-8 border-red-600 flex items-center justify-center shadow-[0_0_100px_rgba(220,38,38,0.8)] overflow-hidden">
                  {loserReveal.player.image ? (
                    <img src={loserReveal.player.image} className="w-full h-full object-cover animate-[spin_8s_linear_infinite]" />
                  ) : (
                    <span className="text-7xl font-black text-white">{loserReveal.player.name.charAt(0)}</span>
                  )}
                </div>
              </div>

              <h1 className="relative z-10 text-5xl font-black text-white mb-4 text-center neon-text animate-[shake_0.5s_infinite]">{loserReveal.player.name}</h1>
              <div className="relative z-10 bg-red-600 text-white font-black text-xl px-8 py-2 rounded-full uppercase tracking-widest shadow-xl">
                {t("Naar de Bus!")}
              </div>
            </div>
          )}

          <div className="w-full max-w-2xl bg-black/70 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-6 text-center">
            <div className="space-y-4 text-left">
              <p className="text-[11px] uppercase font-black tracking-[0.25em] text-amber-300 text-center">{t("een echte piramide")}</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight text-center">{t("Bouw deze piramide op tafel")}</h2>

              <div className="w-full flex flex-col items-center gap-2 mt-2">
                {Array.from({ length: settings.pyramidRows }, (_, i) => i + 1).map(row => (
                  <div key={row} className="flex gap-2 justify-center">
                    {Array.from({ length: row }).map((_, idx) => (
                      <div
                        key={idx}
                        className="w-10 h-14 sm:w-12 sm:h-16 rounded-xl bg-gradient-to-br from-amber-500/60 to-amber-700/80 border border-amber-300/50 shadow-[0_8px_20px_rgba(251,191,36,0.3)]"
                      ></div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-slate-200 text-base bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-black text-white">{t("Bouw een Piramide starter guide")}</p>
                  <button
                    onClick={() => setIsPyramidInstructionsCollapsed(prev => !prev)}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-200 hover:text-amber-100 transition-colors"
                  >
                    {isPyramidInstructionsCollapsed ? t('Toon') : t('Verberg')}
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${isPyramidInstructionsCollapsed ? 'rotate-0' : 'rotate-180'}`}
                    />
                  </button>
                </div>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${!isPyramidInstructionsCollapsed ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="space-y-1 pt-2">
                    <p>1.  {t("Leg speelkaarten met het plaatje naar beneden in een piramidevorm (duh)")}</p>
                    <p>2.  {t("Start onderaan met")} {settings.pyramidRows} {t("kaarten in de breedste rij")}</p>
                    <p>3.  {t("Elke volgende rij heeft één kaart minder tot je een bovenste kaart hebt")}</p>
                    <p>4.  {t("Draai kaarten rij voor rij om, van onder naar boven")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">

              <button

                onClick={() => setIsSelectingBusPlayer(true)}

                className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white font-black py-3 rounded-2xl border border-red-400/60 shadow-lg active:scale-95 transition-all text-base sm:text-lg"

              >

                {t("Naar de Bus")}

              </button>

              <button

                onClick={() => {

                  setPyramidMode('digital');

                  setFeedback(null);

                  setRevealedPyramidCards(new Set());

                  setLoserReveal(null);

                  setIsPyramidComplete(false);

                  generateDigitalPyramid();

                }}

                className="w-full sm:w-auto text-center text-slate-300 font-semibold py-2 px-3 rounded-lg hover:text-white transition-colors underline underline-offset-4 decoration-slate-500/70 self-end"

              >

                {t("Toch een Digitale Piramide")}

              </button>

            </div>
          </div>
        </RootContainer>
      );
    }
    return (
      <RootContainer className="p-0" variant="pyramid" shake={screenShake} disableSafeTop theme={settings.theme}>
        {manualBusSelectionOverlay}
        {renderQuitModal()}

        {loserReveal && (
          <div className="absolute inset-0 z-[90] bg-red-950 flex flex-col items-center justify-center p-6 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600/30 to-black animate-pulse"></div>

            {/* Strobe effect overlay */}
            <div className="absolute inset-0 bg-white/5 animate-[pulse_0.1s_ease-in-out_infinite]"></div>

            <h2 className="relative z-10 text-3xl font-black text-red-500 uppercase mb-8 tracking-[0.5em] animate-bounce drop-shadow-[0_0_10px_rgba(0,0,0,1)] text-center">{loserReveal.title}</h2>

            <div className="relative z-10 w-48 h-48 mb-8">
              <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-40"></div>
              <div className="absolute inset-0 bg-red-600 rounded-full animate-[ping_1s_infinite] opacity-20 delay-75"></div>
              <div className="relative w-48 h-48 rounded-full bg-gradient-to-b from-slate-900 to-black border-8 border-red-600 flex items-center justify-center shadow-[0_0_100px_rgba(220,38,38,0.8)] overflow-hidden">
                {loserReveal.player.image ? (
                  <img src={loserReveal.player.image} className="w-full h-full object-cover animate-[spin_8s_linear_infinite]" />
                ) : (
                  <span className="text-7xl font-black text-white">{loserReveal.player.name.charAt(0)}</span>
                )}
              </div>
            </div>

            <h1 className="relative z-10 text-5xl font-black text-white mb-4 text-center neon-text animate-[shake_0.5s_infinite]">{loserReveal.player.name}</h1>
            <div className="relative z-10 bg-red-600 text-white font-black text-xl px-8 py-2 rounded-full uppercase tracking-widest shadow-xl">
              {t("Naar de Bus!")}
            </div>
          </div>
        )}
        {/* Match Modal */}
        {pendingMatches && (
          <div className="absolute inset-0 z-[80] bg-black/90 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 animate-in zoom-in duration-300" onClick={(e) => { if (e.target === e.currentTarget) dismissMatchModal(); }}>
            {/* Card Reveal for Match */}
            <div className="mb-8 scale-125 drop-shadow-[0_0_50px_rgba(255,255,255,0.15)] animate-pop">
              <PlayingCard card={pendingMatches.card} size="md" style={settings.cardStyle} />
            </div>

            <div className="bg-gradient-to-b from-slate-800 to-slate-900 w-full max-w-xs rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative ring-1 ring-white/20">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 animate-pulse"></div>
              <button onClick={dismissMatchModal} className="absolute top-3 right-3 p-2 bg-black/20 rounded-full text-slate-400 hover:text-white z-10"><X size={20} /></button>

              <div className="p-6 text-center border-b border-white/5">
                <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 font-black text-3xl uppercase tracking-tight drop-shadow-lg animate-pulse">{t("MATCH!")}</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{t("Wie legt op?")}</p>
              </div>

              <div className="p-5 grid grid-cols-2 gap-3">
                {pendingMatches.matches.map((m) => (
                  <button
                    key={m.player.id}
                    onClick={() => resolveMatch(m.player.id)}
                    className="group relative flex flex-col items-center gap-2 bg-black/40 p-4 rounded-2xl hover:bg-emerald-900/30 border border-white/5 hover:border-emerald-500 transition-all active:scale-95"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center font-bold text-white shadow-lg overflow-hidden ring-2 ring-white/10 group-hover:ring-emerald-500 transition-all">
                      {m.player.image ? <img src={m.player.image} className="w-full h-full object-cover" /> : m.player.name.charAt(0)}
                    </div>
                    <span className="text-white font-bold text-sm truncate w-full text-center group-hover:text-emerald-400">{m.player.name}</span>
                  </button>
                ))}
              </div>
              <div className="bg-black/50 p-3 text-center">
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <ArrowRight size={12} /> {t(" Uitdelen: ")} {getSipsText(pendingMatches.sips)}
                </p>
              </div>
            </div>
          </div>
        )}



        <div className="flex-none flex justify-between items-center px-5 pb-4 bg-slate-900/90 backdrop-blur border-b border-white/10 z-10 shadow-2xl gap-4" style={{ paddingTop: 'calc(1rem + var(--safe-top, 0px))' }}>
          <div className="flex items-center gap-6 overflow-hidden">
            <div className="shrink-0">
              <h2 className="text-2xl font-black text-amber-500 uppercase tracking-tighter drop-shadow-md">
                {isPyramidDoubleSetup ? t("Dubbele kaarten in de piramide") : t("Piramide")}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {isPyramidDoubleSetup ? t("Kies een kaart per niveau") : t("Draai kaarten om")}
              </p>
            </div>

            <div className="flex items-center gap-2 py-1">
              {(() => {
                const victim = findLoser();
                return players.map(p => {
                  const isLoser = victim && p.id === victim.id;
                  const hasCards = p.hand.length > 0;
                  
                  return (
                    <div key={p.id} className="flex flex-col items-center shrink-0">
                      <div className={`w-8 h-8 rounded-full border-2 transition-all relative ${isLoser ? 'border-transparent' : hasCards ? 'border-amber-500' : 'border-white/10 opacity-50'} bg-slate-800`}>
                        {isLoser && (
                          <div className="absolute -inset-[2px] rounded-full z-0 overflow-hidden pointer-events-none">
                            <div 
                              className="absolute inset-0 animate-[spin_3s_linear_infinite]"
                              style={{
                                background: 'conic-gradient(from 0deg, #f59e0b, #ef4444, #f59e0b)',
                                padding: '2px'
                              }}
                            />
                            <div className="absolute inset-[2px] bg-slate-800 rounded-full" />
                          </div>
                        )}
                        <div className="absolute inset-0 rounded-full overflow-hidden z-10 pointer-events-none">
                          {p.image ? (
                            <img src={p.image} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-black">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 mt-1">
                        {isLoser && <BusFront size={10} className="text-red-500" />}
                        <span className={`text-[10px] font-black ${isLoser ? 'text-amber-400' : hasCards ? 'text-amber-400' : 'text-slate-500'}`}>
                          {p.hand.length}/4
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="shrink-0">
            {renderQuitButton("w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-slate-800/70 transition-all active:scale-90 backdrop-blur-sm")}
          </div>
        </div>



        {feedback && !pendingMatches && (
          <div className="absolute top-24 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className={`mx-4 px-6 py-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl border-2 text-base font-black text-center animate-in zoom-in duration-200 ${feedback.type.includes('success') ? 'bg-green-900/90 border-green-400 text-green-100' : feedback.type === 'error' ? 'bg-red-900/90 border-red-500 text-white' : 'bg-slate-800/90 border-slate-500 text-white'}`}>
              {feedback.text}
            </div>
          </div>
        )}
        {isPyramidDoubleSetup && pyramidDoubleSetupRow >= settings.pyramidRows - 2 && (
          <div className="absolute top-32 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
            <div className="bg-slate-900/90 backdrop-blur-xl border-2 border-red-500/50 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-sm w-full animate-in slide-in-from-top-10 duration-500 ring-1 ring-red-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg uppercase tracking-tight leading-none">{t("Dubbele kaarten in de piramide")}</h3>
                  <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {t("Niveau")} {settings.pyramidRows - pyramidDoubleSetupRow}
                  </p>
                </div>
              </div>
              <p className="text-slate-300 text-sm font-medium leading-snug">
                {t("Kies een kaart per niveau voor dubbele slokken")}. {t("Matches op deze kaart tellen dubbel")}!
              </p>
            </div>
          </div>
        )}

        {/* Manual Proceed Button */}
        {isPyramidComplete && !pendingMatches && (
          <div className="absolute bottom-10 left-0 right-0 z-[60] flex justify-center animate-in slide-in-from-bottom-10 fade-in duration-500">
            <button
              onClick={proceedToBus}
              className="bg-gradient-to-r from-red-600 to-red-800 text-white text-xl font-black px-12 py-4 rounded-full shadow-[0_0_50px_rgba(220,38,38,0.6)] flex items-center gap-3 hover:scale-105 transition-transform active:scale-95 ring-4 ring-red-500/30 animate-bounce-subtle"
            >
              <BusFront size={28} /> {t(" NAAR DE BUS ")} <ArrowRight size={28} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* Pyramid Grid - Reduced Scale - No Entry Animation */}
        <div ref={pyramidContainerRef} className="flex-1 flex items-center justify-center overflow-hidden p-2 relative">
          <div
            ref={pyramidContentRef}
            className="flex flex-col items-center gap-2 md:gap-3 origin-center transition-transform duration-500"
            style={{ transform: `scale(${pyramidScale})` }}
          >
            {(() => {
              const activeRowIndex = isPyramidDoubleSetup ? pyramidDoubleSetupRow : (() => {
                for (let i = pyramid.length - 1; i >= 0; i--) {
                  if (pyramid[i].some(c => c && !revealedPyramidCards.has(c.id))) return i;
                }
                return -1;
              })();

              return pyramid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-3 justify-center relative">
                  {row.map((card, cardIndex) => {
                    const isRevealed = card && revealedPyramidCards.has(card.id);
                    let hasMatch = false;
                    if (isRevealed && card && settings.mode === GameMode.DIGITAL) {
                      hasMatch = players.some(p => p.hand.some(h => h.rank === card.rank));
                    }

                    return (
                      <div key={card ? card.id : `${rowIndex}-${cardIndex}`} className={`relative group ${hasMatch ? 'cursor-pointer' : ''}`}>
                        <PlayingCard
                          card={isRevealed ? card : null}
                          isFaceDown={!isRevealed}
                          size="md"
                          style={settings.cardStyle}
                          className={`${doubledPyramidCardIds.has(card?.id || '') ? 'rotate-90' : ''} ${isPyramidDoubleSetup && rowIndex === pyramidDoubleSetupRow ? 'ring-4 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : ''} ${pulseValidCards && rowIndex === activeRowIndex && !isRevealed ? 'animate-pyramid-ring-pulse z-20' : ''} transition-all duration-300 ${!isRevealed ? 'z-10' : 'z-0'} ${hasMatch ? 'ring-[3px] ring-green-500 shadow-[0_0_25px_rgba(34,197,94,0.7)] scale-[1.02]' : ''}`}
                          onClick={() => {
                            if (isPyramidDoubleSetup) {
                              if (rowIndex === pyramidDoubleSetupRow) {
                                handleDoubleCardSelection(rowIndex, cardIndex);
                              } else {
                                triggerPyramidWarning();
                              }
                              return;
                            }
                            if (!isRevealed) {
                              revealPyramidCard(rowIndex, cardIndex);
                            } else if (hasMatch && card) {
                              const isDoubled = doubledPyramidCardIds.has(card.id);
                              const sips = (settings.pyramidRows - rowIndex) * (isDoubled ? 2 : 1);
                              const isTop = rowIndex === 0;
                              const matches: { player: Player, cardIndex: number }[] = [];
                              players.forEach(p => {
                                const matchIndex = p.hand.findIndex(h => h.rank === card.rank);
                                if (matchIndex !== -1) {
                                  matches.push({ player: p, cardIndex: matchIndex });
                                }
                              });
                              if (matches.length > 0) {
                                triggerHaptic('medium');
                                setPendingMatches({ card, sips: isTop ? 5 : sips, matches });
                              }
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                  {/* Row Indicator */}
                  <div className={`absolute top-1/2 -translate-y-1/2 text-[12px] sm:text-[14px] w-14 sm:w-20 text-right whitespace-nowrap drop-shadow-lg opacity-80 transition-all ${row.some(card => card && doubledPyramidCardIds.has(card.id)) ? '-left-20 sm:-left-32' : '-left-16 sm:-left-24'}`}>
                    {Array(settings.pyramidRows - rowIndex).fill('🍺').join('')}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </RootContainer>
    );
  }

  // 5. BUS TEAM SELECT
  const resolvedBusMode = busMode ?? (settings.mode === GameMode.PHYSICAL ? 'physical' : 'digital');
  const physicalBusBgStyle = {
    background: 'radial-gradient(circle at 22% 18%, rgba(226,232,240,0.08), transparent 40%), radial-gradient(circle at 78% 6%, rgba(59,130,246,0.12), transparent 36%), linear-gradient(135deg, #0b1224 0%, #0f172a 45%, #0b1220 100%)',
    backgroundSize: '240% 240%',
    animation: 'gradient-xy 18s ease-in-out infinite',
  };

  const physicalBusBgStyleWon = {
    background: 'radial-gradient(circle at 22% 20%, rgba(250,204,21,0.25), transparent 40%), radial-gradient(circle at 78% 16%, rgba(99,102,241,0.22), transparent 36%), radial-gradient(circle at 46% 74%, rgba(34,197,94,0.2), transparent 42%), linear-gradient(135deg, #0d2430 0%, #0e3d43 28%, #16304f 52%, #2b1b3f 76%, #0f2a45 100%)',
    backgroundSize: '260% 260%',
    animation: 'gradient-xy 22s ease-in-out infinite',
  };

  const physicalBusBackgroundStyle: React.CSSProperties = isBusWon ? physicalBusBgStyleWon : physicalBusBgStyle;
  const digitalBusBackgroundStyle: React.CSSProperties = isBusWon
    ? {
      background: 'radial-gradient(circle at 16% 18%, rgba(251,191,36,0.22), transparent 40%), radial-gradient(circle at 84% 14%, rgba(168,85,247,0.24), transparent 36%), radial-gradient(circle at 48% 78%, rgba(34,211,238,0.2), transparent 42%), linear-gradient(135deg, #0b1f33 0%, #123a55 24%, #0c3b35 50%, #2d1f45 74%, #0b2c4c 100%)',
      backgroundSize: '260% 260%',
      animation: 'gradient-xy 20s ease-in-out infinite',
      transition: 'background 2000ms ease-in-out, filter 2000ms ease-in-out'
    }
    : {
      background: 'radial-gradient(circle at 12% 14%, rgba(255,255,255,0.06), transparent 40%), radial-gradient(circle at 84% 10%, rgba(59,130,246,0.08), transparent 36%), linear-gradient(135deg, #0b1224 0%, #111827 40%, #0b1320 100%)',
      backgroundSize: '240% 240%',
      animation: 'gradient-xy 16s ease-in-out infinite',
      transition: 'background 1800ms ease-in-out, filter 1800ms ease-in-out'
    };

  if (phase === GamePhase.BUS_TEAM_SELECTION) {
    const victim = busPassengers[0];
    return (
      <RootContainer className="items-center justify-center text-center border-0 outline-0" disableBaseBg showTexture={false} disableSafeTop theme={settings.theme}>
        <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-4" style={{ ...((resolvedBusMode === 'digital' ? digitalBusBackgroundStyle : physicalBusBackgroundStyle) as any), paddingTop: 'calc(1rem + var(--safe-top, 0px))' }}>
          <div className="absolute z-[96]" style={{ top: 'calc(var(--safe-top, 0px) + 1rem)', right: '1rem' }}>
            {renderQuitButton("w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90 backdrop-blur-sm border border-white/10")}
          </div>
          {renderQuitModal()}
          <div className="w-24 h-24 rounded-full bg-red-900 border-4 border-red-500 flex items-center justify-center mb-8 overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.6)]">
            {victim.image ? <img src={victim.image} className="w-full h-full object-cover" /> : <Users size={40} className="text-white" />}
          </div>
          <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter drop-shadow-xl">{t("Gedeelde Bus")}</h2>
          <p className="text-red-200 font-bold text-sm mb-8 uppercase tracking-widest">
            <span className="text-white border-b-2 border-red-500">{victim.name}</span>{t(", Wie neem je mee de bus in?")}
          </p>

          <div className="w-full max-w-sm space-y-3 overflow-y-auto max-h-[50vh] px-2">
            <button
              onClick={() => handleSharedBusSelection(null)}
              className="w-full bg-black/40 backdrop-blur-md p-5 rounded-2xl text-white font-bold border-2 border-dashed border-slate-600 mb-2 text-sm hover:bg-slate-800 hover:border-white transition-all active:scale-95"
            >
              {t("NIEMAND")}
            </button>
            {players.filter(p => !busPassengers.some(bp => bp.id === p.id) && !p.isImmune).map(p => (
              <button
                key={p.id}
                onClick={() => handleSharedBusSelection(p)}
                className="w-full bg-slate-900/80 p-4 rounded-2xl flex items-center justify-between text-white font-bold text-sm hover:bg-red-900/50 border border-white/5 hover:border-red-500 transition-all shadow-lg active:scale-95"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-slate-500">
                    {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : null}
                  </div>
                  <span className="text-lg">{p.name}</span>
                </div>
                <HeartPulse size={20} className="text-red-500" />
              </button>
            ))}
            {players.filter(p => !busPassengers.some(bp => bp.id === p.id) && p.isImmune).map(p => (
              <button
                key={p.id}
                disabled
                className="w-full bg-slate-900/40 p-4 rounded-2xl flex items-center justify-between text-white/50 font-bold text-sm border border-white/5 shadow-lg cursor-not-allowed opacity-60"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-slate-500 grayscale">
                    {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : null}
                  </div>
                  <span className="text-lg line-through">{p.name}</span>
                </div>
                <Shield size={20} className="text-yellow-400" />
              </button>
            ))}
          </div>
        </div>
      </RootContainer>
    );
  }

  // 6. THE BUS
  if (phase === GamePhase.THE_BUS) {
    if (isBusEntrance) {
      return (
        <RootContainer className="items-center justify-center" disableBaseBg showTexture={false} disableSafeTop theme={settings.theme}>
          <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-[background,filter] duration-2000 ease-out p-4" style={{ ...((busMode === 'digital' ? digitalBusBackgroundStyle : physicalBusBackgroundStyle) as any), paddingTop: 'calc(1rem + var(--safe-top, 0px))' }}>
            <h1 className="text-5xl font-black text-white mb-2 text-center uppercase tracking-tighter drop-shadow-xl">{t("Samen in de bus!")}</h1>
            
            {busPassengers.length >= 2 && (
              <p className="text-red-300 font-bold text-lg mb-12 text-center uppercase tracking-widest px-4">
                <span className="underline decoration-red-500 underline-offset-4 text-white">{busPassengers[0].name}</span> & <span className="underline decoration-red-500 underline-offset-4 text-white">{busPassengers[1].name}</span> {t("gaan samen in de bus.")}
              </p>
            )}

            <div className="flex flex-row gap-8 items-center justify-center z-10 flex-wrap">
              {busPassengers.map((p, i) => (
                <div key={p.id} className="flex flex-col items-center animate-in zoom-in duration-500">
                  <span className="text-amber-400 font-black text-sm uppercase tracking-widest mb-3 opacity-90">{t("Speler")} {i + 1}</span>
                  <div className="w-36 h-36 rounded-full border-[5px] border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.7)] overflow-hidden mb-5 transition-all">                    {p.image ? <img src={p.image} className="w-full h-full object-cover animate-[spin_8s_linear_infinite]" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-5xl font-black animate-[spin_8s_linear_infinite]">{p.name.charAt(0)}</div>}
                  </div>
                  <div className="text-3xl font-black text-white uppercase tracking-widest drop-shadow-md">{p.name}</div>
                </div>
              ))}
            </div>
          </div>
        </RootContainer>
      );
    }

    if (settings.mode === GameMode.PHYSICAL && busMode === 'physical') {
      const passengerNames = busPassengers.map(p => p.name).join(' & ');
      const completedCards = isBusWon ? settings.busLength : Math.max(1, Math.min(settings.busLength, physicalBusPosition));
      const busProgressCards = Array.from({ length: settings.busLength }).map((_, idx) => ({
        idx,
        isComplete: idx < completedCards,
      }));
      const eligiblePlayers = players.filter(p => !busPassengers.some(bp => bp.id === p.id));
      const playerPool = eligiblePlayers.length > 0 ? eligiblePlayers : players;
      const randomPlayerForInstructions = playerPool.length > 0 ? playerPool[Math.floor(Math.random() * playerPool.length)] : null;
      const busPanelClasses = `${isBusWon
        ? 'bg-gradient-to-b from-black/80 via-emerald-950/75 to-black/75 border border-emerald-700/40 shadow-[0_20px_60px_rgba(16,185,129,0.28)]'
        : 'bg-gradient-to-b from-black/85 via-slate-950/85 to-black/80 border border-red-800/40 shadow-[0_20px_60px_rgba(220,38,38,0.35)]'
        } backdrop-blur-xl rounded-3xl p-4 sm:p-6 space-y-6 transition-[background,box-shadow,border-color] duration-700 ease-out`;

      return (
        <RootContainer disableBaseBg showTexture={false} disableSafeTop theme={settings.theme}>
          <div className="flex-1 w-full h-full overflow-y-auto px-4 sm:px-6 pb-28 pb-safe relative" style={{ paddingTop: 'calc(1rem + var(--safe-top, 0px))' }}>
            <div
              className="absolute inset-0 transition-opacity duration-2000 ease-in-out"
              style={{ ...physicalBusBgStyle, opacity: isBusWon ? 0 : 1 }}
            />
            <div
              className="absolute inset-0 transition-opacity duration-2000 ease-in-out"
              style={{ ...physicalBusBgStyleWon, opacity: isBusWon ? 1 : 0 }}
            />
            <div className="w-full max-w-4xl mx-auto space-y-6 relative z-10">
              <div className={busPanelClasses}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                  <div className="space-y-1 text-center md:text-left mr-10">
                    <p className="text-[11px] uppercase font-black tracking-[0.25em] text-red-300">{t("Fysieke bus")}</p>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">{t("De Busrit")}</h2>
                    </div>
                    <p className="text-slate-300 text-sm">{t("Passagier")}{busPassengers.length > 1 ? 's' : ''}: <span className="text-white font-black">{passengerNames || 'Onbekend'}</span></p>
                  </div>
                  <div className="text-right text-slate-200 text-[11px] uppercase font-black tracking-[0.25em] bg-white/5 border border-white/10 px-3 py-2 rounded-2xl self-start md:self-center">
                    {t("Kaart")} {physicalBusPosition} / {settings.busLength}
                  </div>
                </div>

                {!isBusWon && (
                  <div className="fixed z-[96]" style={{ top: 'calc(var(--safe-top, 0px) + 1rem)', right: '1rem' }}>
                    {renderQuitButton("w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-slate-800/70 transition-all active:scale-90 backdrop-blur-sm")}
                  </div>
                )}

                <div className="bg-black/40 border border-amber-200/30 rounded-2xl p-4 shadow-[0_16px_40px_rgba(251,191,36,0.18)] animate-in fade-in duration-500 space-y-4">
                  <div className="flex items-center justify-between text-[11px] uppercase font-black tracking-[0.25em] text-amber-200 flex-wrap gap-2">
                    <span className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-300" />
                      {t("Voortgang")}
                    </span>
                  </div>
                  <div
                    ref={busProgressContainerRef}
                    className="flex justify-center overflow-x-auto no-scrollbar px-1 py-1 scroll-smooth"
                  >
                    <div
                      ref={busProgressContentRef}
                      className="flex flex-nowrap gap-2 sm:gap-3 md:gap-4 transition-transform duration-200"
                      style={{
                        transform: `scale(${busProgressScale})`,
                        transformOrigin: 'center',
                        minWidth: 'max-content',
                      }}
                    >
                      {busProgressCards.map(({ idx, isComplete }) => (
                        <div
                          key={idx}
                          ref={el => busProgressItemRefs.current[idx] = el}
                          className="w-12 h-16 sm:w-14 sm:h-20 md:w-16 md:h-24 flex-none perspective-1000"
                        >
                          <div className={`relative w-full h-full preserve-3d transition-transform duration-700 ease-out ${isComplete ? 'rotate-y-180' : ''}`}>
                            <div className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-amber-500/60 to-amber-700/80 border border-amber-300/50 shadow-[0_8px_18px_rgba(251,191,36,0.28)] transition-[background,box-shadow] duration-700 ease-out"></div>
                            <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-gradient-to-br from-emerald-500/80 via-teal-500/70 to-emerald-700/80 border border-emerald-200/60 shadow-[0_10px_24px_rgba(16,185,129,0.45)] transition-[background,box-shadow] duration-700 ease-out"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 text-slate-100 text-sm leading-relaxed">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-black text-white">{t("De Busrit met echte Kaarten")}</p>
                    <button
                      onClick={() => setIsBusInstructionsCollapsed(prev => !prev)}
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-200 hover:text-white transition-colors"
                    >
                      {isBusInstructionsCollapsed ? t('Toon') : t('Verberg')}
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-300 ${isBusInstructionsCollapsed ? 'rotate-0' : 'rotate-180'}`}
                      />
                    </button>
                  </div>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${!isBusInstructionsCollapsed ? 'max-h-96' : 'max-h-0'}`}>
                    <div className="space-y-1 pt-2">
                      <p>1.  {t("Kies iemand om de kaarten uit te delen, bijvoorbeeld")} {randomPlayerForInstructions?.name || t('jij')}.</p>
                      <p>2.  {t("Leg een rij van")} {settings.busLength} {t("kaarten met de afbeelding naar beneden.")}</p>
                      <p>3.  {t("Raad hoger of lager dan de vorige kaart, de eerste kaart is altijd omgedraaid.")}</p>
                      <p>4.  {t("Fout? Drink het kaartnummer aan slokken en start opnieuw bij kaart één.")}</p>
                      <p>5.  {t("Goed? Ga door naar de volgende kaart.")}</p>
                      <p>6.  {t("Hele rij gehaald? Je mag uit de bus!")}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <button
                    onClick={() => handlePhysicalBusGuess('correct')}
                    className="flex items-center justify-center gap-3 w-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black text-lg sm:text-xl py-4 rounded-2xl shadow-[0_12px_30px_rgba(34,197,94,0.35)] border border-emerald-300/50 active:scale-[0.99] transition-all"
                  >
                    <ThumbsUp size={26} />
                    {t("Correct")}
                  </button>
                  <button
                    onClick={() => handlePhysicalBusGuess('incorrect')}
                    className="flex items-center justify-center gap-3 w-full bg-gradient-to-br from-red-600 to-red-800 text-white font-black text-lg sm:text-xl py-4 rounded-2xl shadow-[0_12px_30px_rgba(239,68,68,0.35)] border border-red-300/50 active:scale-[0.99] transition-all"
                  >
                    <ThumbsDown size={26} />
                    {t("Incorrect")}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:justify-end gap-3 min-h-[40px]">
                  <button
                    onClick={() => startDigitalBus(busPassengers)}
                    className={`w-full sm:w-auto text-center text-slate-300 font-semibold py-2 px-3 rounded-lg hover:text-white transition-opacity duration-300 underline underline-offset-4 decoration-slate-500/70 ${isBusWon ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  >
                    {t("Toch een Digitale Bus")}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {isBusWon && (
            <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 flex justify-center z-30 animate-in slide-in-from-bottom-4 duration-500 px-4">
              <button
                onClick={() => { prepareAdInterstitial(ADMOB_INTERSTITIAL_LEADERBOARD_UNIT_ID); setPhase(GamePhase.GAME_OVER); }}
                className="pointer-events-auto w-full sm:w-auto text-amber-950 text-xl sm:text-2xl font-black px-8 sm:px-14 py-5 rounded-[2rem] border-4 border-amber-300/50 shadow-[0_0_60px_rgba(251,191,36,0.6)] flex items-center justify-center gap-4 transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(90deg, #fcd34d, #f59e0b, #fbbf24, #fcd34d)',
                  backgroundSize: '200% 200%',
                  animation: 'end-gradient 3s linear infinite',
                }}
              >
                {t("Naar het Einde")} <ArrowRight size={28} strokeWidth={3} />
              </button>
            </div>
          )}
          {renderQuitModal()}
        </RootContainer>
      );
    }

    const passengerNames = busPassengers.map(p => p.name).join(' & ');
    const remainingBusCards = busDeck.length;

    return (
      <RootContainer className="p-0 relative" shake={screenShake} disableBaseBg showTexture={false} disableSafeTop theme={settings.theme}>
        <div className="absolute inset-0 -z-10" style={digitalBusBackgroundStyle}></div>
        {isBusWon && <Confetti />}

        {/* Header - Redesigned */}
        <div className="flex-none flex items-center justify-between px-5 pb-5 bg-black/80 border-b border-red-900/30 z-10 shadow-2xl gap-3 flex-wrap" style={{ paddingTop: 'calc(1.25rem + var(--safe-top, 0px))' }}>
          <div>
            <h2 className="text-3xl font-black text-red-600 italic tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">{t("De Bus")}</h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full border text-[10px] uppercase font-black tracking-widest ${remainingBusCards === 0 ? 'border-red-500/50 bg-red-900/20 text-red-200' : 'border-red-900/40 bg-red-900/10 text-slate-200'}`}>
              <BusFront size={14} className={remainingBusCards === 0 ? 'text-red-400' : 'text-red-500'} />
              <span>{remainingBusCards} {t(" over")}</span>
            </div>
            {settings.busDecks > 1 && (
              <div className={`flex items-center gap-1 px-2 py-2 rounded-full border text-[10px] uppercase font-black tracking-widest ${busDecksUsed >= settings.busDecks ? 'border-red-500/50 bg-red-900/20 text-red-200' : 'border-red-900/40 bg-red-900/10 text-slate-200'}`}>
                <span>{t("Pakje")}</span>
                <span className={`${busDecksUsed >= settings.busDecks ? 'text-red-400' : 'text-slate-200'}`}>{busDecksUsed}/{settings.busDecks}</span>
              </div>
            )}
            <div className="text-right mr-10">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                {busPassengers.length > 1 ? t('Passagiers') : t('Passagier')}
              </span>
              <span className="text-white text-sm font-black">{passengerNames}</span>
            </div>
          </div>
        </div>

        {!isBusWon && (
          <div className="fixed z-[96]" style={{ top: 'calc(var(--safe-top, 0px) + 1rem)', right: '1rem' }}>
            {renderQuitButton("w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-slate-800/70 transition-all active:scale-90 backdrop-blur-sm")}
          </div>
        )}

        {renderQuitModal()}


        {/* Bus Cards */}
        <div className="flex-1 relative flex items-center bg-black/90 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black/40 to-transparent pointer-events-none"></div>
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black via-black/40 to-transparent pointer-events-none" />
          <div
            ref={busScrollRef}
            className="w-full overflow-x-auto flex items-center px-[40vw] gap-6 snap-x snap-mandatory scroll-smooth no-scrollbar h-full py-10"
          >
            {busCardStates.map(({ card, index, isBase, isHistory, isReference, isFocused, isRevealed, containerClass, isWrong }) => (
              <div
                key={`${card.id}-${index}`}
                ref={el => busCardRefs.current[index] = el}
                className={`relative flex-none flex flex-col items-center justify-center transition-all duration-700 snap-center ${containerClass}`}
              >
                {isBase && !isBusWon && <span className="absolute -top-10 text-xs text-slate-500 uppercase font-black tracking-widest">{t("Start")}</span>}

                <PlayingCard
                  card={card}
                  isFaceDown={!isRevealed}
                  size="md"
                  style={settings.cardStyle}
                  highlight={!isBusWon && (isReference || isWrong || isFocused)}
                  className={
                    isBusWon
                      ? 'ring-2 ring-amber-300 shadow-[0_0_15px_rgba(250,204,21,0.5)] border border-white/40 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-[1px]'
                      : `${isHistory && !isReference && !isBusWon ? 'grayscale' : ''} ${isWrong ? 'ring-4 ring-red-600 shadow-[0_0_60px_rgba(220,38,38,0.7)]' : ''} ${isFocused ? 'scale-[1.03] ring-2 ring-red-300/70' : ''} border border-white/40 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-[1px]`}
                />

                {/* Icons */}
                {isHistory && index > 0 && !isReference && !isBusWon && (
                  <div className="absolute -bottom-4 bg-emerald-500 rounded-full p-1.5 shadow-lg z-20 border-2 border-black">
                    <Check size={16} className="text-white" strokeWidth={4} />
                  </div>
                )}
                {isWrong && !isBusWon && (
                  <div className="absolute -bottom-4 bg-red-600 rounded-full p-1.5 shadow-lg animate-ping z-20 border-2 border-black">
                    <X size={16} className="text-white" strokeWidth={4} />
                  </div>
                )}
                {isBusWon && (
                  <div className="absolute -top-16 z-50 animate-[bounce_0.5s_infinite]">
                    <Sparkles className="text-yellow-400 w-12 h-12 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" fill="currentColor" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-none bg-black border-t border-white/10 p-4 pb-8 z-20">
          {feedback && (
            <div className="mb-6 flex justify-center pointer-events-none">
              <div className={`px-8 py-3 rounded-2xl font-black text-lg shadow-2xl border-2 transition-all animate-pop ${feedback.type === 'error' ? 'bg-red-600 text-white border-red-400' : feedback.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-800 text-white border-slate-600'}`}>
                {feedback.text}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            {isBusDeckExhausted ? (
              <div className="text-center w-full text-red-200 font-black text-sm uppercase tracking-[0.2em] bg-red-900/30 border border-red-800 rounded-2xl px-4 py-3">
                {t("Pakje leeg – pak een nieuw deck om verder te gaan")}
              </div>
            ) : busWrongCardIndex === null && !isBusWon ? (
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => handleBusGuess('HIGHER')} className="group flex-1 bg-gradient-to-b from-slate-800 to-slate-900 active:from-slate-900 active:to-black text-white py-6 rounded-2xl font-black border border-slate-700 flex flex-col items-center shadow-lg active:scale-95 transition-all hover:border-green-500">
                    <ChevronUp size={32} className="text-green-400 mb-1 group-hover:scale-125 transition-transform" />
                    <span className="text-sm uppercase tracking-[0.2em]">{t("Hoger")}</span>
                  </button>
                  <button onClick={() => handleBusGuess('LOWER')} className="group flex-1 bg-gradient-to-b from-slate-800 to-slate-900 active:from-slate-900 active:to-black text-white py-6 rounded-2xl font-black border border-slate-700 flex flex-col items-center shadow-lg active:scale-95 transition-all hover:border-red-500">
                    <ChevronDown size={32} className="text-red-400 mb-1 group-hover:scale-125 transition-transform" />
                    <span className="text-sm uppercase tracking-[0.2em]">{t("Lager")}</span>
                  </button>
                </div>
                <button onClick={() => handleBusGuess('EQUAL')} className="w-full bg-slate-800/50 py-3 text-xs font-bold rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors active:scale-95">{t("GELIJK")}</button>
              </div>
            ) : isBusWon ? (
              <button
                onClick={() => { prepareAdInterstitial(ADMOB_INTERSTITIAL_LEADERBOARD_UNIT_ID); setPhase(GamePhase.GAME_OVER); }}
                className="w-full text-amber-950 text-xl sm:text-2xl font-black px-8 sm:px-14 py-5 rounded-[2rem] border-4 border-amber-300/50 shadow-[0_0_60px_rgba(251,191,36,0.6)] flex items-center justify-center gap-4 transition-all active:scale-95 animate-bounce-subtle"
                style={{
                  background: 'linear-gradient(90deg, #fcd34d, #f59e0b, #fbbf24, #fcd34d)',
                  backgroundSize: '200% 200%',
                  animation: 'end-gradient 3s linear infinite',
                }}
              >
                {t("Naar het Einde")} <ArrowRight size={28} strokeWidth={3} />
              </button>
            ) : (
              <div className="text-center w-full text-red-600 font-black text-xl animate-pulse uppercase tracking-widest">
              </div>
            )}
          </div>
        </div>
      </RootContainer>
    );
  }

  // 7. GAME OVER
  if (phase === GamePhase.GAME_OVER) {
    return (
      <RootContainer className="p-0" theme={settings.theme}>
        <Confetti />
        <div className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="text-center mb-10 mt-8">
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter drop-shadow-xl">{t("Uitslag")}</h1>
            {immunePlayerId && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 inline-flex items-center gap-3 mt-4">
                <Shield size={20} className="text-yellow-400" />
                <div>
                  <p className="text-yellow-400 text-[10px] font-black uppercase leading-none tracking-widest mb-1">{t("Immuniteit")}</p>
                  <p className="text-white font-bold text-lg leading-none">{players.find(p => p.id === immunePlayerId)?.name}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden mb-8 shadow-2xl">
            <div className="grid grid-cols-12 bg-black/40 p-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-7">{t("Speler")}</div>
              <div className="col-span-4 text-right">{t("Slokken")}</div>
            </div>
            {sortedPlayers.map((p, i) => (
              <div key={p.id} className={`grid grid-cols-12 p-4 items-center border-b border-white/5 ${p.id === immunePlayerId ? 'bg-yellow-500/10' : ''}`}>
                <div className="col-span-1 text-center font-black text-slate-500 text-lg">{i + 1}</div>
                <div className="col-span-7 font-bold text-white text-base truncate flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0 border border-white/10">
                    {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : null}
                  </div>
                  {p.name}
                  {p.id === immunePlayerId && <Shield size={14} className="text-yellow-400" />}
                </div>
                <div className="col-span-4 text-right font-mono text-red-400 font-black text-lg drop-shadow-md">
                  {p.drinksTaken}
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleGameOverContinue} className="w-full bg-white text-black py-5 rounded-2xl font-black shadow-[0_0_30px_rgba(255,255,255,0.3)] text-lg uppercase tracking-widest hover:scale-105 transition-transform active:scale-95">
            {t("Terug naar Menu")}
          </button>
        </div>
      </RootContainer>
    );
  }

  // This fallthrough renders when in results or other unhandled states
  return (
    <>
      {renderQuitModal()}
      {renderDeckPreview()}
    </>
  );
};

export default App;
