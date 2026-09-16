import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, useTransition } from 'react';
import { useGameEngine, GameEngineEvent } from './hooks/useGameEngine';
import { usePlayerState } from './hooks/usePlayerState';
import { useGameStore } from './src/store/gameStore';
import { Card, GamePhase, Player, Rank, RoundStep, Suit, GameMode, GameSettings, CardStyle, UITheme } from './types';
import PlayingCard from './components/PlayingCard';
import SettingsPanel from './components/SettingsPanel';
import { PlayerList } from './components/PlayerList';
import MetroBackgroundAnimated from './components/MetroBackground';
import { Users, Beer, Play, Settings, Check, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trophy, ArrowLeft, ArrowRight, Shield, ThumbsUp, ThumbsDown, Sparkles, Camera as CameraIcon, Zap, Skull, HeartPulse, BusFront, Bus, Image as ImageIcon, ArrowUpDown, GripVertical, Pencil, Plus, Trash2, RotateCcw, Video, Eye, Clapperboard, RefreshCw, Pipette, Minimize2, Maximize2, Equal, Shuffle, Target, Lock, Star, Gift } from 'lucide-react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { AdMob, RewardAdOptions, AdMobRewardItem, AdOptions, AdLoadInfo } from '@capacitor-community/admob';
import { StatusBar } from '@capacitor/status-bar';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { triggerHaptic } from './services/haptics';
import './styles/animations.css';

import { getSuitSymbol, getRankChar, getRankString, getFullRankName, ALL_SUITS, PREVIEW_CARD, createDeck, shuffleDeck } from './src/lib/utils/deck';
import { createOscillatorSound, SoundEffect } from './src/lib/utils/audio';
import { resizeImage, cropToSquareDataUrl } from './src/lib/utils/image';
import { Confetti } from './src/components/backgrounds/Confetti';
import { CalmBackground } from './src/components/backgrounds/CalmBackground';
import { BeerBackground } from './src/components/backgrounds/BeerBackground';
import { GalaxyBackground } from './src/components/backgrounds/GalaxyBackground';
import { PlayerAvatar } from './src/components/ui/PlayerAvatar';
import { ThemeLabel, ThemeHeader } from './src/components/ui/ThemeComponents';

import { useTranslation, currentLanguage, setLanguage } from "./i18n";
import { useAudio } from './hooks/useAudio';
import { useThrottledResize } from './hooks/useThrottledResize';
import { CURRENT_APP_VERSION, PATCH_NOTES_SEEN_KEY, getPatchNotesList, hasPatchNotes } from './services/patchNotes';
import { QuitConfirmModal } from './components/modals/QuitConfirmModal';
import { ColorPickerModal } from './components/modals/ColorPickerModal';
import { PhotoOptionsModal } from './components/modals/PhotoOptionsModal';
import { PatchNotesModal } from './components/modals/PatchNotesModal';
import { HardBusWarningModal } from './components/modals/HardBusWarningModal';
import { AdLoadingModal } from './components/modals/AdLoadingModal';
import { SlideMenuModal } from './components/modals/SlideMenuModal';
import { PyramidMatchModal } from './components/modals/PyramidMatchModal';
import { GalaxyCelebrationModal } from './components/modals/GalaxyCelebrationModal';
import { AnimatedPartyBus } from './components/AnimatedPartyBus';
import { ScrollIndicatorContainer, getThemeScrollColors } from './src/components/ui/ScrollIndicatorContainer';
const ADMOB_APP_ID = import.meta.env.VITE_ADMOB_APP_ID || 'ca-app-pub-3940256099942544~3347511713';
const ADMOB_INTERSTITIAL_QUIT_UNIT_ID = import.meta.env.VITE_ADMOB_INTERSTITIAL_QUIT_UNIT_ID || 'ca-app-pub-3940256099942544/1033173712';
const ADMOB_INTERSTITIAL_LEADERBOARD_UNIT_ID = import.meta.env.VITE_ADMOB_INTERSTITIAL_LEADERBOARD_UNIT_ID || 'ca-app-pub-3940256099942544/1033173712';
const ADMOB_REWARDED_UNIT_ID = import.meta.env.VITE_ADMOB_REWARDED_UNIT_ID || 'ca-app-pub-3940256099942544/5224354917';
const INTERSTITIAL_PLACEMENT = 'post_leaderboard_continue'; // Placement: after leaderboard, at end of round
// --- HELPERS ---
const PlayingCardIcon: React.FC<{ className?: string; size?: number }> = ({ className = "", size = 14 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="7" y="7" width="13" height="14" rx="1.5" className="opacity-60" />
    <rect x="4" y="4" width="13" height="14" rx="1.5" fill="currentColor" stroke="none" />
    <rect x="4" y="4" width="13" height="14" rx="1.5" />
  </svg>
);
// --- CONSTANTS & PHRASES ---
const DEFAULT_SUCCESS_PHRASES_NL = [
  "Vo!", "Hoppa!", "👨‍🍳👨‍🍳", "Strijder!",
  "Netjes!", "dat is m!", "Biem!", "Jaja!",
  "locked in,", "Heerlijk!", "top!", "insane!",
  "keurig,", "clean.", "bam!",
  "big brain,", "slayy,"
];
const DEFAULT_FAILURE_PHRASES_NL = [
  "Helaas pindakaas!", "Zuur!", "Aii,",
  "jezus alweer??", "waarom ben je zo slecht,", "skill issue,",
  "Dom dom dom!", "Pech gehad!", "Oef...", "Foutje,",
  "lol,", "ha bier,", "maat..",
  "Huilie huilie!", "zo slecht!", "Niet te geloven!", "Incapabele ziel.."
];
const DEFAULT_LOSER_TITLES_NL = [
  "🍺🍺🍺", "De Lul", "L gepakt", "hahaha",
  "🧌🧌", "Succes Vriend", "ai ai ai", "daar ga je",
  "💀💀", "🤡🤡", "zo slecht", "Kansloos",
  "Proost!"
];
const DEFAULT_SUCCESS_PHRASES_EN = [
  "Nice!", "Boom!", "👨‍🍳👨‍🍳", "Warrior!",
  "Clean!", "that's it!", "Bam!", "Yes sir!",
  "locked in,", "Lovely!", "perfect!", "insane!",
  "neat,", "clean.", "bam!",
  "big brain,", "slayy,"
];
const DEFAULT_FAILURE_PHRASES_EN = [
  "Bad luck!", "Ouch!", "Aii,",
  "lord, again??", "why are you so bad,", "skill issue,",
  "Stupid!", "Out of luck!", "Oof...", "My bad,",
  "lol,", "ha beer,", "mate..",
  "Crybaby!", "so bad!", "Unbelievable!", "Incapable soul.."
];
const DEFAULT_LOSER_TITLES_EN = [
  "🍺🍺🍺", "The Loser", "Caught the L", "hahaha",
  "🧌🧌", "Good luck friend", "ai ai ai", "there you go",
  "💀💀", "🤡🤡", "so bad", "Hopeless",
  "Cheers!"
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
const PLAYER_DATA_KEY = 'bus-app-player-data-v1';
const GAME_STATE_KEY = 'bus-app-game-state-v1';
const PYRAMID_INSTRUCTIONS_COLLAPSED_KEY = 'bus-app-pyramid-instructions-collapsed-v1';
const BUS_INSTRUCTIONS_COLLAPSED_KEY = 'bus-app-bus-instructions-collapsed-v1';
const GAME_SETTINGS_KEY = 'bus-app-game-settings-v1';
const GALAXY_UNLOCKED_KEY = 'bus-app-galaxy-unlocked-v1';
const AVATAR_COLORS = [
  '#e11d48', // rose
  '#f97316', // orange
  '#eab308', // amber
  '#22c55e', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
  '#f43f5e', // coral
] as const;
const PATCH_NOTES_VERSION = CURRENT_APP_VERSION;
const storageAvailable = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
const queueStorageWrite = (key: string, value: string, label: string) => {
  if (!storageAvailable) return;
  const write = () => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
    }
  };
  const requester = (window as typeof window & { requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number }).requestIdleCallback;
  if (typeof requester === 'function') {
    requester(() => write(), { timeout: 500 });
  } else {
    setTimeout(write, 0);
  }
};
// --- COMPONENTS ---
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
const GlobalAnimations = () => null;
// --- AMBIENT BACKGROUND COMPONENTS ---
/** Unified Player Avatar component */
const MetroBackground = MetroBackgroundAnimated;
/** Dramatic transition overlay for when someone goes to the bus */
/** Dramatic, cinematic transition overlay for when someone goes to the bus */
const BusTransitionOverlay: React.FC<{
  loserReveal: { player: Player; title: string } | null;
  isBusEntrance: boolean;
  busPassengers: Player[];
  t: (key: string) => string;
  theme?: UITheme;
}> = ({ loserReveal, isBusEntrance, busPassengers, t, theme = UITheme.CLASSIC }) => {
  if (!loserReveal && !isBusEntrance) return null;

  const isStars = theme === UITheme.STARS;
  const passengers = loserReveal ? [loserReveal.player] : busPassengers;
  const isDuo = !loserReveal && isBusEntrance && busPassengers.length >= 2;
  const headline = loserReveal 
    ? loserReveal.title 
    : (isDuo ? t("Samen in de bus!") : t("Naar de Bus!"));

  const destinationText = loserReveal
    ? loserReveal.player.name
    : (isDuo ? t("SAMEN") : t("DE BUS"));

  return (
    <div 
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none" 
    >
      {/* Cinematic Dark Stage Background with Deep Void Vignette */}
      <div className="absolute inset-0 bg-black/95 animate-in fade-in duration-500">
        <div className={`absolute inset-0 ${
          isStars 
            ? 'bg-[radial-gradient(circle_at_center,rgba(226,232,240,0.12)_0%,rgba(15,23,42,0.8)_60%,black_95%)]' 
            : 'bg-[radial-gradient(circle_at_center,rgba(185,28,28,0.3)_0%,rgba(15,23,42,0.6)_60%,black_90%)]'
        } pointer-events-none`} />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-slate-950/80 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-lg mx-auto">
        {/* Top Eyebrow / Loser Title Phrase */}
        <div className="text-center mb-2 sm:mb-4 animate-in fade-in zoom-in-95 duration-500">
          <h2 className={`text-2xl sm:text-4xl font-black uppercase tracking-[0.15em] ${
            isStars ? 'text-slate-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'text-amber-300 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]'
          }`}>
            {headline}
          </h2>
          {isDuo && (
            <p className="text-slate-300 text-xs sm:text-sm font-bold uppercase tracking-widest mt-1">
              {busPassengers.map(p => p.name).join(' & ')} {t("gaan samen in de bus.")}
            </p>
          )}
        </div>

        {/* Centerpiece: The Animated Party Bus with Real Moving Parts! */}
        <div className="w-full flex justify-center my-1 sm:my-2">
          <AnimatedPartyBus 
            passengers={passengers} 
            destinationText={destinationText} 
            theme={theme}
          />
        </div>

        {/* Bottom Punchy Party Banner (Impacts on center brake) */}
        <div className="animate-bus-stamp flex flex-col items-center mt-3 sm:mt-5">
          <div className={`p-1 rounded-2xl ${isStars ? 'bg-gradient-to-r from-slate-200 via-amber-200 to-slate-200 shadow-[0_0_35px_rgba(226,232,240,0.35)]' : 'bg-gradient-to-r from-red-600 via-amber-400 to-red-600 shadow-[0_0_35px_rgba(239,68,68,0.5)]'}`}>
            <div className={`px-8 sm:px-12 py-3 sm:py-3.5 ${isStars ? 'bg-[#06080f]/95 border-white/20 border-t-white/40 shadow-[inset_0_0_20px_rgba(255,255,255,0.06)]' : 'bg-black/90 border-white/10'} rounded-[calc(1rem-4px)] flex items-center justify-center gap-3 border`}>
              <Bus size={22} className={`${isStars ? 'text-amber-200 drop-shadow-[0_0_8px_rgba(254,240,138,0.8)]' : 'text-amber-400'} shrink-0`} />
              <span className={`text-xl sm:text-3xl font-black ${isStars ? 'text-slate-100 tracking-[0.25em]' : 'text-white tracking-[0.2em]'} uppercase drop-shadow-md`}>
                {isDuo ? t("Samen in de bus!") : t("Naar de Bus!")}
              </span>
              <Bus size={22} className={`${isStars ? 'text-amber-200 drop-shadow-[0_0_8px_rgba(254,240,138,0.8)]' : 'text-amber-400'} shrink-0`} />
            </div>
          </div>
          
          {/* Player Name Display below badge */}
          <div className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider drop-shadow-lg mt-3 text-center">
            {passengers.map(p => p.name).join(' & ')}
          </div>
        </div>
      </div>
    </div>
  );
};
const PersistentBackground: React.FC<{ 
  theme: UITheme; 
  style?: React.CSSProperties; 
  isDiscoActive?: boolean;
  showTexture?: boolean;
  calmAccentColor?: string;
}> = ({ theme, style, isDiscoActive, showTexture = true, calmAccentColor }) => {
  let bgClass = 'bg-animated-gradient';
  let additionalStyles: React.CSSProperties = {};
  if (isDiscoActive) {
    bgClass = '';
    additionalStyles = {
      background: 'linear-gradient(135deg, #a855f7, #6366f1, #3b82f6, #10b981, #f59e0b, #ef4444, #a855f7)',
      animation: 'slow-hue-rotate 5s linear infinite',
      opacity: 1,
    };
  }
  const finalStyle = { ...additionalStyles, ...style };
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden isolate">
      {/* 1. Base Color Layer */}
      <div className={`absolute inset-0 transition-all duration-100 ${bgClass}`} style={finalStyle} />
      
      {/* 2. Theme Specific Elements (Metro Map, etc) - Hidden during Disco */}
      <div className={`absolute inset-0 transition-opacity duration-100 ${isDiscoActive ? 'opacity-0' : 'opacity-100'}`}>
        {theme === UITheme.CALM && <CalmBackground accentColor={calmAccentColor} />}
        {theme === UITheme.BEER && <BeerBackground />}
        {theme === UITheme.METRO && <MetroBackground />}
        {theme === UITheme.STARS && <GalaxyBackground />}
      </div>
      {/* 3. Global Texture Overlay */}
      {showTexture && (
        <div 
          className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </div>
  );
};
const RootContainer: React.FC<RootContainerProps> = ({ children, className = '', shake = false, variant = 'default', isDiscoActive = false, style, disableBaseBg = false, showTexture = true, disableSafeTop = false, showChest = false, theme = UITheme.CLASSIC }) => {
  const { t, lang } = useTranslation();
  const [showPatchChest, setShowPatchChest] = useState(() => {
    if (!hasPatchNotes(currentLanguage)) return false;
    if (!storageAvailable) return true;
    try {
      return localStorage.getItem(PATCH_NOTES_SEEN_KEY) !== PATCH_NOTES_VERSION;
    } catch {
      return true;
    }
  });
  const [isPatchNotesOpen, setIsPatchNotesOpen] = useState(false);
  const patchNotes = useMemo(() => getPatchNotesList(lang), [lang]);
  const openPatchNotes = useCallback(() => {
    setIsPatchNotesOpen(true);
    setShowPatchChest(false);
    if (!storageAvailable) return;
    try {
      localStorage.setItem(PATCH_NOTES_SEEN_KEY, PATCH_NOTES_VERSION);
    } catch (error) {
    }
  }, []);
  const combinedStyles = { ...style }; // Remove additionalStyles here as they moved to PersistentBackground
  const isAndroid = Capacitor.getPlatform() === 'android';
  const safeTopPadding = isAndroid ? 'max(env(safe-area-inset-top, 0px), 16px)' : 'env(safe-area-inset-top, 0px)';
  const containerPaddingTop = disableSafeTop ? '0px' : safeTopPadding;
  const finalStyle = {
    paddingTop: containerPaddingTop,
    '--safe-top': safeTopPadding,
    ...combinedStyles,
  } as React.CSSProperties;
  return (
    <div className={`h-[100dvh] w-full flex flex-col overflow-hidden relative isolate bg-transparent ${className} ${shake ? 'animate-shake' : ''}`} style={finalStyle}>
      <GlobalAnimations />
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
      <PatchNotesModal
        isOpen={isPatchNotesOpen}
        version={PATCH_NOTES_VERSION}
        patchNotes={patchNotes}
        t={t}
        theme={theme}
        onClose={() => setIsPatchNotesOpen(false)}
      />
      {children}
    </div>
  );
};
const hexToHue = (hex: string): number => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) return 43; // Default gold hue
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return Math.round(h * 360);
};
const hexToHsl = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) return { h: 43, s: 95, l: 65 };
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};
const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

interface CalmAccentColorPickerProps {
  accentColor: string;
  onColorChange: (newColor: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  t: (key: string) => string;
}

const CalmAccentColorPicker: React.FC<CalmAccentColorPickerProps> = React.memo(({
  accentColor,
  onColorChange,
  isOpen,
  onToggleOpen,
  onClose,
  t
}) => {
  const presets = [
    { name: t('Lichtrood'), value: '#fb7185' },
    { name: t('Goud'), value: '#fbcd53' },
    { name: t('Periwinkle'), value: '#818cf8' },
    { name: t('Munt'), value: '#2dd4bf' },
  ];

  const presetValues = ['#fb7185', '#fbcd53', '#818cf8', '#2dd4bf'];
  const isCustomActive = !presetValues.includes((accentColor || '#fb7185').toLowerCase());
  const isPickerSelected = isCustomActive || isOpen;

  const lastCustomHue = useRef<number>(
    isCustomActive ? hexToHsl(accentColor || '#fb7185').h : 280
  );

  const [hue, setHue] = useState<number>(() => {
    if (isCustomActive) return hexToHsl(accentColor || '#fb7185').h;
    return lastCustomHue.current;
  });

  // Track the actual committed color for the pipette button
  const [committedColor, setCommittedColor] = useState<string>(() => accentColor || '#fb7185');

  // Preview hue for the slider thumb ONLY while sliding
  const [thumbHue, setThumbHue] = useState<number>(() => hue);

  const lastCommittedColor = useRef<string>(accentColor || '#fb7185');
  const lastHapticHue = useRef<number>(hue);
  const inputRef = useRef<HTMLInputElement>(null);
  const [shouldAnimateEntry, setShouldAnimateEntry] = useState(false);

  useEffect(() => {
    const col = accentColor || '#fb7185';
    const isCustom = !presetValues.includes(col.toLowerCase());
    if (isCustom) {
      const h = hexToHsl(col).h;
      lastCustomHue.current = h;
      setHue(h);
      setThumbHue(h);
    }
    setCommittedColor(col);
    lastCommittedColor.current = col;
  }, [accentColor]);

  const applyColorDirect = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    const rgb = result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 251, g: 113, b: 133 };

    const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    const btnTextColor = yiq >= 165 ? '#090514' : '#ffffff';
    const root = document.documentElement;
    root.classList.remove('theme-transition');
    root.style.setProperty('--theme-accent', hex);
    root.style.setProperty('--theme-accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
    root.style.setProperty('--theme-btn-bg', hex);
    root.style.setProperty('--theme-btn-text', btnTextColor);
    root.style.setProperty('--theme-btn-sec-text', hex);
    root.style.setProperty('--theme-card-border', `1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
  };

  // While sliding: update ONLY the local slider thumb hue.
  // ABSOLUTELY NO color changes to app, theme, pipette button, or settings!
  const handleSliderInput = (e: React.FormEvent<HTMLInputElement>) => {
    const val = Number((e.target as HTMLInputElement).value);
    setHue(val);
    setThumbHue(val);
    lastCustomHue.current = val;

    if (Math.abs(val - lastHapticHue.current) >= 30) {
      triggerHaptic('subtle');
      lastHapticHue.current = val;
    }
  };

  // ONLY ON RELEASE: apply color to app theme, pipette button, and persist to settings!
  const commitColor = (val: number) => {
    const newColor = hslToHex(val, 80, 75);
    setHue(val);
    setThumbHue(val);
    setCommittedColor(newColor);
    lastCustomHue.current = val;
    if (lastCommittedColor.current.toLowerCase() === newColor.toLowerCase()) return;
    lastCommittedColor.current = newColor;
    applyColorDirect(newColor);
    onColorChange(newColor);
    triggerHaptic('subtle');
  };

  // Native HTML DOM 'change' event fires ONLY when slider is released (unlike React synthetic onChange)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const handleNativeChange = () => {
      commitColor(Number(el.value));
    };
    el.addEventListener('change', handleNativeChange);
    return () => {
      el.removeEventListener('change', handleNativeChange);
    };
  }, []);

  const handlePresetSelect = (presetHex: string) => {
    setShouldAnimateEntry(false);
    onClose(); // Hide bar when preset is selected!
    lastCommittedColor.current = presetHex;
    setCommittedColor(presetHex);
    applyColorDirect(presetHex);
    onColorChange(presetHex);
    triggerHaptic('subtle');
  };

  const handlePickerButtonClick = () => {
    if (isPickerSelected && isOpen) {
      setShouldAnimateEntry(false);
      onToggleOpen();
    } else {
      setShouldAnimateEntry(true);
      onToggleOpen();
      if (!isCustomActive) {
        const customHex = hslToHex(lastCustomHue.current, 80, 75);
        setHue(lastCustomHue.current);
        setThumbHue(lastCustomHue.current);
        setCommittedColor(customHex);
        lastCommittedColor.current = customHex;
        applyColorDirect(customHex);
        onColorChange(customHex);
      }
      triggerHaptic('subtle');
    }
  };

  // Bar should ONLY show when picker color is selected!
  const isBarVisible = isPickerSelected && isOpen;

  return (
    <div className="flex flex-col bg-slate-800/70 p-2.5 rounded-2xl border border-slate-700/50 gap-2.5">
      <div className="flex justify-between items-center">
        {presets.map(colorOpt => {
          const isColorActive = !isPickerSelected && (accentColor || '#fb7185').toLowerCase() === colorOpt.value.toLowerCase();
          return (
            <button
              key={colorOpt.value}
              onClick={() => handlePresetSelect(colorOpt.value)}
              title={colorOpt.name}
              className={`w-8 h-8 rounded-full relative transition-all active:scale-90 border-2 ${
                isColorActive ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: colorOpt.value }}
            >
              {isColorActive && (
                <span className="absolute inset-0 flex items-center justify-center text-slate-950 font-bold text-xs">✓</span>
              )}
            </button>
          );
        })}
        {/* Custom Color Picker Button */}
        <button
          onClick={handlePickerButtonClick}
          title={t('Aangepast')}
          className={`w-8 h-8 rounded-full relative transition-all active:scale-90 border-2 flex items-center justify-center ${
            isPickerSelected ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'border-transparent opacity-60 hover:opacity-100'
          }`}
          style={{ backgroundColor: committedColor }}
        >
          <Pipette size={12} className="text-slate-950" />
        </button>
      </div>

      {/* Expandable Thin Horizontal Bar Slider - ONLY shown when picker color is selected */}
      {isBarVisible && (
        <div className={`pt-2 pb-1 px-1 border-t border-slate-700/40 ${shouldAnimateEntry ? 'animate-hand-tray-enter' : ''}`}>
          <div className="relative w-full flex items-center h-6">
            <div 
              className="w-full h-2.5 rounded-full border border-white/20 shadow-inner pointer-events-none"
              style={{
                background: 'linear-gradient(to right, hsl(0, 80%, 75%), hsl(30, 80%, 75%), hsl(60, 80%, 75%), hsl(90, 80%, 75%), hsl(120, 80%, 75%), hsl(150, 80%, 75%), hsl(180, 80%, 75%), hsl(210, 80%, 75%), hsl(240, 80%, 75%), hsl(270, 80%, 75%), hsl(300, 80%, 75%), hsl(330, 80%, 75%), hsl(360, 80%, 75%))',
              }}
            />
            <input
              ref={inputRef}
              type="range"
              min="0"
              max="360"
              value={hue}
              style={{ '--calm-thumb-color': hslToHex(thumbHue, 80, 75) } as React.CSSProperties}
              onInput={handleSliderInput}
              onChange={handleSliderInput}
              onPointerUp={(e) => commitColor(Number((e.target as HTMLInputElement).value))}
              onMouseUp={(e) => commitColor(Number((e.target as HTMLInputElement).value))}
              onTouchEnd={(e) => commitColor(Number((e.target as HTMLInputElement).value))}
              onKeyUp={(e) => commitColor(Number((e.target as HTMLInputElement).value))}
              className="calm-hue-slider absolute inset-0 w-full h-full cursor-pointer touch-none"
            />
          </div>
        </div>
      )}
    </div>
  );
});

// --- APP COMPONENT ---
const App: React.FC = () => {
  const [isPending, startTransition] = useTransition();
  const { t, lang, setLanguage } = useTranslation();
  
  // Phase 3: Web Worker Instantiation
  const engineWorker = useRef<Worker | null>(null);
  useEffect(() => {
    engineWorker.current = new Worker(new URL('./src/workers/engine.worker.ts', import.meta.url), { type: 'module' });
    engineWorker.current.onmessage = (e) => {
      if (e.data.type === 'DECK_SHUFFLED') {
         console.log("Worker shuffled deck securely in background");
      }
    };
    return () => {
      engineWorker.current?.terminate();
    };
  }, []);

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
      cardStyle: CardStyle.DARK,
      doublePyramidCards: true,
      theme: UITheme.CALM,
      calmAccentColor: '#fb7185',
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
      localStorage.removeItem(GAME_SETTINGS_KEY);
    }
    return defaultSettings;
  });
  // Guarantee settings are immediately persisted to localStorage on every change
  useEffect(() => {
    if (!storageAvailable) return;
    try {
      localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
    }
  }, [settings]);
  const renderUnlockModal = ({
    isOpen,
    onClose,
    title,
    description,
    onUnlock,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: React.ReactNode;
    onUnlock: () => Promise<void> | void;
  }) => {
    if (!isOpen) return null;
    return (
      <SlideMenuModal
        isOpen={isOpen}
        onClose={onClose}
        zIndex="z-[200]"
        className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col items-center text-center relative"
        backdropClassName="p-4 bg-black/70 backdrop-blur-md"
      >
        {({ close }) => (
          <div className="pt-10 pb-6 px-8 flex flex-col items-center">
            {/* Reward Icon / Graphic */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-xl relative z-10 border border-amber-200/50">
                <Clapperboard size={48} className="text-amber-950" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
              {title}
            </h3>
            
            <p className="text-slate-400 text-sm leading-relaxed mb-8 px-2">
              {description}
            </p>
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={async () => {
                  close();
                  await onUnlock();
                }}
                className="w-full py-5 bg-gradient-to-r from-amber-400 to-amber-600 text-amber-950 font-black rounded-2xl shadow-[0_8px_0_rgb(180,83,9)] hover:brightness-110 active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest flex items-center justify-center gap-3 no-calm-override cursor-pointer"
              >
                <Play size={22} fill="currentColor" /> {t("Video Kijken")}
              </button>
              
              <button
                onClick={close}
                className="w-full py-4 text-slate-500 font-bold hover:text-white transition-colors cursor-pointer"
              >
                {t("Nee bedankt")}
              </button>
            </div>
          </div>
        )}
      </SlideMenuModal>
    );
  };

  const renderStyleUnlockModal = () => {
    if (!styleToUnlock) return null;
    const styleName = styleToUnlock === CardStyle.MODERN ? "Modern" :
                      styleToUnlock === CardStyle.DARK ? "Donker" :
                      styleToUnlock === CardStyle.CLASSIC ? "Klassiek" :
                      styleToUnlock === CardStyle.GALAXY ? "Galaxy" : "Neon";
    return renderUnlockModal({
      isOpen: !!styleToUnlock,
      onClose: () => setStyleToUnlock(null),
      title: t("Stijl Wisselen"),
      description: (
        <>
          {t("Kijk een korte video om direct over te schakelen naar de")}{" "}
          <span className="text-amber-400 font-bold">{t(styleName)}</span>{" "}
          {t("stijl!")}
        </>
      ),
      onUnlock: async () => {
        const style = styleToUnlock;
        setStyleToUnlock(null);
        const played = await showRewardedAd();
        if (played) {
          const n = { ...settings, cardStyle: style };
          setSettings(n);
          queueStorageWrite(GAME_SETTINGS_KEY, JSON.stringify(n), 'instellingen');
          triggerHaptic('heavy');
          handleDeckPreviewBack();
        }
      },
    });
  };

  const renderThemeUnlockModal = () => {
    if (!themeToUnlock) return null;
    const themeName = themeToUnlock === UITheme.CLASSIC ? "Klassiek" :
                      themeToUnlock === UITheme.METRO ? "Bus" :
                      themeToUnlock === UITheme.CALM ? "Rustig" :
                      themeToUnlock === UITheme.STARS ? "Sterren" : "Bier";
    return renderUnlockModal({
      isOpen: !!themeToUnlock,
      onClose: () => setThemeToUnlock(null),
      title: t("Thema Wisselen"),
      description: (
        <>
          {t("Kijk een korte video om direct over te schakelen naar het")}{" "}
          <span className="text-amber-400 font-bold">{t(themeName)}</span>{" "}
          {t("thema!")}
        </>
      ),
      onUnlock: async () => {
        const theme = themeToUnlock;
        setThemeToUnlock(null);
        const played = await showRewardedAd();
        if (played) {
          const n = { ...settings, theme };
          setSettings(n);
          queueStorageWrite(GAME_SETTINGS_KEY, JSON.stringify(n), 'instellingen');
          triggerHaptic('heavy');
        }
      },
    });
  };
  // Sample cards for Deck Style Preview (uses same UI as Berichten)
  const PREVIEW_SAMPLE_CARDS: Card[] = useMemo(() => [
    { suit: Suit.HEARTS, rank: Rank.ACE, id: 'p1' },
    { suit: Suit.HEARTS, rank: Rank.KING, id: 'p2' },
    { suit: Suit.DIAMONDS, rank: Rank.QUEEN, id: 'p3' },
    { suit: Suit.CLUBS, rank: Rank.JACK, id: 'p4' },
    { suit: Suit.SPADES, rank: Rank.TEN, id: 'p5' },
  ], []);

  // Quit confirmation state
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(() => {
    const presets = ['#fb7185', '#fbcd53', '#818cf8', '#2dd4bf'];
    return !presets.includes((settings.calmAccentColor || '#fb7185').toLowerCase());
  });
  const [tempColor, setTempColor] = useState('#fb7185');
  // Physical mode info popup state
  const [showPhysicalModeInfo, setShowPhysicalModeInfo] = useState(false);
  const [previewDeckStyle, setPreviewDeckStyle] = useState<CardStyle | null>(null);
  const [isDeckPreviewClosing, setIsDeckPreviewClosing] = useState(false);

  const handleDeckPreviewBack = useCallback(() => {
    if (!previewDeckStyle || isDeckPreviewClosing) return;
    setIsDeckPreviewClosing(true);
    triggerHaptic('tick');
    setTimeout(() => {
      setPreviewDeckStyle(null);
      setIsDeckPreviewClosing(false);
    }, 140);
  }, [previewDeckStyle, isDeckPreviewClosing]);

  const [styleToUnlock, setStyleToUnlock] = useState<CardStyle | null>(null);
  const [themeToUnlock, setThemeToUnlock] = useState<UITheme | null>(null);
  const { players, setPlayers, addPlayer: addPlayerToEngine, removePlayer: removePlayerFromEngine, updatePlayer, updatePlayers, reorderPlayers } = usePlayerState();
  const { phase, transitionToPhase: setPhase, dispatch: dispatchGameEvent, registerEventHandler: registerGameEventHandler, schedule: scheduleGameEvent } = useGameEngine(GamePhase.SETUP);
  const [deck, setDeck] = useState<Card[]>([]);
  const [immunePlayerId, setImmunePlayerId] = useState<string | null>(null);
  const [busPassengers, setBusPassengers] = useState<Player[]>([]);
  const [devModeArmed, setDevModeArmed] = useState(false);
  const [headerArmed, setHeaderArmed] = useState(false);
  const [iconArmed, setIconArmed] = useState(false);
  const headerPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const iconPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const avatarPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleHeaderPointerDown = useCallback(() => {
    headerPressTimerRef.current = setTimeout(() => {
      setHeaderArmed(true);
      triggerHaptic('heavy');
      if (phase !== GamePhase.SETUP) {
        setDevModeArmed(true);
      }
      if (phase === GamePhase.THE_BUS || phase === GamePhase.BUS_TEAM_SELECTION) {
        if (busPassengers.length > 0) {
          const anyDev = busPassengers.some(p => p.isDev);
          busPassengers.forEach(p => {
            updatePlayer(p.id, prev => ({ ...prev, isDev: !anyDev }));
          });
        } else if (players.length > 0) {
          updatePlayer(players[0].id, prev => ({ ...prev, isDev: !prev.isDev }));
        }
        triggerHaptic('success');
      }
    }, 1500);
  }, [phase, busPassengers, players, updatePlayer, triggerHaptic]);
  const handleHeaderPointerUpOrLeave = useCallback(() => {
    if (headerPressTimerRef.current) clearTimeout(headerPressTimerRef.current);
  }, []);
  const handleIconPointerDown = useCallback(() => {
    iconPressTimerRef.current = setTimeout(() => {
      setIconArmed(true);
      triggerHaptic('heavy');
    }, 1500);
  }, [triggerHaptic]);
  const handleIconPointerUpOrLeave = useCallback(() => {
    if (iconPressTimerRef.current) clearTimeout(iconPressTimerRef.current);
  }, []);
  useEffect(() => {
    if (phase === GamePhase.SETUP) {
      if (headerArmed && iconArmed) {
        setDevModeArmed(true);
        triggerHaptic('success');
      }
    }
  }, [headerArmed, iconArmed, phase, triggerHaptic]);
  const handleAvatarPointerDown = useCallback((player: Player) => {
    const isArmed = devModeArmed || (phase === GamePhase.SETUP && headerArmed && iconArmed);
    if (!isArmed) return;
    avatarPressTimerRef.current = setTimeout(() => {
      if (phase === GamePhase.THE_BUS || phase === GamePhase.BUS_TEAM_SELECTION) {
        const anyDev = busPassengers.some(p => p.isDev);
        if (busPassengers.length > 0) {
          busPassengers.forEach(p => {
            updatePlayer(p.id, prev => ({ ...prev, isDev: !anyDev }));
          });
        } else {
          updatePlayer(player.id, p => ({ ...p, isDev: !p.isDev }));
        }
      } else {
        updatePlayer(player.id, p => ({ ...p, isDev: !p.isDev }));
      }
      triggerHaptic('success');
      setDevModeArmed(false);
      setHeaderArmed(false);
      setIconArmed(false);
    }, 1500);
  }, [devModeArmed, headerArmed, iconArmed, phase, busPassengers, updatePlayer, triggerHaptic]);
  const handleAvatarPointerUpOrLeave = useCallback(() => {
    if (avatarPressTimerRef.current) clearTimeout(avatarPressTimerRef.current);
  }, []);
  // Setup State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerImage, setNewPlayerImage] = useState<string | null>(null);
  const canAddPlayer = useMemo(() => {
    const trimmed = newPlayerName.trim();
    return (
      trimmed.length > 0 &&
      players.length < 12 &&
      !players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())
    );
  }, [newPlayerName, players]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMoreSettingsOpen, setIsMoreSettingsOpen] = useState(false);
  const [isGalaxyUnlocked, setIsGalaxyUnlocked] = useState<boolean>(() => {
    if (!storageAvailable) return false;
    try {
      return localStorage.getItem(GALAXY_UNLOCKED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isGalaxyCelebrationOpen, setIsGalaxyCelebrationOpen] = useState(false);
  const [hasStarsLegacyTheme] = useState<boolean>(() => {
    if (settings.theme === UITheme.STARS) return true;
    if (!storageAvailable) return false;
    try {
      const stored = localStorage.getItem(GAME_SETTINGS_KEY);
      if (stored && stored.includes('"theme":"stars"')) return true;
    } catch {}
    return false;
  });
  const [isMatchModalClosing, setIsMatchModalClosing] = useState(false);
  const [lastAddedPlayerId, setLastAddedPlayerId] = useState<string | null>(null);
  // Bus Decks Slider State (More Settings)
  const [draftBusDecks, setDraftBusDecks] = useState<number>(settings.busDecks || 1);
  const [isBusDecksDragging, setIsBusDecksDragging] = useState(false);
  useEffect(() => {
    if (!isBusDecksDragging) {
      setDraftBusDecks(settings.busDecks || 1);
    }
  }, [settings.busDecks, isBusDecksDragging]);
  const handleBusDecksChange = (val: number) => {
    const clamped = Math.max(1, Math.min(5, val));
    const prevRounded = Math.round(draftBusDecks);
    const newRounded = Math.round(clamped);
    if (newRounded !== prevRounded) {
      triggerHaptic('subtle');
    }
    setDraftBusDecks(clamped);
  };
  const handleBusDecksCommit = () => {
    setIsBusDecksDragging(false);
    const rounded = Math.round(draftBusDecks);
    setDraftBusDecks(rounded);
    if (rounded !== (settings.busDecks || 1)) {
      setSettings(prev => ({ ...prev, busDecks: rounded }));
      triggerHaptic('subtle');
    }
  };
  // Dev Tools State
  const [devSettings, setDevSettings] = useState({
    alwaysWin: false,
    forceBusPlayerId: null as string | null,
    peekCards: false
  });
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const [isPhotoOptionsModalOpen, setIsPhotoOptionsModalOpen] = useState(false); // New state for photo options modal
  const [showHardBusWarning, setShowHardBusWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputCameraRef = useRef<HTMLInputElement>(null);
  const adMobReadyRef = useRef(false);
  const lastAdShownRef = useRef<number>(0);
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
  const [isPhraseEditorClosing, setIsPhraseEditorClosing] = useState(false);
  const [editorCategory, setEditorCategory] = useState<PhraseCategory>('success');
  const [editingPhraseText, setEditingPhraseText] = useState('');

  const handlePhraseEditorBack = useCallback(() => {
    if (isPhraseEditorClosing) return;
    setIsPhraseEditorClosing(true);
    triggerHaptic('tick');
    setTimeout(() => {
      setIsPhraseEditorOpen(false);
      setIsPhraseEditorClosing(false);
    }, 140);
  }, [isPhraseEditorClosing]);
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
  const [pendingMatches, setPendingMatches] = useState<{ card: Card, sips: number, matches: { player: Player, count: number, initialCount: number }[], bannerPosition?: 'top' | 'bottom' } | null>(null);
  const [loserReveal, setLoserReveal] = useState<{ player: Player, title: string } | null>(null);
  const [isBusCrashing, setIsBusCrashing] = useState(false);
  const [isBusBraking, setIsBusBraking] = useState(false);
  const [isBusReversing, setIsBusReversing] = useState(false);
  const [isBusPassengerBoarded, setIsBusPassengerBoarded] = useState(false);
  const [isBusChassisBouncing, setIsBusChassisBouncing] = useState(false);
  const [isBusDeparting, setIsBusDeparting] = useState(false);
  const [isBusTransitioning, setIsBusTransitioning] = useState(false);
  const [isBusPaused, setIsBusPaused] = useState(false);
  const [isSharedBusSelecting, setIsSharedBusSelecting] = useState(false);
  const [draggedSharedBusPartnerId, setDraggedSharedBusPartnerId] = useState<string | null>(null);
  const [sharedBusDragPos, setSharedBusDragPos] = useState<{ x: number; y: number } | null>(null);
  const [sharedBusDragTilt, setSharedBusDragTilt] = useState<number>(0);
  const [isHoveredOverBus, setIsHoveredOverBus] = useState<boolean>(false);
  const isHoveredOverBusRef = useRef<boolean>(false);
  const sharedBusDragStartRef = useRef<{ x: number; y: number; playerId: string; isDragging: boolean } | null>(null);
  const sharedBusAnimFrameRef = useRef<number | null>(null);
  const [jumpingBusPlayer, setJumpingBusPlayer] = useState<Player | null>(null);
  const [pyramidScatterCards, setPyramidScatterCards] = useState(false);
  const [busVerticalOffset, setBusVerticalOffset] = useState<number | null>(null);
  const busCrashRef = useRef<HTMLDivElement>(null);
  const [playerHandToView, setPlayerHandToView] = useState<Player | null>(null);
  const [isHandTrayOpen, setIsHandTrayOpen] = useState(false);
  const [isMoreHandMode, setIsMoreHandMode] = useState(false);
  const [isHandClosing, setIsHandClosing] = useState(false);
  const [moreHeaderScroll, setMoreHeaderScroll] = useState<{ canLeft: boolean; canRight: boolean }>({ canLeft: false, canRight: false });

  const handleMoreHeaderScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const canLeft = el.scrollLeft > 4;
    const canRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setMoreHeaderScroll(prev => {
      if (prev.canLeft === canLeft && prev.canRight === canRight) return prev;
      return { canLeft, canRight };
    });
  };

  const moreHeaderRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      const canLeft = el.scrollLeft > 4;
      const canRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
      setMoreHeaderScroll(prev => {
        if (prev.canLeft === canLeft && prev.canRight === canRight) return prev;
        return { canLeft, canRight };
      });
    }
  }, []);

  useEffect(() => {
    if (isHandTrayOpen && isMoreHandMode) {
      const timer = setTimeout(() => {
        const el = document.getElementById('more-players-scroll-header');
        if (el) {
          const canLeft = el.scrollLeft > 4;
          const canRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
          setMoreHeaderScroll({ canLeft, canRight });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isHandTrayOpen, isMoreHandMode, players.length]);
  const [isPyramidComplete, setIsPyramidComplete] = useState(false);
  const [isSelectingBusPlayer, setIsSelectingBusPlayer] = useState(false);
  const [isPyramidInstructionsCollapsed, setIsPyramidInstructionsCollapsed] = useState(false);
  const [isPyramidDoubleSetup, setIsPyramidDoubleSetup] = useState(false);
  const [pyramidDoubleSetupRow, setPyramidDoubleSetupRow] = useState(0);
  const [doubledPyramidCardIds, setDoubledPyramidCardIds] = useState<Set<string>>(new Set());
  const [distributeBanner, setDistributeBanner] = useState<{resolutions: {name: string, sips: number, targetName?: string}[], id: number, position?: 'top' | 'bottom', isFadingOut?: boolean} | null>(null);
  const accumulatedSipsThisMatch = useRef<{name: string, sips: number, targetName?: string}[]>([]);
  const [pulseValidCards, setPulseValidCards] = useState(false);
  const [warningCooldown, setWarningCooldown] = useState(false);
  // Bus State
  const [busDriver, setBusDriver] = useState<Player | null>(null);
  const [busCards, setBusCards] = useState<Card[]>([]);
  const [currentBusIndex, setCurrentBusIndex] = useState(1);
  const [busWrongCardIndex, setBusWrongCardIndex] = useState<number | null>(null);
  const [isBusEntrance, setIsBusEntrance] = useState(false);
  const [isBusWon, setIsBusWon] = useState(false);
  const [busSipsTaken, setBusSipsTaken] = useState(0);
  const [busAttempts, setBusAttempts] = useState(1);
  const [busDecksUsed, setBusDecksUsed] = useState(1);
  const [showReshuffleBanner, setShowReshuffleBanner] = useState(false);
  const [extraDecks, setExtraDecks] = useState<Card[][]>([]);
  const [oldCardsInLayoutCount, setOldCardsInLayoutCount] = useState(0);
  const [discardedCardsCount, setDiscardedCardsCount] = useState(0);
  const [currentPackCards, setCurrentPackCards] = useState<Card[]>([]);
  const [isCardOverviewOpen, setIsCardOverviewOpen] = useState(false);
  const [busDeck, setBusDeck] = useState<Card[]>([]);
  const [isBusDeckExhausted, setIsBusDeckExhausted] = useState(false);
  const [busFocusIndex, setBusFocusIndex] = useState<number | null>(null);
  const [busWinBurst, setBusWinBurst] = useState(false);
  const [busMode, setBusMode] = useState<'physical' | 'digital' | null>(null);
  const [physicalBusPosition, setPhysicalBusPosition] = useState(1);
  const [isBusInstructionsCollapsed, setIsBusInstructionsCollapsed] = useState(false);
  const [busSelectionCandidateId, setBusSelectionCandidateId] = useState<string | null>(null);
  const busScrollRef = useRef<HTMLDivElement>(null);
  const isInitialBusMountRef = useRef(true);
  const busCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const busProgressContainerRef = useRef<HTMLDivElement>(null);
  const busProgressContentRef = useRef<HTMLDivElement>(null);
  const busProgressItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const busProgressScaleMetricsRef = useRef({ availableWidth: 0, contentWidth: 0, scale: 1 });
  const [busProgressScale, setBusProgressScale] = useState(1);
  const activePlayer = useMemo(() => players[activePlayerIndex], [players, activePlayerIndex]);
  const currentDealerIndex = useMemo(() => players.findIndex(p => p.isDealer), [players]);
  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => (b.drinksTaken + b.adtjes * 5) - (a.drinksTaken + a.adtjes * 5)),
    [players]
  );
  useEffect(() => {
    setScreenShake(false);
  }, [phase, activePlayerIndex]);
  const { playSound } = useAudio();
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
    setBusSipsTaken(0);
    setBusAttempts(1);
    setCurrentBusIndex(1);
    setPhysicalBusPosition(1);
    setFeedback(null);
    setExtraDecks([]);
    setOldCardsInLayoutCount(0);
    setDiscardedCardsCount(0);
    setCurrentPackCards([]);
    setIsCardOverviewOpen(false);
    setShowReshuffleBanner(false);
    setBusVerticalOffset(null);
    setIsBusDeparting(false);
    setIsBusPaused(false);
    setIsSharedBusSelecting(false);
    setDraggedSharedBusPartnerId(null);
    setSharedBusDragPos(null);
    setSharedBusDragTilt(0);
    setIsHoveredOverBus(false);
    isHoveredOverBusRef.current = false;
  }, []);
    const dismissTransitions = useCallback(() => {
    setLoserReveal(null);
    setIsBusEntrance(false);
    }, []);
const initializeAdMob = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || adMobReadyRef.current) return;
    try {
      await AdMob.initialize({
        initializeForTesting: false,
      });
      adMobReadyRef.current = true;
    } catch (error) {
    }
  }, []);
  // Pre-load an interstitial ad in background
  const prepareAdInterstitial = useCallback(async (adId: string) => {
    if (!Capacitor.isNativePlatform() || players.some(p => p.isDev)) return;
    try {
      if (!adMobReadyRef.current) {
        await AdMob.initialize({
          initializeForTesting: false,
        });
        adMobReadyRef.current = true;
      }
      await AdMob.prepareInterstitial({ adId });
    } catch (error) {
    }
  }, [players]);
  const prepareRewardedAd = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    if (players.some(p => p.isDev)) return;
    try {
      await AdMob.prepareRewardVideoAd({ adId: ADMOB_REWARDED_UNIT_ID });
    } catch (error) {
    }
  }, [players]);
  const showRewardedAd = useCallback(async () => {
    if (players.some(p => p.isDev)) return true; // Always success for dev player
    setIsAdLoading(true);
    if (!Capacitor.isNativePlatform()) {
      // Simulate ad playback delay on web/dev to show loading popup
      await new Promise(r => setTimeout(r, 1200));
      setIsAdLoading(false);
      return true;
    }
    try {
      await AdMob.prepareRewardVideoAd({ adId: ADMOB_REWARDED_UNIT_ID });
      const reward = await AdMob.showRewardVideoAd();
      setIsAdLoading(false);
      return !!reward;
    } catch (error) {
      setIsAdLoading(false);
      return false;
    }
  }, [players]);
  // Interstitial ad
  const showInterstitialAd = useCallback(async (type: 'QUIT' | 'LEADERBOARD') => {
    if (players.some(p => p.isDev)) return;
    setIsAdLoading(true);
    if (!Capacitor.isNativePlatform()) {
      // Simulate ad playback delay on web/dev to show loading popup
      await new Promise(r => setTimeout(r, 1200));
      setIsAdLoading(false);
      return;
    }
    const adId = type === 'QUIT' ? ADMOB_INTERSTITIAL_QUIT_UNIT_ID : ADMOB_INTERSTITIAL_LEADERBOARD_UNIT_ID;
    try {
      if (!adMobReadyRef.current) {
        await AdMob.initialize({
          initializeForTesting: false,
        });
        adMobReadyRef.current = true;
      }
      // Try showing directly in case it was preloaded
      try {
        await AdMob.showInterstitial();
        lastAdShownRef.current = Date.now();
      } catch (showError) {
        // Preloaded ad wasn't available, prepare and show now
        await AdMob.prepareInterstitial({ adId });
        await AdMob.showInterstitial();
        lastAdShownRef.current = Date.now();
      }
    } catch (error) {
    } finally {
      setIsAdLoading(false);
    }
  }, [players]);
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
      localStorage.removeItem(PLAYER_DATA_KEY);
    }
  }, [storageAvailable, setPlayers, setNewPlayerName, setNewPlayerImage]);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-classic', 'theme-metro', 'theme-calm', 'theme-beer', 'theme-stars');
    root.classList.add(`theme-${settings.theme}`, 'theme-transition');
    if (settings.theme === UITheme.CALM) {
      const accentHex = settings.calmAccentColor || '#fb7185'; // Default light red
      
      // Parse Hex to RGB
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const fullHex = accentHex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
      const rgb = result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 251, g: 113, b: 133 };
      
      const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
      const btnTextColor = yiq >= 165 ? '#090514' : '#ffffff';

      root.style.setProperty('--theme-accent', accentHex);
      root.style.setProperty('--theme-accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
      root.style.setProperty('--theme-btn-bg', accentHex);
      root.style.setProperty('--theme-btn-text', btnTextColor);
      root.style.setProperty('--theme-btn-sec-text', accentHex);
      root.style.setProperty('--theme-card-border', `1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
      root.style.setProperty('--theme-border-radius', '20px');
      root.style.removeProperty('--theme-accent-gradient');
      root.style.removeProperty('--theme-accent-secondary');
      root.style.removeProperty('--theme-tertiary');
      root.style.removeProperty('--theme-accent-tertiary');
    } else if (settings.theme === UITheme.STARS) {
      root.style.setProperty('--theme-bg-base', '#010005');
      root.style.setProperty('--theme-bg-void', 'radial-gradient(circle at 50% 0%, #0c101c 0%, #04060c 45%, #010005 100%)');
      root.style.setProperty('--theme-bg', '#010005');
      root.style.setProperty('--theme-card-bg', 'rgba(8, 11, 20, 0.82)');
      root.style.setProperty('--theme-card-border', '1px solid rgba(226, 232, 240, 0.16)');
      root.style.setProperty('--theme-card-border-glow', '0 0 20px rgba(226, 232, 240, 0.08), inset 0 0 12px rgba(255, 255, 255, 0.04)');
      root.style.setProperty('--theme-accent', '#e2e8f0');
      root.style.setProperty('--theme-accent-secondary', '#f8fafc');
      root.style.setProperty('--theme-accent-gradient', 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 45%, #cbd5e1 100%)');
      root.style.setProperty('--theme-accent-glow', 'rgba(226, 232, 240, 0.28)');
      root.style.setProperty('--theme-starlight-gold', '#fef08a');
      root.style.setProperty('--theme-cosmic-cyan', '#38bdf8');
      root.style.setProperty('--theme-btn-bg', 'linear-gradient(180deg, #181d2c 0%, #070911 100%)');
      root.style.setProperty('--theme-btn-text', '#ffffff');
      root.style.setProperty('--theme-btn-sec-bg', 'rgba(226, 232, 240, 0.07)');
      root.style.setProperty('--theme-btn-sec-text', '#e2e8f0');
      root.style.setProperty('--theme-surface-glass', 'rgba(8, 11, 20, 0.85)');
      root.style.setProperty('--theme-surface-border', '1px solid rgba(226, 232, 240, 0.14)');
      root.style.setProperty('--theme-border-radius', '20px');
      root.style.removeProperty('--theme-tertiary');
      root.style.removeProperty('--theme-accent-tertiary');
    } else if (settings.theme === UITheme.METRO) {
      root.style.setProperty('--theme-accent', '#fb7185');
      root.style.setProperty('--theme-accent-glow', 'rgba(251, 113, 133, 0.15)');
      root.style.setProperty('--theme-btn-bg', '#fb7185');
      root.style.setProperty('--theme-btn-sec-text', '#a3a3a3');
      root.style.setProperty('--theme-card-border', '1.5px solid #27272a');
      root.style.setProperty('--theme-border-radius', '6px');
      root.style.removeProperty('--theme-accent-gradient');
      root.style.removeProperty('--theme-accent-secondary');
      root.style.removeProperty('--theme-tertiary');
      root.style.removeProperty('--theme-accent-tertiary');
    } else if (settings.theme === UITheme.BEER) {
      root.style.setProperty('--theme-accent', '#ff3333');
      root.style.setProperty('--theme-accent-glow', 'rgba(255, 51, 51, 0.4)');
      root.style.setProperty('--theme-tertiary', '#f59e0b');
      root.style.setProperty('--theme-accent-tertiary', '#f59e0b');
      root.style.setProperty('--theme-btn-bg', '#008200');
      root.style.setProperty('--theme-btn-sec-bg', '#ff3333');
      root.style.setProperty('--theme-btn-sec-text', '#ffffff');
      root.style.setProperty('--theme-card-border', '1px solid rgba(226, 232, 240, 0.2)');
      root.style.setProperty('--theme-border-radius', '12px');
      root.style.removeProperty('--theme-accent-gradient');
      root.style.removeProperty('--theme-accent-secondary');
    } else {
      // Classic clean up
      root.style.removeProperty('--theme-accent');
      root.style.removeProperty('--theme-accent-secondary');
      root.style.removeProperty('--theme-accent-gradient');
      root.style.removeProperty('--theme-accent-glow');
      root.style.removeProperty('--theme-tertiary');
      root.style.removeProperty('--theme-accent-tertiary');
      root.style.removeProperty('--theme-btn-bg');
      root.style.removeProperty('--theme-btn-sec-text');
      root.style.removeProperty('--theme-card-border');
      root.style.removeProperty('--theme-border-radius');
    }
  }, [settings.theme, settings.calmAccentColor]);
  // Main hydration effect on component mount
  useEffect(() => {
    hydratePlayers(); // Always hydrate players
    if (storageAvailable) {
      localStorage.removeItem(GAME_STATE_KEY); // Ensure game state never persists between sessions
    }
    // Hide status bar on native devices
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => { });
      StatusBar.hide().catch(() => { });
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
    }
  }, [isBusInstructionsCollapsed, storageAvailable]);
  useEffect(() => {
    if (!storageAvailable) return;
    persistPlayers();
  }, [persistPlayers, storageAvailable]);
  useEffect(() => {
    if (distributeBanner && !distributeBanner.isFadingOut) {
      const timer = setTimeout(() => setDistributeBanner(prev => prev ? { ...prev, isFadingOut: true } : null), 3500);
      return () => clearTimeout(timer);
    } else if (distributeBanner && distributeBanner.isFadingOut) {
      const timer = setTimeout(() => setDistributeBanner(null), 500);
      return () => clearTimeout(timer);
    }
  }, [distributeBanner]);
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
    initializeAdMob();
  }, [initializeAdMob]);
  useEffect(() => {
    const manageBars = async () => {
      try {
        await StatusBar.hide();
      } catch (e) {
        // Ignored in web
      }
    };
    manageBars();
  }, [phase]);
  // --- HELPERS ---
  const triggerShake = () => {
    setScreenShake(true);
    scheduleGameEvent('screen-shake', 500, { type: 'SCREEN_SHAKE_DONE' });
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
        quality: 75,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source === 'CAMERA' ? CameraSource.Camera : CameraSource.Photos,
        width: 160,
        height: 160,
      });
      return { dataUrl: photo?.dataUrl ?? null, cancelled: false, available: true };
    } catch (error: any) {
      const message = (error?.message ?? '').toLowerCase();
      const cancelled = message.includes('cancel') || message.includes('no image selected');
      if (!cancelled) {
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
    const availableWidth = Math.round(container.clientWidth);
    const contentWidth = Math.round(content.scrollWidth);
    if (!contentWidth) return;
    const nextScale = Math.max(0.65, Math.min(1, availableWidth / contentWidth));
    const previous = busProgressScaleMetricsRef.current;
    if (
      previous.availableWidth === availableWidth
      && previous.contentWidth === contentWidth
      && previous.scale === nextScale
    ) {
      return;
    }
    busProgressScaleMetricsRef.current = { availableWidth, contentWidth, scale: nextScale };
    setBusProgressScale(nextScale);
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
  const remainingBusCards = useMemo(() => {
    if (isBusWon) return 0;
    const currentReveal = busWrongCardIndex !== null ? currentBusIndex + 1 : currentBusIndex;
    const revealedInLayout = Math.max(0, currentReveal - oldCardsInLayoutCount);
    const usedCards = discardedCardsCount + revealedInLayout;
    const remainingCurrentPack = Math.max(0, 52 - usedCards);
    const remainingOldCards = Math.max(0, oldCardsInLayoutCount - currentReveal);
    return remainingOldCards + remainingCurrentPack;
  }, [isBusWon, busWrongCardIndex, currentBusIndex, oldCardsInLayoutCount, discardedCardsCount]);
  // --- SCROLL HELPERS ---
  useEffect(() => {
    // Keep refs array in sync with cards
    busCardRefs.current = busCardRefs.current.slice(0, busCards.length);
  }, [busCards.length]);
  useEffect(() => {
    busProgressItemRefs.current = busProgressItemRefs.current.slice(0, settings.busLength);
  }, [settings.busLength]);
  useEffect(() => {
    if (phase !== GamePhase.THE_BUS) {
      isInitialBusMountRef.current = true;
      return;
    }
    if (busCards.length === 0) return;
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
      const isFirstMount = isInitialBusMountRef.current;
      if (isFirstMount) {
        isInitialBusMountRef.current = false;
        container.scrollTo({ left: newScrollLeft, behavior: 'auto' });
      } else {
        container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
      }
    }
  }, [currentBusIndex, phase, busCards.length, busWrongCardIndex]);
  const shouldTrackBusProgressResize = phase === GamePhase.THE_BUS && settings.mode === GameMode.PHYSICAL && busMode === 'physical';
  useThrottledResize(recalcBusProgressScale, shouldTrackBusProgressResize);
  useEffect(() => {
    if (!shouldTrackBusProgressResize) return;
    recalcBusProgressScale();
  }, [recalcBusProgressScale, settings.busLength, shouldTrackBusProgressResize]);
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
      scheduleGameEvent('bus-win-burst', 1800, { type: 'BUS_WIN_BURST_DONE' });
    }
  }, [isBusWon, prepareAdInterstitial, scheduleGameEvent]);
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
        ? t('Er is een fout opgetreden bij de fotoselectie. Probeer opnieuw of kies lokaal bestand.')
        : t('Camera niet beschikbaar. Kies lokaal bestand.'),
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
        ? t('Er is een fout opgetreden bij de fotoselectie. Probeer opnieuw of kies lokaal bestand.')
        : t('Galerij niet beschikbaar. Kies lokaal bestand.'),
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
      setFeedback({ text: t('Kon de foto niet laden. Controleer de rechten of probeer een kleinere afbeelding.'), type: 'error' });
    }
  };
  const addPlayer = useCallback(() => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;
    if (players.length >= 12) {
      setFeedback({ text: t("Maximum aantal spelers (12) is bereikt."), type: 'error' });
      return;
    }
    if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      setFeedback({ text: t("Deze speler is al toegevoegd!"), type: 'error' });
      return;
    }
    triggerHaptic('success');
    playSound('playerAdd');
    const newId = Date.now().toString();
    setLastAddedPlayerId(newId);
    addPlayerToEngine({
      id: newId,
      name: trimmedName,
      hand: [],
      drinksTaken: 0,
      drinksDistributed: 0,
      adtjes: 0,
      isDealer: false,
      isImmune: false,
      image: newPlayerImage || undefined,
      avatarColor: (() => {
        if (newPlayerImage) return undefined;
        const used = new Set(players.map(p => p.avatarColor).filter(Boolean));
        const available = AVATAR_COLORS.filter(c => !used.has(c));
        const pool = available.length > 0 ? available : AVATAR_COLORS;
        return pool[Math.floor(Math.random() * pool.length)];
      })(),
    });
    setNewPlayerName('');
    setNewPlayerImage(null);
    setTimeout(() => inputRef.current?.focus(), 10);
  }, [addPlayerToEngine, newPlayerImage, newPlayerName, playSound, players, triggerHaptic, setFeedback, t]);
  const removePlayer = useCallback((id: string) => {
    triggerHaptic('tick');
    playSound('playerRemove');
    removePlayerFromEngine(id);
  }, [playSound, removePlayerFromEngine, triggerHaptic]);
  const renderPlayerListAvatar = useCallback((player: Player) => (
    <PlayerAvatar 
      player={player} 
      size="md" 
      theme={settings.theme} 
      onPointerDown={() => handleAvatarPointerDown(player)}
      onPointerUp={handleAvatarPointerUpOrLeave}
      onPointerLeave={handleAvatarPointerUpOrLeave}
    />
  ), [handleAvatarPointerDown, handleAvatarPointerUpOrLeave, settings.theme]);
  // --- DRAG-AND-DROP PLAYER REORDER ---
  const [dragPlayerIndex, setDragPlayerIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);
  const dragStartYRef = useRef<number>(0);
  const dragItemHeightRef = useRef<number>(0);
  const playerListRef = useRef<HTMLDivElement | null>(null);
  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent, index: number) => {
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
  }, [triggerHaptic]);
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
      reorderPlayers(dragPlayerIndex, dragOverIndex);
      triggerHaptic('medium');
    }
    setDragPlayerIndex(null);
    setDragOverIndex(null);
  }, [dragPlayerIndex, dragOverIndex, reorderPlayers]);
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
  const getGuessBtnClasses = (type: string) => {
    const isMetro = settings.theme === UITheme.METRO;
    const isBeer = settings.theme === UITheme.BEER;
    const isCalm = settings.theme === UITheme.CALM;
    const isStars = settings.theme === UITheme.STARS;
    if (isStars) {
      const base = "stars-polarity-btn py-4 rounded-2xl font-black text-lg backdrop-blur-xl active:scale-95 transition-all flex items-center justify-center gap-2 border shadow-lg relative overflow-hidden";
      if (type === 'RED') return `${base} bg-gradient-to-b from-rose-950/60 to-[#14020a]/90 hover:from-rose-900/70 hover:to-[#220412]/95 border-rose-400/25 border-t-white/35 text-rose-100 shadow-[0_4px_24px_rgba(244,63,94,0.15)]`;
      if (type === 'BLACK') return `${base} bg-gradient-to-b from-slate-900/70 to-[#04060c]/95 hover:from-slate-800/70 hover:to-[#090d18]/95 border-white/15 border-t-white/35 text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.6)]`;
      if (type === 'HIGHER') return `${base} bg-gradient-to-b from-slate-900/70 to-[#05070e]/95 hover:from-slate-800/70 hover:to-[#0c101c]/95 border-white/18 border-t-white/35 text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.6)]`;
      if (type === 'LOWER') return `${base} bg-gradient-to-b from-slate-900/70 to-[#05070e]/95 hover:from-slate-800/70 hover:to-[#0c101c]/95 border-white/18 border-t-white/35 text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.6)]`;
      if (type === 'BETWEEN') return `${base} bg-gradient-to-b from-slate-900/70 to-[#05070e]/95 hover:from-slate-800/70 hover:to-[#0c101c]/95 border-white/18 border-t-white/35 text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.6)]`;
      if (type === 'OUTSIDE') return `${base} bg-gradient-to-b from-slate-900/70 to-[#05070e]/95 hover:from-slate-800/70 hover:to-[#0c101c]/95 border-white/18 border-t-white/35 text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.6)]`;
      if (type === 'MATCH') return `${base} bg-gradient-to-b from-slate-800/80 to-[#080b15]/95 hover:from-slate-700/80 hover:to-[#101626]/95 border-white/25 border-t-white/45 text-white shadow-[0_4px_24px_rgba(226,232,240,0.15)]`;
      if (type === 'NO_MATCH') return `${base} bg-gradient-to-b from-slate-900/60 to-[#030408]/95 hover:from-slate-800/70 hover:to-[#080b14]/95 border-white/12 border-t-white/25 text-slate-300 shadow-[0_4px_24px_rgba(0,0,0,0.4)]`;
      if (type === 'EQUAL' || type === 'ON_IT') return "stars-polarity-btn px-5 py-2.5 rounded-full font-sans font-bold text-xs uppercase tracking-widest backdrop-blur-xl active:scale-95 transition-all flex items-center justify-center gap-2 border bg-gradient-to-b from-slate-900/60 to-[#060810]/90 hover:from-slate-800/70 hover:to-[#0c101c]/95 border-white/15 border-t-white/30 text-slate-200 shadow-[0_0_16px_rgba(0,0,0,0.5)]";
    }
    if (isMetro) {
      const base = "py-4 rounded-none font-black text-lg border-2 shadow-[4px_4px_0_rgba(0,0,0,0.8)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2";
      if (type === 'RED' || type === 'HIGHER' || type === 'BETWEEN' || type === 'MATCH') return `${base} bg-[var(--theme-accent)] text-slate-950 border-white`;
      if (type === 'BLACK' || type === 'LOWER' || type === 'OUTSIDE' || type === 'NO_MATCH') return `${base} bg-slate-900 text-[var(--theme-accent)] border-[var(--theme-accent)]`;
      if (type === 'EQUAL' || type === 'ON_IT') return "px-5 py-2 rounded-full font-bold text-sm uppercase tracking-wider border-2 shadow-[2px_2px_0_rgba(0,0,0,0.8)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 bg-zinc-800 text-zinc-100 border-zinc-600";
    }
    if (isBeer) {
      const base = "py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 border-t";
      if (type === 'RED') return `${base} bg-gradient-to-br from-red-600 to-amber-900 border-red-400 text-white shadow-[0_6px_20px_rgba(220,38,38,0.4)]`;
      if (type === 'BLACK') return `${base} bg-gradient-to-br from-amber-950 to-stone-900 border-amber-700 text-amber-100 shadow-[0_6px_20px_rgba(0,0,0,0.5)]`;
      if (type === 'HIGHER' || type === 'BETWEEN' || type === 'MATCH') return `${base} bg-gradient-to-br from-amber-500 to-amber-700 border-amber-300 text-slate-950 shadow-[0_6px_20px_rgba(245,158,11,0.4)]`;
      if (type === 'LOWER' || type === 'OUTSIDE' || type === 'NO_MATCH') return `${base} bg-gradient-to-br from-stone-800 to-amber-950 border-amber-700/60 text-amber-100 shadow-[0_6px_20px_rgba(180,83,9,0.3)]`;
      if (type === 'EQUAL' || type === 'ON_IT') return "px-5 py-2 rounded-full font-bold text-sm uppercase tracking-wider shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 border-t bg-amber-950 border-amber-800 text-amber-200";
    }
    if (isCalm) {
      const base = "py-4 rounded-2xl font-medium text-lg active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/5 shadow-sm";
      if (type === 'RED') return `${base} bg-rose-950/40 hover:bg-rose-950/60 border-rose-500/20 text-rose-300 shadow-[0_4px_20px_rgba(244,63,94,0.1)] no-calm-override`;
      if (type === 'BLACK') return `${base} bg-slate-900/40 hover:bg-slate-900/60 border-slate-700/30 text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.2)] no-calm-override`;
      if (type === 'HIGHER') return `${base} bg-emerald-950/40 hover:bg-emerald-950/60 border-emerald-500/20 text-emerald-300 shadow-[0_4px_20px_rgba(16,185,129,0.1)] no-calm-override`;
      if (type === 'LOWER') return `${base} bg-blue-950/40 hover:bg-blue-950/60 border-blue-500/20 text-blue-300 shadow-[0_4px_20px_rgba(59,130,246,0.1)] no-calm-override`;
      if (type === 'BETWEEN') return `${base} bg-teal-950/40 hover:bg-teal-950/60 border-teal-500/20 text-teal-300 shadow-[0_4px_20px_rgba(20,184,166,0.1)] no-calm-override`;
      if (type === 'OUTSIDE') return `${base} bg-indigo-950/40 hover:bg-indigo-950/60 border-indigo-500/20 text-indigo-300 shadow-[0_4px_20px_rgba(99,102,241,0.1)] no-calm-override`;
      if (type === 'MATCH') return `${base} bg-purple-950/50 hover:bg-purple-950/70 border-purple-500/30 text-purple-200 shadow-[0_4px_20px_rgba(168,85,247,0.2)] no-calm-override`;
      if (type === 'NO_MATCH') return `${base} bg-zinc-900/40 hover:bg-zinc-900/60 border-zinc-700/30 text-zinc-300 shadow-[0_4px_20px_rgba(0,0,0,0.2)] no-calm-override`;
      if (type === 'EQUAL' || type === 'ON_IT') return "px-5 py-2 rounded-full font-medium text-xs uppercase tracking-wider backdrop-blur-md active:scale-95 transition-all flex items-center justify-center gap-2 border bg-white/5 border-white/10 text-slate-300 hover:text-white";
    }
    // Default (Classic)
    const base = "py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 border-t";
    if (type === 'RED') return `${base} bg-gradient-to-br from-red-500 to-red-700 border-red-400 text-white`;
    if (type === 'BLACK') return `${base} bg-gradient-to-br from-slate-700 to-slate-900 border-slate-600 text-white`;
    if (type === 'HIGHER') return `${base} bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-400 text-white`;
    if (type === 'LOWER') return `${base} bg-gradient-to-br from-red-600 to-red-800 border-red-500 text-white`;
    if (type === 'BETWEEN') return `${base} bg-gradient-to-br from-blue-500 to-blue-700 border-blue-400 text-white`;
    if (type === 'OUTSIDE') return `${base} bg-gradient-to-br from-indigo-600 to-indigo-800 border-indigo-500 text-white`;
    if (type === 'MATCH') return `${base} bg-gradient-to-br from-purple-600 to-purple-800 border-purple-400 text-white`;
    if (type === 'NO_MATCH') return `${base} bg-gradient-to-br from-pink-600 to-pink-800 border-pink-400 text-white`;
    if (type === 'EQUAL' || type === 'ON_IT') return "px-5 py-2 rounded-full font-bold text-sm uppercase tracking-wider shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 border-t bg-gradient-to-br from-slate-700 to-slate-800 border-slate-500 text-white shadow-[0_4px_12px_rgba(0,0,0,0.35)]";
    return base;
  };
  const getBusGuessBtnClasses = (type: 'HIGHER' | 'LOWER' | 'EQUAL') => {
    const isMetro = settings.theme === UITheme.METRO;
    const isBeer = settings.theme === UITheme.BEER;
    const isCalm = settings.theme === UITheme.CALM;
    const isStars = settings.theme === UITheme.STARS;
    if (isStars) {
      if (type === 'HIGHER') return "stars-polarity-btn group flex-1 bg-gradient-to-b from-slate-900/80 to-[#070912]/95 hover:from-slate-800/80 hover:to-[#0e1220]/95 text-white py-6 rounded-2xl font-black border border-white/15 border-t-white/35 shadow-[0_6px_25px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col items-center active:scale-95 transition-all relative overflow-hidden";
      if (type === 'LOWER') return "stars-polarity-btn group flex-1 bg-gradient-to-b from-slate-900/80 to-[#070912]/95 hover:from-slate-800/80 hover:to-[#0e1220]/95 text-white py-6 rounded-2xl font-black border border-white/15 border-t-white/35 shadow-[0_6px_25px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col items-center active:scale-95 transition-all relative overflow-hidden";
      if (type === 'EQUAL') return "stars-polarity-btn w-full bg-gradient-to-b from-slate-950/70 to-[#05070d]/90 border border-white/15 border-t-white/30 text-slate-200 hover:text-white py-3 text-xs font-sans font-bold tracking-widest uppercase rounded-xl backdrop-blur-xl transition-all active:scale-95 shadow-[0_0_18px_rgba(0,0,0,0.5)] relative overflow-hidden";
    }
    if (isMetro) {
      if (type === 'HIGHER') return "group flex-1 bg-[var(--theme-accent)] text-slate-950 py-6 rounded-none font-black border-2 border-white shadow-[4px_4px_0_rgba(0,0,0,0.8)] flex flex-col items-center active:translate-x-0.5 active:translate-y-0.5 transition-all";
      if (type === 'LOWER') return "group flex-1 bg-slate-900 text-[var(--theme-accent)] py-6 rounded-none font-black border-2 border-[var(--theme-accent)] shadow-[4px_4px_0_rgba(0,0,0,0.8)] flex flex-col items-center active:translate-x-0.5 active:translate-y-0.5 transition-all";
      if (type === 'EQUAL') return "w-full bg-slate-900 text-slate-300 py-3 text-xs font-mono font-black border-2 border-slate-700 shadow-[4px_4px_0_rgba(0,0,0,0.8)] rounded-none transition-colors active:scale-95";
    }
    if (isBeer) {
      if (type === 'HIGHER') return "group flex-1 bg-gradient-to-b from-amber-500 to-amber-700 text-slate-950 py-6 rounded-2xl font-black border border-amber-300 shadow-[0_6px_20px_rgba(245,158,11,0.4)] flex flex-col items-center active:scale-95 transition-all";
      if (type === 'LOWER') return "group flex-1 bg-gradient-to-b from-stone-800 to-amber-950 text-amber-100 py-6 rounded-2xl font-black border border-amber-700/60 shadow-[0_6px_20px_rgba(180,83,9,0.3)] flex flex-col items-center active:scale-95 transition-all";
      if (type === 'EQUAL') return "w-full bg-amber-950/60 border border-amber-500/30 text-amber-300 py-3 text-xs font-bold rounded-xl hover:bg-amber-900/50 transition-colors active:scale-95";
    }
    if (isCalm) {
      if (type === 'HIGHER') return "group flex-1 bg-emerald-950/50 hover:bg-emerald-950/70 text-emerald-200 py-6 rounded-2xl font-black border border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.2)] backdrop-blur-xl flex flex-col items-center active:scale-95 transition-all";
      if (type === 'LOWER') return "group flex-1 bg-blue-950/50 hover:bg-blue-950/70 text-blue-200 py-6 rounded-2xl font-black border border-blue-500/30 shadow-[0_4px_20px_rgba(59,130,246,0.2)] backdrop-blur-xl flex flex-col items-center active:scale-95 transition-all";
      if (type === 'EQUAL') return "w-full bg-white/5 border border-white/10 text-slate-300 py-3 text-xs font-medium rounded-xl hover:bg-white/10 transition-colors active:scale-95";
    }
    if (type === 'HIGHER') return "group flex-1 bg-gradient-to-b from-emerald-500 to-emerald-700 active:from-emerald-700 active:to-emerald-800 text-white py-6 rounded-2xl font-black border border-emerald-400 flex flex-col items-center shadow-lg active:scale-95 transition-all";
    if (type === 'LOWER') return "group flex-1 bg-gradient-to-b from-slate-800 to-slate-900 active:from-slate-900 active:to-black text-white py-6 rounded-2xl font-black border border-slate-700 flex flex-col items-center shadow-lg active:scale-95 transition-all hover:border-red-500";
    if (type === 'EQUAL') return "w-full bg-slate-800/50 py-3 text-xs font-bold rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors active:scale-95";
    return "";
  };

  const getHeaderClasses = () => {
    const transitionClass = "transition-[border-radius,background-color,border-color,margin] duration-100";
    if (settings.theme === UITheme.STARS) {
      return `${transitionClass} stars-chronometer-bar rounded-[2rem] border border-white/15 border-t-white/35 mb-4 z-20 mx-2 relative overflow-hidden`;
    }
    if (settings.theme === UITheme.METRO) {
      return `${transitionClass} bg-[#0d0d0d] ${isDiscoActive ? 'rounded-2xl mx-1' : 'rounded-none mx-0'} border-b-2 border-[var(--theme-accent)] mb-4 z-20`;
    }
    if (settings.theme === UITheme.CALM) {
      return `${transitionClass} bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/5 mb-4 z-20 shadow-lg mx-2`;
    }
    if (settings.theme === UITheme.BEER) {
      return `${transitionClass} bg-amber-950/40 backdrop-blur-sm rounded-xl border-2 border-amber-900/50 mb-3 z-20 shadow-md mx-1`;
    }
    // Classic
    return `${transitionClass} bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 mb-3 z-20 shadow-2xl mx-1`;
  };

  const getHandContainerClasses = () => {
    const transitionClass = "transition-[border-radius,background-color,border-color] duration-100";
    if (settings.theme === UITheme.STARS) {
      return `${transitionClass} bg-gradient-to-b from-slate-900/40 to-[#070912]/85 rounded-[2rem] p-3 mb-6 mx-2 border border-white/12 border-t-white/30 backdrop-blur-2xl relative overflow-hidden min-h-[160px] flex flex-col justify-center shadow-[0_8px_32px_rgba(0,0,0,0.85),0_0_24px_rgba(255,255,255,0.04)]`;
    }
    if (settings.theme === UITheme.METRO) {
      return `${transitionClass} bg-[#0d0d0d] ${isDiscoActive ? 'rounded-3xl' : 'rounded-none'} p-3 mb-6 border-y border-[var(--theme-accent)]/30 relative overflow-hidden min-h-[160px] flex flex-col justify-center shadow-inner`;
    }
    if (settings.theme === UITheme.CALM) {
      return `${transitionClass} bg-white/[0.02] rounded-3xl p-3 mb-6 mx-2 border border-white/10 backdrop-blur-md relative overflow-hidden min-h-[160px] flex flex-col justify-center`;
    }
    if (settings.theme === UITheme.BEER) {
      return `${transitionClass} bg-amber-950/30 rounded-2xl p-3 mb-6 border border-amber-900/40 backdrop-blur-sm relative overflow-hidden min-h-[160px] flex flex-col justify-center shadow-inner`;
    }
    // Classic
    return `${transitionClass} bg-black/10 rounded-3xl p-3 mb-4 border border-white/5 backdrop-blur-sm shadow-inner relative overflow-hidden min-h-[160px] flex flex-col justify-center`;
  };

  const handleStartPress = () => {
    if (players.length < 2) return;
    setIsSettingsOpen(false);
    setIsMoreSettingsOpen(false);
    triggerHaptic('medium');
    if (settings.busLength >= 9) {
      setShowHardBusWarning(true);
      return;
    }
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
    setImmunePlayerId(null);
    resetBusState();
    setPlayers(prev => prev.map(p => ({
      ...p,
      hand: [],
      drinksTaken: 0,
      drinksDistributed: 0,
      adtjes: 0,
    })));
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
    setRoundStep(RoundStep.RED_BLACK);
    setPhase(GamePhase.ROUNDS_1_4);
    setRoundStep(RoundStep.RED_BLACK);
    setFeedback(null);
    setIsWaitingForNextPlayer(true);
    prepareAdInterstitial(ADMOB_INTERSTITIAL_QUIT_UNIT_ID);
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
    const currentPlayer = activePlayer;
    const placeholderCard: Card = { suit: Suit.SPADES, rank: Rank.ACE, id: `physical-${Date.now()}`, roundIndex: currentPlayer.hand.length };
    if (correct) {
      triggerHaptic('success');
      playSound('success');
      const phrase = getUniquePhrase('success');
      setFeedback({ text: `${t(phrase)} ${t("Correct!")}`, type: 'success' });
      setShowConfetti(true);
      playSound('celebrate');
    } else {
      triggerHaptic('error');
      triggerShake();
      playSound('fail');
      const phrase = getUniquePhrase('failure');
      setFeedback({ text: `${t(phrase)} ${t("drink zelf")} ${getSipsText(sips)}.`, type: 'error' });
    }
    updatePlayer(currentPlayer.id, player => ({
      ...player,
      hand: [...player.hand, placeholderCard],
      drinksTaken: correct ? player.drinksTaken : player.drinksTaken + sips,
    }));
  };
  const handleDigitalGuess = (guess: string) => {
    let card = drawCard();
    if (!card) return;
    if (devSettings.alwaysWin && activePlayer.isDev && deck.length > 0) {
      const r = roundStep;
      let validIndex = deck.findIndex(c => {
        if (r === RoundStep.RED_BLACK) {
          const isRed = c.suit === Suit.HEARTS || c.suit === Suit.DIAMONDS;
          return (guess === 'RED' && isRed) || (guess === 'BLACK' && !isRed);
        } else if (r === RoundStep.HIGH_LOW) {
          const b = activePlayer.hand[0];
          if (!b) return false;
          return (guess === 'HIGHER' && c.rank > b.rank) ||
                 (guess === 'LOWER' && c.rank < b.rank) ||
                 (guess === 'EQUAL' && c.rank === b.rank);
        } else if (r === RoundStep.IN_OUT) {
          const c1 = activePlayer.hand[0];
          const c2 = activePlayer.hand[1];
          if (!c1 || !c2) return false;
          const low = Math.min(c1.rank, c2.rank);
          const high = Math.max(c1.rank, c2.rank);
          if (guess === 'BETWEEN') return c.rank > low && c.rank < high;
          if (guess === 'OUTSIDE') return c.rank < low || c.rank > high;
          if (guess === 'ON_IT') return c.rank === low || c.rank === high;
        } else if (r === RoundStep.SUIT) {
          const hasSuit = activePlayer.hand.some(h => h.suit === c.suit);
          return (guess === 'MATCH' && hasSuit) || (guess === 'NO_MATCH' && !hasSuit);
        }
        return false;
      });
      if (validIndex > 0) {
        const matchingCard = deck[validIndex];
        setDeck(prev => {
          const next = [...prev];
          next.splice(validIndex - 1, 1);
          next.push(card!);
          return next;
        });
        card = matchingCard;
      } else if (validIndex === -1) {
        card = { ...card };
        if (r === RoundStep.RED_BLACK) {
          card.suit = guess === 'RED' ? Suit.HEARTS : Suit.SPADES;
        } else if (r === RoundStep.HIGH_LOW) {
          const b = activePlayer.hand[0];
          card.rank = b ? (guess === 'HIGHER' ? Math.min(14, b.rank + 1) : 
                      guess === 'LOWER' ? Math.max(2, b.rank - 1) : 
                      b.rank) : 7;
        } else if (r === RoundStep.IN_OUT) {
          const c1 = activePlayer.hand[0];
          const c2 = activePlayer.hand[1];
          if (c1 && c2) {
            const low = Math.min(c1.rank, c2.rank);
            const high = Math.max(c1.rank, c2.rank);
            card.rank = guess === 'BETWEEN' ? Math.floor((low + high) / 2) : 
                        guess === 'ON_IT' ? low : 14;
          } else card.rank = 14;
        } else if (r === RoundStep.SUIT) {
          const b = activePlayer.hand[0];
          card.suit = b ? (guess === 'MATCH' ? b.suit : (b.suit === Suit.HEARTS ? Suit.SPADES : Suit.HEARTS)) : Suit.SPADES;
        }
      }
    }
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
      correct = baseCard && ((guess === 'HIGHER' && card.rank > baseCard.rank) ||
        (guess === 'LOWER' && card.rank < baseCard.rank) ||
        (guess === 'EQUAL' && card.rank === baseCard.rank));
    }
    else if (roundStep === RoundStep.IN_OUT) {
      const c1 = player.hand[0];
      const c2 = player.hand[1];
      if (c1 && c2) {
        const low = Math.min(c1.rank, c2.rank);
        const high = Math.max(c1.rank, c2.rank);
        if (guess === 'BETWEEN') correct = card.rank > low && card.rank < high;
        else if (guess === 'OUTSIDE') correct = card.rank < low || card.rank > high;
        else if (guess === 'ON_IT') correct = card.rank === low || card.rank === high;
      }
    }
    else if (roundStep === RoundStep.SUIT) {
      const hasSuit = player.hand.some(h => h.suit === card.suit);
      correct = (guess === 'MATCH' && hasSuit) || (guess === 'NO_MATCH' && !hasSuit);
    }
    const currentPlayer = activePlayer;
    if (correct) {
      triggerHaptic('success');
      playSound('success');
      const phrase = getUniquePhrase('success');
      setFeedback({ text: `${t(phrase)} ${t("Correct!")}`, type: 'success' });
      setShowConfetti(true);
      playSound('celebrate');
    } else {
      triggerHaptic('error');
      triggerShake();
      playSound('fail');
      const phrase = getUniquePhrase('failure');
      setFeedback({ text: `${t(phrase)} ${t("Drink zelf")} ${getSipsText(sips)}.`, type: 'error' });
    }
    const cardToAdd = { ...card, roundIndex: card.roundIndex ?? currentPlayer.hand.length };
    updatePlayer(currentPlayer.id, player => ({
      ...player,
      hand: [...player.hand, cardToAdd],
      drinksTaken: correct ? player.drinksTaken : player.drinksTaken + sips,
    }));
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
    const currentPlayer = activePlayer;
    if (missingSuit && card.suit === missingSuit) {
      triggerHaptic('success');
      playSound('disco');
      setShowConfetti(true);
      setIsDiscoActive(true);
      setFeedback({ text: `${t("DISCO! Iedereen behalve")} ${currentPlayer.name} ${t("drinkt 1 slok.")}`, type: 'success' });
      const updates = players.reduce<Record<string, (player: Player) => Player>>((acc, player, idx) => {
        acc[player.id] = idx === activePlayerIndex
          ? current => ({ ...current, drinksDistributed: current.drinksDistributed + Math.max(0, players.length - 1) })
          : current => ({ ...current, drinksTaken: current.drinksTaken + 1 });
        return acc;
      }, {});
      updatePlayers(updates);
    } else {
      triggerHaptic('error');
      triggerShake();
      playSound('fail');
      const sips = roundStep;
      const phrase = getUniquePhrase('failure');
      setFeedback({ text: `${t(phrase)} ${t("Jammer! Drink zelf")} ${getSipsText(sips)}.`, type: 'error' });
      updatePlayer(currentPlayer.id, player => ({
        ...player,
        drinksTaken: player.drinksTaken + sips,
      }));
    }
    const cardToAdd = { ...card, roundIndex: card.roundIndex ?? currentPlayer.hand.length };
    updatePlayer(currentPlayer.id, player => ({
      ...player,
      hand: [...player.hand, cardToAdd],
    }));
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
    startTransition(() => {
      setPyramid(newPyramid);
    });
  };
  const initializePyramid = () => {
    triggerHaptic('medium');
    setPhase(GamePhase.PYRAMID);
    setFeedback(null);
    startTransition(() => {
      setRevealedPyramidCards(new Set());
    });
    setLoserReveal(null);
    setIsPyramidComplete(false);
    
    // Remember each card's position when entering the pyramid
    setPlayers(prev => prev.map(p => ({
      ...p,
      hand: p.hand.map((c, i) => ({
        ...c,
        roundIndex: c.roundIndex !== undefined ? c.roundIndex : i,
      })),
    })));

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
  const warningCooldownRef = useRef(false);
  const alreadyFlippedWarningCooldownRef = useRef(0);
  const isAlreadyFlippedActiveRef = useRef(false);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerPyramidWarning = (customText?: string, cooldownMs?: number) => {
    const isAlreadyFlipped =
      customText === t("Deze kaart is al omgedraaid!") ||
      customText === "Deze kaart is al omgedraaid!" ||
      customText === "This card has already been flipped!";

    const NOTIFICATION_DURATION_MS = 1200;

    if (isAlreadyFlipped) {
      if (isAlreadyFlippedActiveRef.current || Date.now() < alreadyFlippedWarningCooldownRef.current) {
        return;
      }
      alreadyFlippedWarningCooldownRef.current = Date.now() + NOTIFICATION_DURATION_MS;
      isAlreadyFlippedActiveRef.current = true;
    }

    if (warningCooldownRef.current) return;
    warningCooldownRef.current = true;
    triggerHaptic('warning');
    setFeedback({ text: customText || t("Deze kaart kan nog niet!"), type: 'warning' });
    if (!customText) {
      setPulseValidCards(true);
    }
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setPulseValidCards(false);
      isAlreadyFlippedActiveRef.current = false;
      if (isAlreadyFlipped) {
        warningCooldownRef.current = false;
      }
    }, NOTIFICATION_DURATION_MS);

    if (!isAlreadyFlipped) {
      const effectiveCooldown = cooldownMs ?? 350;
      setTimeout(() => {
        warningCooldownRef.current = false;
      }, effectiveCooldown);
    }
  };
  const pyramidContainerRef = useRef<HTMLDivElement>(null);
  const pyramidContentRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pyramidScaleMetricsRef = useRef({ containerWidth: 0, containerHeight: 0, contentWidth: 0, contentHeight: 0, scale: 1 });
  const [pyramidScale, setPyramidScale] = useState(1);
  const calculatePyramidScale = useCallback(() => {
    const container = pyramidContainerRef.current;
    const content = pyramidContentRef.current;
    if (container && content) {
      // Small 24px buffer (12px per side) for a tight fit
      const containerWidth = Math.round(container.clientWidth - 24); 
      const containerHeight = Math.round(container.clientHeight - 24); 
      
      let contentWidth = Math.round(content.scrollWidth);
      let contentHeight = Math.round(content.scrollHeight);
      // Add a static buffer to the content width based on the longest row's sip emojis
      // The longest sip emoji string is on the top row (pyramidRows - 1 emojis).
      const maxEmojis = settings.pyramidRows - 1;
      const emojiBuffer = maxEmojis > 0 ? (maxEmojis * 16) + 20 : 0;
      
      // We only need to zoom out if the bottom row (which is the widest) actually widens beyond its bounds.
      // Because CSS transform rotate-90 doesn't push adjacent cards, the row ONLY visually widens if the 
      // edge cards on the bottom row rotate!
      const bottomRowIndex = settings.pyramidRows - 1;
      const bottomRow = pyramid[bottomRowIndex] || [];
      let doubledBump = 0;
      
      if (bottomRow.length > 0) {
        const leftEdgeCard = bottomRow[0];
        const rightEdgeCard = bottomRow[bottomRow.length - 1];
        
        if (leftEdgeCard && doubledPyramidCardIds.has(leftEdgeCard.id)) doubledBump += 16;
        if (rightEdgeCard && doubledPyramidCardIds.has(rightEdgeCard.id)) doubledBump += 16;
      }
      contentWidth += emojiBuffer + doubledBump;
      if (contentWidth === 0 || contentHeight === 0) {
        const previous = pyramidScaleMetricsRef.current;
        if (previous.scale !== 1) {
          pyramidScaleMetricsRef.current = { containerWidth, containerHeight, contentWidth, contentHeight, scale: 1 };
          setPyramidScale(1);
        }
        return;
      }
      const widthScale = containerWidth / contentWidth;
      const heightScale = containerHeight / contentHeight;
      let fitScale = Math.min(widthScale, heightScale, 1);
      const previous = pyramidScaleMetricsRef.current;
      if (
        previous.containerWidth === containerWidth
        && previous.containerHeight === containerHeight
        && previous.contentWidth === contentWidth
        && previous.contentHeight === contentHeight
        && previous.scale === fitScale
      ) {
        return;
      }
      pyramidScaleMetricsRef.current = { containerWidth, containerHeight, contentWidth, contentHeight, scale: fitScale };
      setPyramidScale(fitScale);
    } else {
      const previous = pyramidScaleMetricsRef.current;
      if (previous.scale !== 1) {
        pyramidScaleMetricsRef.current = { containerWidth: 0, containerHeight: 0, contentWidth: 0, contentHeight: 0, scale: 1 };
        setPyramidScale(1);
      }
    }
  }, [settings.pyramidRows, doubledPyramidCardIds.size]);
  useEffect(() => {
    calculatePyramidScale();
  }, [calculatePyramidScale, pyramid, revealedPyramidCards]);
  useThrottledResize(calculatePyramidScale);
  const revealPyramidCard = (rowIndex: number, cardIndex: number, isSwipe: boolean = false) => {
    const card = pyramid[rowIndex]?.[cardIndex];
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
      if (!isSwipe) {
        triggerPyramidWarning();
      }
      return;
    }
    const newRevealed = new Set(revealedPyramidCards);
    newRevealed.add(card.id);
    setRevealedPyramidCards(newRevealed);
    const sips = settings.pyramidRows - rowIndex;
    const isTop = rowIndex === 0;
    const totalCards = (settings.pyramidRows * (settings.pyramidRows + 1)) / 2;
    const isFinished = newRevealed.size === totalCards;
    if (settings.mode === GameMode.PHYSICAL && pyramidMode === 'physical') {
      triggerHaptic('medium');
      setFeedback({
        text: isTop ? t("ADTJE VOOR DE ZAAL!") : `${t("Wie heeft deze kaart?")} ${getSipsText(sips)}!`,
        type: 'info'
      });
      if (isFinished) setIsPyramidComplete(true);
      return;
    }
    if (settings.mode === GameMode.PHYSICAL && pyramidMode === 'digital') {
      triggerHaptic('medium');
      setFeedback({ text: `${t("Deze kaart is")} ${getSipsText(sips)} ${t("waard.")}`, type: 'info' });
      if (isFinished) setIsPyramidComplete(true);
      return;
    }
    const matches: { player: Player, count: number, initialCount: number }[] = [];
    players.forEach(p => {
      const matchingCardsCount = p.hand.filter(h => h.rank === card.rank).length;
      if (matchingCardsCount > 0) {
        matches.push({ player: p, count: matchingCardsCount, initialCount: matchingCardsCount });
      }
    });
    if (matches.length > 0) {
      triggerHaptic('tick');
      playSound('success');
      const isDoubled = card && doubledPyramidCardIds.has(card.id);
      setPendingMatches({
        card: card,
        sips: sips * (isDoubled ? 2 : 1),
        matches: matches,
        bannerPosition: (isFinished || isPyramidComplete || rowIndex === 0 || rowIndex >= Math.ceil(settings.pyramidRows / 2)) ? 'top' : 'bottom'
      });
    } else {
      triggerHaptic('medium');
      if (isFinished) {
        setIsPyramidComplete(true);
      }
    }
  };
  const isPyramidSwipingRef = useRef(false);
  const lastSwipedCardKeyRef = useRef<string | null>(null);
  const handlePyramidCardInteraction = useCallback((rowIndex: number, cardIndex: number, isSwipe: boolean = false) => {
    const card = pyramid[rowIndex]?.[cardIndex];
    if (!card) return;
    const cardKey = `${rowIndex}-${cardIndex}-${card.id}`;
    if (isSwipe && lastSwipedCardKeyRef.current === cardKey) return;
    lastSwipedCardKeyRef.current = cardKey;
    if (isPyramidDoubleSetup) {
      if (rowIndex === pyramidDoubleSetupRow) {
        handleDoubleCardSelection(rowIndex, cardIndex);
      } else if (!isSwipe) {
        triggerPyramidWarning();
      }
      return;
    }
    const isRevealed = revealedPyramidCards.has(card.id);
    if (!isRevealed) {
      revealPyramidCard(rowIndex, cardIndex, isSwipe);
    } else {
      let hasMatch = false;
      if (card && settings.mode === GameMode.DIGITAL) {
        hasMatch = players.some(p => p.hand.some(h => h.rank === card.rank));
      }
      if (hasMatch && card) {
        const isDoubled = doubledPyramidCardIds.has(card.id);
        const sips = (settings.pyramidRows - rowIndex) * (isDoubled ? 2 : 1);
        const matches: { player: Player, count: number, initialCount: number }[] = [];
        players.forEach(p => {
          const matchingCardsCount = p.hand.filter(h => h.rank === card.rank).length;
          if (matchingCardsCount > 0) {
            matches.push({ player: p, count: matchingCardsCount, initialCount: matchingCardsCount });
          }
        });
        if (matches.length > 0) {
          isPyramidSwipingRef.current = false;
          triggerHaptic('tick');
          setPendingMatches({
            card,
            sips,
            matches,
            bannerPosition: (isPyramidComplete || rowIndex === 0 || rowIndex >= Math.ceil(settings.pyramidRows / 2)) ? 'top' : 'bottom'
          });
        } else if (!isSwipe) {
          triggerPyramidWarning(t("Deze kaart is al omgedraaid!"));
        }
      } else if (!isSwipe) {
        triggerPyramidWarning(t("Deze kaart is al omgedraaid!"));
      }
    }
  }, [
    pyramid,
    isPyramidDoubleSetup,
    pyramidDoubleSetupRow,
    revealedPyramidCards,
    doubledPyramidCardIds,
    settings.pyramidRows,
    settings.mode,
    players,
    isPyramidComplete,
    revealPyramidCard,
    handleDoubleCardSelection,
    triggerPyramidWarning
  ]);
  const checkPyramidPoint = (clientX: number, clientY: number, isSwipe: boolean = false) => {
    const el = document.elementFromPoint(clientX, clientY)?.closest('[data-pyramid-card="true"]');
    if (el) {
      const r = Number(el.getAttribute('data-row-index'));
      const c = Number(el.getAttribute('data-card-index'));
      if (!isNaN(r) && !isNaN(c)) {
        handlePyramidCardInteraction(r, c, isSwipe);
      }
    }
  };
  const handlePyramidPointerDown = (e: React.PointerEvent) => {
    isPyramidSwipingRef.current = true;
    lastSwipedCardKeyRef.current = null;
    checkPyramidPoint(e.clientX, e.clientY, false);
  };
  const handlePyramidPointerMove = (e: React.PointerEvent) => {
    if (!isPyramidSwipingRef.current) return;
    checkPyramidPoint(e.clientX, e.clientY, true);
  };
  const handlePyramidPointerEnd = () => {
    isPyramidSwipingRef.current = false;
    lastSwipedCardKeyRef.current = null;
  };
  const resolveMatch = (playerId: string, targetPlayerId?: string) => {
    if (!pendingMatches || isMatchModalClosing) return;
    triggerHaptic(targetPlayerId ? 'success' : 'tick');
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    const targetPlayer = targetPlayerId ? players.find(p => p.id === targetPlayerId) : null;
    const matchIndex = pendingMatches.matches.findIndex(m => m.player.id === playerId);
    if (matchIndex === -1) return;
    const match = pendingMatches.matches[matchIndex];
    const handIndex = player.hand.findIndex(c => c.rank === pendingMatches.card.rank);
    if (handIndex !== -1) {
      updatePlayer(playerId, currentPlayer => ({
        ...currentPlayer,
        hand: currentPlayer.hand.filter((_, index) => index !== handIndex),
        drinksDistributed: currentPlayer.drinksDistributed + pendingMatches.sips,
      }));
      if (targetPlayer) {
        updatePlayer(targetPlayer.id, currentTarget => ({
          ...currentTarget,
          drinksTaken: currentTarget.drinksTaken + pendingMatches.sips,
        }));
      }
      
      const existing = accumulatedSipsThisMatch.current.find(a => a.name === player.name && a.targetName === targetPlayer?.name);
      if (existing) {
        existing.sips += pendingMatches.sips;
      } else {
        accumulatedSipsThisMatch.current.push({ 
          name: player.name, 
          sips: pendingMatches.sips,
          targetName: targetPlayer?.name 
        });
      }
    }
    const newCount = match.count - 1;
    let newMatches = [...pendingMatches.matches];
    if (newCount <= 0) {
      newMatches = newMatches.filter(m => m.player.id !== playerId);
    } else {
      newMatches[matchIndex] = { ...match, count: newCount };
    }
    if (newMatches.length === 0) {
      setIsMatchModalClosing(true);
      setTimeout(() => {
        if (accumulatedSipsThisMatch.current.length > 0) {
          setDistributeBanner({ resolutions: accumulatedSipsThisMatch.current, id: Date.now(), position: pendingMatches.bannerPosition || 'top' });
          accumulatedSipsThisMatch.current = [];
        }
        setPendingMatches(null);
        setIsMatchModalClosing(false);
        const totalCards = (settings.pyramidRows * (settings.pyramidRows + 1)) / 2;
        if (revealedPyramidCards.size === totalCards) {
          setIsPyramidComplete(true);
        }
      }, 130);
    } else {
      setPendingMatches({ ...pendingMatches, matches: newMatches });
    }
  };
  const dismissMatchModal = () => {
    if (isMatchModalClosing) return;
    setIsMatchModalClosing(true);
    setTimeout(() => {
      if (pendingMatches && accumulatedSipsThisMatch.current.length > 0) {
        setDistributeBanner({ resolutions: accumulatedSipsThisMatch.current, id: Date.now(), position: pendingMatches.bannerPosition || 'top' });
        accumulatedSipsThisMatch.current = [];
      }
      setPendingMatches(null);
      setIsMatchModalClosing(false);
      const totalCards = (settings.pyramidRows * (settings.pyramidRows + 1)) / 2;
      if (revealedPyramidCards.size === totalCards) {
        setIsPyramidComplete(true);
      }
    }, 130);
  };
  const findLoser = () => {
    if (devSettings.forceBusPlayerId) {
      const forced = players.find(p => p.id === devSettings.forceBusPlayerId);
      if (forced) return forced;
    }
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
    triggerHaptic('majorLoss');
    playSound('busEnter');
    const victim = findLoser();
    const driver = players.find(p => p.isDealer) || players[0];
    const title = getUniquePhrase('loser');
    setBusDriver(driver);
    setBusPassengers([victim]);
    setLoserReveal({ player: victim, title: title });
    if (settings.sharedBus) {
      setPhase(GamePhase.BUS_TEAM_SELECTION);
      scheduleGameEvent('loser-reveal', 3200, { type: 'LOSER_REVEAL_DONE' });
    } else {
      dispatchGameEvent({ type: 'START_BUS', passengers: [victim] });
    }
  };
  const determineLoserAndAnimate = (forcedVictim?: Player) => {
    if (isBusCrashing || jumpingBusPlayer) return;
    resetBusState();
    if (settings.mode === GameMode.PHYSICAL && pyramidMode === 'physical') {
      goToBusSelection();
      return;
    }
    const victim = forcedVictim || findLoser();
    const driver = players.find(p => p.isDealer) || players[0];
    setBusDriver(driver);
    setBusPassengers([victim]);

    // Always use fixed vertical position — never shift bus based on pyramid row layout
    setBusVerticalOffset(null);

    // Phase 1: Launch bus immediately! Bus drives across cards to knock them away
    setIsBusPassengerBoarded(false);
    setIsBusBraking(false);
    setIsBusChassisBouncing(false);
    setJumpingBusPlayer(null);
    setIsBusTransitioning(false);
    setIsBusCrashing(true);
    setPyramidScatterCards(false);

    // Initial bus launch vibration
    triggerHaptic('heavy');

    const hitCards = new Set<string>();
    let lastHapticTime = 0;
    let animFrameId: number;
    const startTime = performance.now();
    const CRASH_FORWARD_WINDOW = 1200; // Time window during forward pass to hit cards

    const checkCollisions = () => {
      const elapsed = performance.now() - startTime;
      const busEl = busCrashRef.current;
      const containerEl = pyramidContentRef.current;

      if (busEl && containerEl) {
        const busRect = busEl.getBoundingClientRect();
        // Leading front bumper is near right edge (95% across width)
        const bumperX = busRect.left + (busRect.width * 0.95);

        const cardEls = containerEl.querySelectorAll<HTMLElement>('[data-pyramid-card="true"]');
        let hitAnyThisFrame = false;

        cardEls.forEach((cardEl) => {
          const id = cardEl.getAttribute('data-card-id');
          if (!id || hitCards.has(id)) return;

          const cardRect = cardEl.getBoundingClientRect();
          // Check if bus bumper physically touches or has crossed card's left edge
          if (bumperX >= cardRect.left) {
            hitCards.add(id);
            hitAnyThisFrame = true;

            const rowIdx = parseInt(cardEl.getAttribute('data-row-index') || '0', 10);
            const totalRows = settings.pyramidRows || 5;
            const isTop = rowIdx < totalRows / 2;
            const isCenter = Math.abs(rowIdx - (totalRows - 1) / 2) < 0.6;
            const effectiveScale = pyramidScale || 1;

            // Fling card violently to the RIGHT side (direction of bus motion)
            const distToRightEdge = window.innerWidth - cardRect.left;
            const xThrow = (distToRightEdge + 500 + Math.random() * 250) / effectiveScale;

            // Vertical deflection based on row relative to centerline
            const verticalDist = isCenter
              ? (Math.random() - 0.5) * 120
              : (isTop ? -1 : 1) * (180 + Math.random() * 160 + (totalRows - rowIdx) * 35);
            const yThrow = verticalDist / effectiveScale;

            // 3D aerodynamic tumble and spin
            const rotZ = (isTop ? -1 : 1) * (360 + Math.random() * 450);
            const rotY = 180 + Math.random() * 360;
            const rotX = (Math.random() - 0.5) * 120;

            cardEl.style.transform = `translate3d(${xThrow}px, ${yThrow}px, 0) rotateZ(${rotZ}deg) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(0.35)`;
            cardEl.style.opacity = '0';
            cardEl.style.transition = 'transform 0.75s cubic-bezier(0.12, 0.95, 0.28, 1), opacity 0.55s ease-out 0.2s';
            cardEl.style.pointerEvents = 'none';
          }
        });

        // Haptic impact pulse on card collision
        if (hitAnyThisFrame) {
          const now = Date.now();
          if (now - lastHapticTime > 65) {
            lastHapticTime = now;
            triggerHaptic('heavy');
          }
        }
      }

      if (elapsed < CRASH_FORWARD_WINDOW) {
        animFrameId = requestAnimationFrame(checkCollisions);
      }
    };

    animFrameId = requestAnimationFrame(checkCollisions);

    // Fallback sweep at 950ms of crash to ensure all cards are swept away before braking
    const sweepTimer = setTimeout(() => {
      setPyramidScatterCards(true);
      const containerEl = pyramidContentRef.current;
      if (containerEl) {
        const effectiveScale = pyramidScale || 1;
        const cardEls = containerEl.querySelectorAll<HTMLElement>('[data-pyramid-card="true"]');
        cardEls.forEach((cardEl) => {
          const id = cardEl.getAttribute('data-card-id');
          if (id && !hitCards.has(id)) {
            hitCards.add(id);
            const cardRect = cardEl.getBoundingClientRect();
            const distToRightEdge = window.innerWidth - cardRect.left;
            const xThrow = (distToRightEdge + 500 + Math.random() * 200) / effectiveScale;
            cardEl.style.transform = `translate3d(${xThrow}px, 0, 0) rotateZ(360deg) scale(0.3)`;
            cardEl.style.opacity = '0';
            cardEl.style.transition = 'transform 0.6s ease-out, opacity 0.4s ease-out';
            cardEl.style.pointerEvents = 'none';
          }
        });
      }
    }, 950);

    // Phase 2: At 716ms (11.2%) - Brakes engage! Bus begins controlled 18vw forward slide with tire screech and vibration
    const brakeTimer = setTimeout(() => {
      setIsBusBraking(true);
      triggerHaptic('majorLoss');
    }, 716);

    // Phase 2.5: At 1120ms (17.5%) - Forward slide reaches 18vw, front suspension rebounds & settles during pause
    const skidStopTimer = setTimeout(() => {
      setIsBusBraking(false);
    }, 1120);

    // Phase 3: At 1504ms (23.5%) - Reverse gear engages, reverse lamps on, bus accelerates backwards toward center at natural speed
    const reverseTimer = setTimeout(() => {
      setIsBusReversing(true);
    }, 1504);

    // Phase 3.5: At 1952ms (30.5%) - Reverse brake slams on! Weight tilts to opposite side, nose kicks up
    const reverseBrakeTimer = setTimeout(() => {
      setIsBusReversing(false);
      setIsBusBraking(true);
      triggerHaptic('medium');
    }, 1952);

    // Phase 3.8: At 2112ms (33%) - Reverse brake settles, bus parked rock-solid in exact center
    const parkedTimer = setTimeout(() => {
      setIsBusBraking(false);
    }, 2112);

    // Phase 4: At 2160ms - Bus parked in center! Loser profile picture drops down from header into bus (3.0s showcase)
    const playerDropTimer = setTimeout(() => {
      setJumpingBusPlayer(victim);
      triggerHaptic('medium');
    }, 2160);

    // Phase 5: At 5150ms - Profile picture lands directly inside the bus with solid impact vibration!
    const passengerLandTimer = setTimeout(() => {
      setIsBusPassengerBoarded(true);
      setIsBusChassisBouncing(true);
      triggerHaptic('heavy');
      setTimeout(() => {
        setJumpingBusPlayer(null);
      }, 70);
    }, 5150);

    let sharedBusTimer: NodeJS.Timeout | null = null;
    let departTimer: NodeJS.Timeout | null = null;
    let transitionTimer: NodeJS.Timeout | null = null;
    let finishTimer: NodeJS.Timeout | null = null;

    if (settings.sharedBus) {
      // While 1 player is in the bus, and the bus is ready to depart (just before the bus header fades in at 5350ms):
      // Keep the bus on screen, pause animation, and show shared bus selection above the parked bus!
      sharedBusTimer = setTimeout(() => {
        setIsBusPaused(true);
        setIsSharedBusSelecting(true);
      }, 5200);
    } else {
      // Phase 6: At 5350ms - Bus revs and starts driving away! Early fade-in of the bus header begins
      departTimer = setTimeout(() => {
        setIsBusDeparting(true);
      }, 5350);

      // Phase 7: At 5800ms - Subtle transition atmosphere as bus speeds offscreen
      transitionTimer = setTimeout(() => {
        setIsBusTransitioning(true);
      }, 5800);

      // Phase 8: At 6400ms - Bus has driven completely offscreen right, cards appear naturally
      finishTimer = setTimeout(() => {
        cancelAnimationFrame(animFrameId);
        clearTimeout(sweepTimer);
        clearTimeout(brakeTimer);
        clearTimeout(skidStopTimer);
        clearTimeout(reverseTimer);
        clearTimeout(reverseBrakeTimer);
        clearTimeout(parkedTimer);
        clearTimeout(playerDropTimer);
        clearTimeout(passengerLandTimer);
        if (departTimer) clearTimeout(departTimer);
        if (transitionTimer) clearTimeout(transitionTimer);
        setIsBusCrashing(false);
        setIsBusDeparting(false);
        setIsBusTransitioning(false);
        setIsBusBraking(false);
        setIsBusReversing(false);
        setIsBusPassengerBoarded(false);
        setIsBusChassisBouncing(false);
        setJumpingBusPlayer(null);
        setPyramidScatterCards(false);
        setBusVerticalOffset(null);
        setPhase(GamePhase.THE_BUS);
        dispatchGameEvent({ type: 'START_BUS', passengers: [victim] });
      }, 6400);
    }
  };
  useEffect(() => {
    (window as any).triggerBusAnimation = () => determineLoserAndAnimate();
  }, [determineLoserAndAnimate]);
  const proceedToBus = () => {
    if (settings.mode === GameMode.PHYSICAL) {
      setIsSelectingBusPlayer(true);
      return;
    }
    determineLoserAndAnimate();
  };
  const handleManualBusPassengerSelect = (passenger: Player) => {
    triggerHaptic('medium');
    playSound('busEnter');
    const driver = players.find(p => p.isDealer) || players[0];
    setBusDriver(driver);
    resetBusState();
    setLoserReveal({ player: passenger, title: getUniquePhrase('loser') });
    setBusPassengers([passenger]);
    setBusMode('physical');
    setIsSelectingBusPlayer(false);
    scheduleGameEvent('loser-reveal', 3200, { type: 'START_BUS', passengers: [passenger] });
  };
  const handleSharedBusSelection = (partner: Player | null) => {
    triggerHaptic('medium');
    const currentPassengers = busPassengers.length ? busPassengers : [];
    const updatedPassengers = partner ? [...currentPassengers, partner] : currentPassengers;
    setBusPassengers(updatedPassengers);
    dispatchGameEvent({ type: 'START_BUS', passengers: updatedPassengers, showEntrance: !!partner });
  };
  // --- BUS LOGIC ---
  const startDigitalBus = (passengers: Player[], options?: { skipEntrance?: boolean; showEntrance?: boolean }) => {
    setImmunePlayerId(null);
    setPlayers(prev => prev.map(p => ({ ...p, isImmune: false })));
    
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
      scheduleGameEvent('bus-entrance', 3000, { type: 'BUS_ENTRANCE_DONE', passengers: selectedPassengers, mode: 'digital' });
      return;
    }
    setIsBusEntrance(false);
    setBusMode('digital');
    setBusDecksUsed(1); // Reset bus decks used at the start of bus phase
    setIsBusDeckExhausted(false);
    setBusFocusIndex(null);
    setIsBusWon(false);
    const needed = settings.busLength;
    
    // Create decks
    const firstDeck = shuffleDeck(createDeck());
    const extra: Card[][] = [];
    for (let i = 1; i < settings.busDecks; i++) {
      extra.push(shuffleDeck(createDeck()));
    }
    
    setExtraDecks(extra);
    setOldCardsInLayoutCount(0); // Reset to 0
    setDiscardedCardsCount(0); // Reset to 0
    setCurrentPackCards(firstDeck);
    
    const newBusCards = firstDeck.slice(0, needed);
    setBusDeck(firstDeck.slice(needed));
    setBusCards(newBusCards);
    setCurrentBusIndex(1);
    setBusWrongCardIndex(null);
    setPhase(GamePhase.THE_BUS);
    setFeedback(null);
  };
  const resumeBusDeparture = useCallback((passengers: Player[]) => {
    setIsSharedBusSelecting(false);
    setIsBusPaused(false);

    // Early header fade-in after 150ms
    setTimeout(() => {
      setIsBusDeparting(true);
    }, 150);

    // Subtle transition atmosphere after 600ms
    setTimeout(() => {
      setIsBusTransitioning(true);
    }, 600);

    // Bus has driven completely offscreen right at 1200ms
    setTimeout(() => {
      setIsBusCrashing(false);
      setIsBusDeparting(false);
      setIsBusTransitioning(false);
      setIsBusBraking(false);
      setIsBusReversing(false);
      setIsBusPassengerBoarded(false);
      setIsBusChassisBouncing(false);
      setJumpingBusPlayer(null);
      setPyramidScatterCards(false);
      setBusVerticalOffset(null);
      startDigitalBus(passengers, { skipEntrance: true });
    }, 1200);
  }, [startDigitalBus]);

  const handleInPlaceSharedBusSelection = useCallback((partner: Player | null) => {
    if (!isSharedBusSelecting) return;
    triggerHaptic(partner ? 'heavy' : 'medium');
    if (partner) {
      playSound('busEnter');
      const currentPassengers = busPassengers.length ? busPassengers : [findLoser()];
      const updatedPassengers = [...currentPassengers, partner];
      setBusPassengers(updatedPassengers);
      setIsBusChassisBouncing(true);
      setTimeout(() => setIsBusChassisBouncing(false), 350);
      resumeBusDeparture(updatedPassengers);
    } else {
      resumeBusDeparture(busPassengers);
    }
  }, [isSharedBusSelecting, busPassengers, findLoser, resumeBusDeparture]);

  const getMatcherAvatarFrameClasses = useCallback(() => {
    if (settings.theme === UITheme.METRO) return 'rounded-full border-2 border-zinc-700 group-hover:border-[var(--theme-accent,#fb7185)] group-hover:shadow-[3px_3px_0_rgba(0,0,0,0.9)]';
    if (settings.theme === UITheme.CALM) return 'rounded-full border-2 border-white/15 group-hover:border-[var(--theme-accent,#fb7185)] group-hover:shadow-[0_0_20px_var(--theme-accent-glow,rgba(251,113,133,0.3))]';
    if (settings.theme === UITheme.BEER) return 'rounded-full border-2 border-amber-500/30 group-hover:border-amber-400 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]';
    if (settings.theme === UITheme.STARS) return 'rounded-full border-2 border-white/20 group-hover:border-slate-200 group-hover:shadow-[0_0_25px_rgba(226,232,240,0.6)]';
    return 'rounded-full border-2 border-white/20 group-hover:border-emerald-400/60 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]';
  }, [settings.theme]);

  const getDragPointerClasses = useCallback((isHovered: boolean) => {
    const shape = 'rounded-full';
    if (isHovered) {
      if (settings.theme === UITheme.METRO) return `${shape} border-2 border-black bg-[var(--theme-accent,#fb7185)] shadow-[2px_2px_0_rgba(0,0,0,1)] scale-125`;
      if (settings.theme === UITheme.CALM) return `${shape} border-2 border-white bg-[var(--theme-accent,#fb7185)] shadow-[0_0_12px_var(--theme-accent-glow,rgba(251,113,133,0.3))] scale-125`;
      if (settings.theme === UITheme.BEER) return `${shape} border-2 border-amber-300 bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.9)] scale-125`;
      if (settings.theme === UITheme.STARS) return `${shape} border-2 border-white bg-slate-200 shadow-[0_0_16px_rgba(255,255,255,0.9)] scale-125`;
      return `${shape} border-2 border-emerald-400 bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.8)] scale-125`;
    }
    if (settings.theme === UITheme.METRO) return `${shape} border-2 border-zinc-600 bg-zinc-900 shadow-md`;
    return `${shape} border-2 border-white bg-slate-800 shadow-md`;
  }, [settings.theme]);

  const getDragAvatarRingClasses = useCallback((isHovered: boolean) => {
    const shape = 'rounded-full';
    if (isHovered) {
      if (settings.theme === UITheme.METRO) return `${shape} scale-110 border-4 border-[var(--theme-accent,#fb7185)] shadow-[4px_4px_0_rgba(0,0,0,1)]`;
      if (settings.theme === UITheme.CALM) return `${shape} scale-110 border-4 border-[var(--theme-accent,#fb7185)] shadow-[0_0_25px_var(--theme-accent-glow,rgba(251,113,133,0.3))]`;
      if (settings.theme === UITheme.BEER) return `${shape} scale-110 border-4 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.8)]`;
      if (settings.theme === UITheme.STARS) return `${shape} scale-110 border-4 border-slate-200 shadow-[0_0_35px_rgba(226,232,240,0.85)]`;
      return `${shape} scale-110 border-4 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.8)]`;
    }
    if (settings.theme === UITheme.METRO) return `${shape} border-2 border-zinc-400`;
    if (settings.theme === UITheme.BEER) return `${shape} border-2 border-amber-500/40`;
    if (settings.theme === UITheme.STARS) return `${shape} border-2 border-white/30`;
    return `${shape} border-2 border-white`;
  }, [settings.theme]);

  const handlePartnerPointerDown = (e: React.PointerEvent, playerId: string) => {
    e.stopPropagation();
    sharedBusDragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      playerId,
      isDragging: false,
    };

    let lastX = e.clientX;

    const handlePartnerPointerMove = (moveEvent: PointerEvent) => {
      if (!sharedBusDragStartRef.current) return;

      const dx = moveEvent.clientX - sharedBusDragStartRef.current.x;
      const dy = moveEvent.clientY - sharedBusDragStartRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!sharedBusDragStartRef.current.isDragging && dist > 8) {
        sharedBusDragStartRef.current.isDragging = true;
        setDraggedSharedBusPartnerId(playerId);
        triggerHaptic('light');
      }

      if (sharedBusDragStartRef.current.isDragging) {
        if (sharedBusAnimFrameRef.current) {
          cancelAnimationFrame(sharedBusAnimFrameRef.current);
        }

        const currentX = moveEvent.clientX;
        const tilt = (currentX - lastX) * 1.5;
        lastX = currentX;

        sharedBusAnimFrameRef.current = requestAnimationFrame(() => {
          setSharedBusDragPos({ x: moveEvent.clientX, y: moveEvent.clientY });
          setSharedBusDragTilt(Math.max(-15, Math.min(15, tilt)));

          let nearBus = false;
          const busEl = busCrashRef.current;
          if (busEl) {
            const rect = busEl.getBoundingClientRect();
            nearBus = (
              moveEvent.clientX >= rect.left - 40 &&
              moveEvent.clientX <= rect.right + 40 &&
              moveEvent.clientY >= rect.top - 50 &&
              moveEvent.clientY <= rect.bottom + 50
            );
          }

          if (nearBus !== isHoveredOverBusRef.current) {
            isHoveredOverBusRef.current = nearBus;
            setIsHoveredOverBus(nearBus);
            if (nearBus) {
              triggerHaptic('tick');
            }
          }
        });
      }
    };

    const handlePartnerPointerUp = (upEvent: PointerEvent) => {
      if (sharedBusAnimFrameRef.current) {
        cancelAnimationFrame(sharedBusAnimFrameRef.current);
      }

      const startInfo = sharedBusDragStartRef.current;
      sharedBusDragStartRef.current = null;

      window.removeEventListener('pointermove', handlePartnerPointerMove);
      window.removeEventListener('pointerup', handlePartnerPointerUp);
      window.removeEventListener('pointercancel', handlePartnerPointerUp);

      const wasDragging = startInfo?.isDragging;
      const nearBus = isHoveredOverBusRef.current;

      setDraggedSharedBusPartnerId(null);
      setSharedBusDragPos(null);
      setSharedBusDragTilt(0);
      setIsHoveredOverBus(false);
      isHoveredOverBusRef.current = false;

      // Drag-to-bus OR tap-to-board (matching PyramidMatchModal behavior)
      if (wasDragging && nearBus) {
        const partner = players.find((p) => p.id === playerId) || null;
        if (partner) {
          handleInPlaceSharedBusSelection(partner);
        }
      } else if (!wasDragging) {
        // Simple tap — board directly like match modal
        const partner = players.find((p) => p.id === playerId) || null;
        if (partner) {
          handleInPlaceSharedBusSelection(partner);
        }
      }
    };

    window.addEventListener('pointermove', handlePartnerPointerMove);
    window.addEventListener('pointerup', handlePartnerPointerUp);
    window.addEventListener('pointercancel', handlePartnerPointerUp);
  };
  const startPhysicalBus = (passengersOverride?: Player[], options?: { skipEntrance?: boolean; showEntrance?: boolean }) => {
    setImmunePlayerId(null);
    setPlayers(prev => prev.map(p => ({ ...p, isImmune: false })));
    
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
      scheduleGameEvent('bus-entrance', 3000, { type: 'BUS_ENTRANCE_DONE', passengers, mode: 'physical' });
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
    const unrevealed = busCards.slice(currentBusIndex + 1);
    let tempAvailableDeck = shuffleDeck([...busDeck, ...unrevealed]);
    let newOldCardsCount = 0;
    let newDecksUsed = busDecksUsed;
    let newExtraDecks = [...extraDecks];
    // Calculate how many cards of the current pack were discarded in this failed attempt
    const discardedInThisRun = Math.max(0, currentBusIndex + 1 - oldCardsInLayoutCount);
    let nextDiscardedCardsCount = discardedCardsCount + discardedInThisRun;
    // If the current deck is exhausted or has less than configuredBusLength cards left
    if (tempAvailableDeck.length < configuredBusLength) {
      if (newDecksUsed >= settings.busDecks || newExtraDecks.length === 0) {
        // Win condition: if remaining cards in the active deck are less than 2, they win!
        if (tempAvailableDeck.length < 2) {
          setIsBusWon(true);
          playSound('celebrate');
          setImmunePlayerId(busPassengers[0].id);
          setFeedback({ text: t('Geen kaarten meer! Je bent vrij!'), type: 'success' });
          setBusCards([]); // Clear the layout
          setBusDeck([]);
          return;
        }
      } else {
        // Load a new deck from extraDecks
        const nextDeck = newExtraDecks.shift()!;
        setExtraDecks(newExtraDecks);
        setCurrentPackCards(nextDeck);
        
        // Track how many cards from the old deck are being put in the layout
        newOldCardsCount = tempAvailableDeck.length;
        
        // Combine the remaining cards of the old deck with the new deck
        // Put the old deck cards at the FRONT of the tempAvailableDeck so they are drawn first!
        tempAvailableDeck = [...tempAvailableDeck, ...nextDeck];
        
        newDecksUsed = newDecksUsed + 1;
        setBusDecksUsed(newDecksUsed);
        nextDiscardedCardsCount = 0; // Reset discarded count for the new pack
        playSound('reshuffle');
        setShowReshuffleBanner(true);
        scheduleGameEvent('reshuffle-banner', 2500, { type: 'RESHUFFLE_DONE' });
      }
    }
    setDiscardedCardsCount(nextDiscardedCardsCount);
    setOldCardsInLayoutCount(newOldCardsCount);
    const cardsToDraw = Math.min(configuredBusLength, tempAvailableDeck.length);
    const newBusCards = tempAvailableDeck.slice(0, cardsToDraw);
    setBusDeck(tempAvailableDeck.slice(cardsToDraw));
    setBusCards(newBusCards);
    setCurrentBusIndex(1);
    setFeedback(null); // No pop-up feedback message
    setIsBusDeckExhausted(false);
  };
  const handleBusGuess = (guess: 'HIGHER' | 'LOWER' | 'EQUAL') => {
    const prevCard = busCards[currentBusIndex - 1];
    let targetCard = busCards[currentBusIndex];
    let isHigher = targetCard.rank > prevCard.rank;
    let isLower = targetCard.rank < prevCard.rank;
    let isEqual = targetCard.rank === prevCard.rank;
    let correct = false;
    if (guess === 'HIGHER' && isHigher) correct = true;
    if (guess === 'LOWER' && isLower) correct = true;
    if (guess === 'EQUAL' && isEqual) correct = true;
    const isDevPassenger = busPassengers.some(p => p.isDev) || players.some(p => p.isDev) || devModeArmed;
    if (devSettings.alwaysWin && isDevPassenger && !correct) {
      const validIndex = busDeck.findIndex(c => {
         if (guess === 'HIGHER') return c.rank > prevCard.rank;
         if (guess === 'LOWER') return c.rank < prevCard.rank;
         if (guess === 'EQUAL') return c.rank === prevCard.rank;
         return false;
      });
      
      if (validIndex !== -1) {
         const matchingCard = busDeck[validIndex];
         setBusDeck(prev => {
           const next = [...prev];
           next.splice(validIndex, 1);
           next.push(targetCard);
           return next;
         });
         setBusCards(prev => {
           const next = [...prev];
           next[currentBusIndex] = matchingCard;
           return next;
         });
         targetCard = matchingCard;
         correct = true;
      } else {
         targetCard = { ...targetCard };
         targetCard.rank = guess === 'HIGHER' ? Math.min(14, prevCard.rank + 1) :
                           guess === 'LOWER' ? Math.max(2, prevCard.rank - 1) :
                           prevCard.rank;
         setBusCards(prev => {
           const next = [...prev];
           next[currentBusIndex] = targetCard;
           return next;
         });
         correct = true;
      }
    }
    if (correct) {
      triggerHaptic('success');
      playSound('busStep');
      if (currentBusIndex === busCards.length - 1) {
        setIsBusWon(true);
        playSound('celebrate');
        setImmunePlayerId(busPassengers[0].id);
        const isFirstTry = busAttempts <= 1 && busSipsTaken === 0;
        if (settings.busLength >= 20 && isFirstTry) {
          setIsGalaxyUnlocked(true);
          try { localStorage.setItem(GALAXY_UNLOCKED_KEY, 'true'); } catch {}
          setIsGalaxyCelebrationOpen(true);
        }
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
      setBusSipsTaken(prev => prev + sips);
      setBusAttempts(prev => prev + 1);
      updatePlayers(Object.fromEntries(
        busPassengers.map(bp => [bp.id, (player: Player) => ({ ...player, drinksTaken: player.drinksTaken + sips })])
      ));
      setTimeout(restartBus, 2500);
      scheduleGameEvent('bus-fail-restart', 2500, { type: 'BUS_FAIL' });
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
        const isFirstTry = busAttempts <= 1 && busSipsTaken === 0;
        if (settings.busLength >= 20 && isFirstTry) {
          setIsGalaxyUnlocked(true);
          try { localStorage.setItem(GALAXY_UNLOCKED_KEY, 'true'); } catch {}
          setIsGalaxyCelebrationOpen(true);
        }
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
    setBusSipsTaken(prev => prev + sips);
    setBusAttempts(prev => prev + 1);
    updatePlayers(Object.fromEntries(
      busPassengers.map(bp => [bp.id, (player: Player) => ({ ...player, drinksTaken: player.drinksTaken + sips })])
    ));
    setPhysicalBusPosition(2);
    setIsBusWon(false);
  };
  useEffect(() => {
    const handleGameEvent = (event: GameEngineEvent) => {
      switch (event.type) {
        case 'START_BUS':
          setLoserReveal(null);
          if (settings.sharedBus && phase !== GamePhase.BUS_TEAM_SELECTION) {
            setBusMode(settings.mode === GameMode.PHYSICAL ? 'physical' : 'digital');
            setPhase(GamePhase.BUS_TEAM_SELECTION);
            return;
          }
          startBus(event.passengers, { showEntrance: event.showEntrance });
          return;
        case 'BUS_ENTRANCE_DONE':
          if (event.mode === 'physical') {
            startPhysicalBus(event.passengers, { skipEntrance: true });
          } else {
            startDigitalBus(event.passengers, { skipEntrance: true });
          }
          return;
        case 'BUS_FAIL':
          restartBus();
          return;
        case 'RESHUFFLE_DONE':
          setShowReshuffleBanner(false);
          return;
        case 'PYRAMID_REVEAL':
          revealPyramidCard(event.rowIndex, event.cardIndex);
          return;
        case 'NEXT_PLAYER':
          nextPlayerTurn();
          return;
        case 'LOSER_REVEAL_DONE':
          setLoserReveal(null);
          return;
        case 'SCREEN_SHAKE_DONE':
          setScreenShake(false);
          return;
        case 'BUS_WIN_BURST_DONE':
          setBusWinBurst(false);
          return;
        case 'PYRAMID_WARNING_FEEDBACK_DONE':
          setFeedback(null);
          setPulseValidCards(false);
          return;
        case 'PYRAMID_WARNING_COOLDOWN_DONE':
          setWarningCooldown(false);
          return;
      }
    };
    registerGameEventHandler(handleGameEvent);
  });
  // --- RENDERING HELPERS ---
  const renderAdLoadingModal = () => (
    <AdLoadingModal
      isOpen={isAdLoading}
      t={t}
      lang={lang}
    />
  );
  const renderColorPickerModal = () => null;
  const renderQuitModal = () => (
    <QuitConfirmModal
      isOpen={showQuitConfirm}
      t={t}
      onCancel={() => setShowQuitConfirm(false)}
      onConfirm={handleQuitGame}
    />
  );
  const renderDevModeOrb = () => {
    if (!devModeArmed) return null;
    return (
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div 
          className="rounded-full animate-in fade-in zoom-in-0 duration-1000 ease-out" 
          style={{ 
            width: '200vmax', 
            height: '200vmax', 
            background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.25), transparent 50%)',
            mixBlendMode: 'screen'
          }}
        />
      </div>
    );
  };
  const renderActiveSlot = (idx: number, step?: number) => {
    const commonClasses = "w-20 h-28 flex flex-col items-center justify-center flex-none transition-all duration-300";
    const slotStep = step ?? (idx + 1);
    
    if (settings.theme === UITheme.STARS) {
      return (
        <div 
          key={`current-${idx}`} 
          className={`${commonClasses} stars-aperture rounded-2xl relative overflow-hidden backdrop-blur-2xl transition-transform duration-300 border border-white/10`} 
          style={{ zIndex: idx }}
        >
          {/* Subtle celestial orbit */}
          <div className="absolute inset-2.5 rounded-full border border-white/10 animate-card-celestial-cw pointer-events-none" />

          <div className="flex flex-col items-center justify-center relative z-10 text-slate-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
            {slotStep === 1 && <Sparkles size={18} />}
            {slotStep === 2 && <ArrowUpDown size={18} />}
            {slotStep === 3 && <div className="flex gap-0.5 items-center justify-center"><ArrowRight size={10} className="rotate-180" /><ArrowRight size={10} /></div>}
            {slotStep === 4 && <Zap size={18} />}
          </div>
        </div>
      );
    }

    if (settings.theme === UITheme.METRO) {
      return (
        <div key={`current-${idx}`} className={`${commonClasses} ${isDiscoActive ? 'rounded-xl' : 'rounded-none'} border-2 border-[var(--theme-accent)] bg-[var(--theme-accent)]/10 shadow-[4px_4px_0_rgba(0,0,0,0.5)]`} style={{ zIndex: idx }}>
          <div className="text-[var(--theme-accent)] opacity-80 mb-1">
            {slotStep === 1 && <Sparkles size={18} />}
            {slotStep === 2 && <ArrowUpDown size={18} />}
            {slotStep === 3 && <div className="flex gap-0.5 items-center justify-center"><ArrowRight size={10} className="rotate-180" /><ArrowRight size={10} /></div>}
            {slotStep === 4 && <Zap size={18} />}
          </div>
          <span className="text-[var(--theme-accent)] font-mono font-black text-xl">_?</span>
        </div>
      );
    }
    
    if (settings.theme === UITheme.CALM) {
      return (
        <div key={`current-${idx}`} className={`${commonClasses} rounded-xl border border-white/10 bg-white/[0.01]`} style={{ zIndex: idx }}>
          <div className="text-[var(--theme-accent)] opacity-30 mb-1">
            {slotStep === 1 && <Sparkles size={18} />}
            {slotStep === 2 && <ArrowUpDown size={18} />}
            {slotStep === 3 && <div className="flex gap-0.5 items-center justify-center"><ArrowRight size={10} className="rotate-180" /><ArrowRight size={10} /></div>}
            {slotStep === 4 && <Zap size={18} />}
          </div>
          <span className="text-[var(--theme-accent)] font-light italic text-xl opacity-60">?</span>
        </div>
      );
    }
    if (settings.theme === UITheme.BEER) {
      return (
        <div key={`current-${idx}`} className={`${commonClasses} rounded-xl border-2 border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.3)]`} style={{ zIndex: idx }}>
          <div className="text-amber-500 opacity-80 mb-1">
            {slotStep === 1 && <Sparkles size={20} />}
            {slotStep === 2 && <ArrowUpDown size={20} />}
            {slotStep === 3 && <div className="flex gap-0.5 items-center justify-center"><ArrowRight size={12} className="rotate-180" /><ArrowRight size={12} /></div>}
            {slotStep === 4 && <Zap size={20} />}
          </div>
          <span className="text-amber-500 font-black text-xl">?</span>
        </div>
      );
    }
    // Classic
    return (
      <div key={`current-${idx}`} className={`${commonClasses} rounded-xl bg-green-500/20 border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]`} style={{ zIndex: idx }}>
        <div className="text-green-500 opacity-60 mb-1">
          {slotStep === 1 && <Sparkles size={20} />}
          {slotStep === 2 && <ArrowUpDown size={20} />}
          {slotStep === 3 && <div className="flex gap-0.5 items-center justify-center"><ArrowRight size={12} className="rotate-180" /><ArrowRight size={12} /></div>}
          {slotStep === 4 && <Zap size={20} />}
        </div>
        <span className="text-green-500 font-black text-xl drop-shadow-md">?</span>
      </div>
    );
  };

  const handleClosePlayerHand = () => {
    if (!isHandTrayOpen || isHandClosing) return;
    setIsHandClosing(true);
    setTimeout(() => {
      setIsHandTrayOpen(false);
      setPlayerHandToView(null);
      setIsMoreHandMode(false);
      setIsHandClosing(false);
      setMoreHeaderScroll({ canLeft: false, canRight: false });
    }, 200);
  };

  const handleTogglePlayerHand = (player: Player) => {
    triggerHaptic('light');
    if (isHandTrayOpen && playerHandToView?.id === player.id && !isMoreHandMode) {
      handleClosePlayerHand();
    } else {
      setIsHandClosing(false);
      setIsMoreHandMode(false);
      setPlayerHandToView(player);
      setIsHandTrayOpen(true);
    }
  };

  const handleOpenMoreHand = () => {
    triggerHaptic('light');
    if (isHandTrayOpen && isMoreHandMode) {
      handleClosePlayerHand();
    } else {
      setIsHandClosing(false);
      setIsMoreHandMode(true);
      setPlayerHandToView(null);
      setIsHandTrayOpen(true);
    }
  };

  const renderPyramidHandTray = () => {
    if (!isHandTrayOpen) return null;
    const currentPlayerObj = playerHandToView ? (players.find(p => p.id === playerHandToView.id) || playerHandToView) : null;
    const cards = currentPlayerObj ? currentPlayerObj.hand : [];
    const isClosing = isHandClosing;
    const animClass = isClosing ? 'animate-hand-tray-exit' : 'animate-hand-tray-enter';

    const victim = findLoser();
    const sortedPlayers = [...players].sort((a, b) => {
      if (victim) {
        if (a.id === victim.id) return -1;
        if (b.id === victim.id) return 1;
      }
      return b.hand.length - a.hand.length;
    });
    const morePlayers = sortedPlayers.slice(3);
    const themeScrollColors = getThemeScrollColors(settings.theme);

    return (
      <>
        {/* Backdrop overlay: tapping anywhere on screen outside hand closes it */}
        <div 
          className={`fixed inset-0 z-30 bg-black/50 backdrop-blur-[3px] transition-opacity duration-200 cursor-pointer ${
            isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          onClick={handleClosePlayerHand}
        />
        {/* Hand Tray container matching the round hand component style and size */}
        <div className="fixed left-0 right-0 z-40 px-2 pointer-events-none" style={{ top: 'calc(var(--safe-top, 0px) + 4.8rem)' }}>
          <div className="w-full pointer-events-auto">
            <div className={`${getHandContainerClasses()} ${animClass} !mb-0 shadow-[0_25px_60px_rgba(0,0,0,0.7)] ring-1 ring-white/15`}>
              {/* Table Felt Texture */}
              {settings.theme === UITheme.CLASSIC && <div className="absolute inset-0 bg-[#0f172a]/50 mix-blend-overlay pointer-events-none" />}
              
              {/* Header inside hand tray - compact to match normal hand header size */}
              <div className="relative flex items-center justify-between px-1 mb-2 min-h-[28px] gap-2">
                {isMoreHandMode ? (
                  /* Profile pictures and names in the header with scroll indicator */
                  <div className="relative flex-1 min-w-0 flex items-center">
                    {/* Left edge scroll indicator */}
                    {moreHeaderScroll.canLeft && (
                      <div 
                        className="pointer-events-none absolute left-0 top-0 bottom-0 z-20 flex items-center pl-0.5 pr-2 transition-opacity duration-200"
                        style={{ background: `linear-gradient(to right, ${themeScrollColors.gradientFrom}, transparent)` }}
                      >
                        <ChevronLeft 
                          size={12} 
                          style={{
                            color: themeScrollColors.accent,
                            filter: `drop-shadow(0 0 4px ${themeScrollColors.glow})`,
                          }} 
                        />
                      </div>
                    )}

                    <div 
                      id="more-players-scroll-header"
                      ref={moreHeaderRef}
                      onScroll={handleMoreHeaderScroll}
                      className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 w-full"
                      style={{
                        WebkitMaskImage: moreHeaderScroll.canLeft && moreHeaderScroll.canRight
                          ? 'linear-gradient(to right, transparent 0px, black 12px, black calc(100% - 16px), transparent 100%)'
                          : moreHeaderScroll.canRight
                          ? 'linear-gradient(to right, black calc(100% - 16px), transparent 100%)'
                          : moreHeaderScroll.canLeft
                          ? 'linear-gradient(to right, transparent 0px, black 12px)'
                          : undefined,
                        maskImage: moreHeaderScroll.canLeft && moreHeaderScroll.canRight
                          ? 'linear-gradient(to right, transparent 0px, black 12px, black calc(100% - 16px), transparent 100%)'
                          : moreHeaderScroll.canRight
                          ? 'linear-gradient(to right, black calc(100% - 16px), transparent 100%)'
                          : moreHeaderScroll.canLeft
                          ? 'linear-gradient(to right, transparent 0px, black 12px)'
                          : undefined,
                      }}
                    >
                      {morePlayers.map((p) => {
                        const isLoser = victim && p.id === victim.id;
                        const hasCards = p.hand.length > 0;
                        const isSelected = playerHandToView?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              triggerHaptic('light');
                              if (isSelected) {
                                setPlayerHandToView(null);
                              } else {
                                setPlayerHandToView(p);
                              }
                            }}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all cursor-pointer shrink-0 ${
                              isSelected
                                ? 'bg-amber-500/25 border-amber-400 ring-1 ring-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.35)]'
                                : 'bg-black/30 hover:bg-white/10 border-white/10'
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full relative overflow-hidden flex items-center justify-center shrink-0">
                              {isLoser && (
                                <div 
                                  className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full pointer-events-none"
                                  style={{ background: 'conic-gradient(from 0deg, #f59e0b, #ef4444, #f59e0b)' }}
                                />
                              )}
                              <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center relative z-10 ${isLoser ? 'm-[1px] w-[calc(100%-2px)] h-[calc(100%-2px)]' : 'border border-amber-500'}`}>
                                <PlayerAvatar
                                  player={p}
                                  size="custom"
                                  className="w-full h-full text-[9px]"
                                  theme={settings.theme}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {isLoser && <Bus size={9} className="text-red-500 shrink-0" />}
                              <span className="text-[11px] font-bold text-white leading-tight truncate max-w-[70px] sm:max-w-[100px]">{p.name}</span>
                              <span className={`text-[9px] font-mono font-bold leading-tight ${
                                isSelected ? 'text-white' : isLoser ? 'text-amber-400' : hasCards ? 'text-amber-400' : 'text-slate-500'
                              }`}>
                                {p.hand.length}/4
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Right edge scroll indicator */}
                    {moreHeaderScroll.canRight && (
                      <div 
                        className="pointer-events-none absolute right-0 top-0 bottom-0 z-20 flex items-center pr-0.5 pl-2 transition-opacity duration-200"
                        style={{ background: `linear-gradient(to left, ${themeScrollColors.gradientFrom}, transparent)` }}
                      >
                        <ChevronRight 
                          size={12} 
                          style={{
                            color: themeScrollColors.accent,
                            filter: `drop-shadow(0 0 4px ${themeScrollColors.glow})`,
                          }} 
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* Single player header */
                  <div className="flex items-center gap-1.5 min-w-0">
                    {(() => {
                      const isSingleLoser = victim && currentPlayerObj?.id === victim.id;
                      return (
                        <div className={`w-5 h-5 rounded-full relative overflow-hidden flex items-center justify-center shrink-0 ${
                          isSingleLoser ? 'p-[1px]' : 'border border-amber-500'
                        }`}>
                          {isSingleLoser && (
                            <div 
                              className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full pointer-events-none"
                              style={{ background: 'conic-gradient(from 0deg, #f59e0b, #ef4444, #f59e0b)' }}
                            />
                          )}
                          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative z-10">
                            <PlayerAvatar
                              player={currentPlayerObj}
                              size="custom"
                              className="w-full h-full text-[9px]"
                              theme={settings.theme}
                            />
                          </div>
                        </div>
                      );
                    })()}
                    <span className="text-[11px] font-bold text-white tracking-wide truncate max-w-[80px] sm:max-w-[160px]">
                      {currentPlayerObj?.name}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest opacity-60 ml-2 hidden sm:inline">
                      {t("Huidige Hand")}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 sm:gap-3.5 ml-auto shrink-0">
                  {currentPlayerObj && (
                    <div className="flex items-center gap-2 sm:gap-3.5 text-right">
                      {/* Sips drunk */}
                      <div className="flex flex-col items-end leading-none" title={t("Slokken gedronken")}>
                        <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold tracking-wider whitespace-nowrap">
                          <span className="hidden sm:inline">{t("Slokken gedronken")}</span>
                          <span className="sm:hidden">{t("Gedronken")}</span>
                        </span>
                        <span className="text-red-400 font-black font-mono text-xs sm:text-sm md:text-base leading-tight drop-shadow-sm flex items-center gap-1 mt-0.5">
                          <Beer size={12} className="shrink-0" />
                          {currentPlayerObj.drinksTaken}
                        </span>
                      </div>

                      {/* Sips distributed */}
                      <div className="flex flex-col items-end leading-none" title={t("Slokken uitgedeeld")}>
                        <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold tracking-wider whitespace-nowrap">
                          <span className="hidden sm:inline">{t("Slokken uitgedeeld")}</span>
                          <span className="sm:hidden">{t("Uitgedeeld")}</span>
                        </span>
                        <span className="text-emerald-400 font-black font-mono text-xs sm:text-sm md:text-base leading-tight drop-shadow-sm flex items-center gap-1 mt-0.5">
                          <Gift size={12} className="shrink-0" />
                          {currentPlayerObj.drinksDistributed}
                        </span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleClosePlayerHand}
                    className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors active:scale-95 cursor-pointer shrink-0 ml-0.5"
                    aria-label="Close hand"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Cards row using the EXACT same components as normal hand */}
              <div className="relative flex justify-center items-center py-2 gap-2 sm:gap-3 px-2">
                {settings.mode === GameMode.DIGITAL ? (
                  Array.from({ length: 4 }).map((_, slotIdx) => {
                    const cardInSlot = cards.find(c => c.roundIndex === slotIdx) ?? (cards.every(c => c.roundIndex === undefined) ? cards[slotIdx] : undefined);
                    if (cardInSlot) {
                      return (
                        <div
                          key={`${currentPlayerObj?.id || 'hand'}-${cardInSlot.id || slotIdx}`}
                          className="flex-none transition-transform hover:-translate-y-2 duration-200 origin-bottom animate-card-hand-subtle"
                          style={{ zIndex: slotIdx }}
                        >
                          <PlayingCard card={cardInSlot} size="base" className="shadow-lg" style={settings.cardStyle} />
                        </div>
                      );
                    } else {
                      return renderActiveSlot(slotIdx);
                    }
                  })
                ) : (
                  <div className="w-full flex justify-center gap-2 sm:gap-3">
                    {Array.from({ length: 4 }).map((_, slotIdx) => {
                      const cardInSlot = cards.find(c => c.roundIndex === slotIdx) ?? (cards.every(c => c.roundIndex === undefined) ? cards[slotIdx] : undefined);
                      if (cardInSlot) {
                        return (
                          <div
                            key={`${currentPlayerObj?.id || 'hand'}-phys-${cardInSlot.id || slotIdx}`}
                            className="w-20 h-28 rounded-xl bg-[#1e40af] border-[3px] border-white shadow-lg flex items-center justify-center flex-none overflow-hidden relative animate-card-hand-subtle"
                            style={{ zIndex: slotIdx }}
                          >
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
                      } else {
                        return renderActiveSlot(slotIdx);
                      }
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };
  const renderSettingsModal = () => (isSettingsOpen && phase !== GamePhase.SETUP) && (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={(e) => { if (e.target === e.currentTarget) setIsSettingsOpen(false); }}>
      <div className="w-full max-w-sm m-4 relative animate-in zoom-in-50 duration-300">
        <button 
          onClick={() => setIsSettingsOpen(false)}
          className="absolute -top-12 right-0 w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-slate-700 active:scale-95 transition-all shadow-lg border border-slate-700"
        >
          <X size={20} />
        </button>
        <SettingsPanel
          isOpen={true}
          hideHeader={true}
          disabled={false}
          settings={settings}
          playerCount={players.length}
          t={t}
          onToggleOpen={() => {}}
          onOpenMoreSettings={() => { setIsSettingsOpen(false); setIsMoreSettingsOpen(true); }}
          onSettingsChange={(key, val) => setSettings(prev => ({ ...prev, [key]: val }))}
          onCommitSettings={(newValues) => {
            if (newValues) {
              setSettings(prev => ({ ...prev, ...newValues }));
            }
          }}
        />
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
  const renderToTheBusButton = (onClick: () => void, extraClasses: string = '') => {
    const label = t("NAAR DE BUS");
    if (settings.theme === UITheme.STARS) {
      return (
        <button
          onClick={onClick}
          className={`w-full py-3.5 pl-8 pr-2.5 rounded-full text-white font-medium text-sm sm:text-base tracking-[0.18em] uppercase shadow-[0_0_25px_rgba(255,255,255,0.08),inset_0_0_12px_rgba(226,232,240,0.06)] active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer border border-white/20 border-t-white/40 no-calm-override ${extraClasses}`}
          style={{ 
            background: 'linear-gradient(180deg, #181d2c 0%, #070911 100%)',
            fontFamily: "'Outfit', sans-serif" 
          }}
        >
          <span>{label}</span>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/15 transition-all border border-white/10">
            <Bus size={20} className="text-white" />
          </div>
        </button>
      );
    }
    if (settings.theme === UITheme.CALM) {
      return (
        <button
          onClick={onClick}
          className={`w-full py-3.5 pl-8 pr-2.5 rounded-full font-medium text-sm sm:text-base tracking-[0.18em] uppercase active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer no-calm-override ${extraClasses}`}
          style={{
            backgroundColor: 'var(--theme-accent, #fb7185)',
            color: 'var(--theme-btn-text, #ffffff)',
            boxShadow: '0 8px 30px var(--theme-accent-glow, rgba(251, 113, 133, 0.35))',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <span>{label}</span>
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-all"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
          >
            <Bus size={20} style={{ color: 'var(--theme-btn-text, #ffffff)' }} />
          </div>
        </button>
      );
    }
    if (settings.theme === UITheme.METRO) {
      return (
        <button
          onClick={onClick}
          className={`w-full py-3.5 pl-8 pr-2.5 rounded-none bg-[var(--theme-accent)] text-slate-950 font-mono font-black text-sm sm:text-base tracking-widest uppercase border-2 border-white shadow-[4px_4px_0_rgba(0,0,0,0.8)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-between group cursor-pointer ${extraClasses}`}
        >
          <span>{label}</span>
          <div className="w-10 h-10 rounded-none bg-slate-950/20 flex items-center justify-center group-hover:scale-110 transition-all">
            <Bus size={20} className="text-slate-950" />
          </div>
        </button>
      );
    }
    if (settings.theme === UITheme.BEER) {
      return (
        <button
          onClick={onClick}
          className={`w-full py-3.5 pl-8 pr-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 font-black text-sm sm:text-base tracking-wider uppercase shadow-[0_6px_20px_rgba(245,158,11,0.4)] border-t border-amber-300 active:scale-95 transition-all flex items-center justify-between group cursor-pointer ${extraClasses}`}
        >
          <span>{label}</span>
          <div className="w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center group-hover:scale-110 transition-all">
            <Bus size={20} className="text-slate-950" />
          </div>
        </button>
      );
    }
    return (
      <button
        onClick={onClick}
        className={`w-full py-3.5 pl-8 pr-2.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-black text-sm sm:text-base tracking-[0.18em] uppercase shadow-[0_8px_25px_rgba(220,38,38,0.4)] active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer border-t border-red-400 ${extraClasses}`}
      >
        <span>{label}</span>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all">
          <Bus size={20} className="text-white" />
        </div>
      </button>
    );
  };
  // Global Dev Menu logic
  const isDevMenuVisible = (() => {
    if (!players.some(p => p.isDev) && !devModeArmed) return false;
    if (phase === GamePhase.PYRAMID) return players.some(p => p.isDev) || devModeArmed;
    if (phase === GamePhase.ROUNDS_1_4) return !!activePlayer?.isDev || devModeArmed;
    if (phase === GamePhase.THE_BUS || phase === GamePhase.BUS_TEAM_SELECTION) return busPassengers.some(p => p.isDev) || players.some(p => p.isDev) || devModeArmed;
    return false;
  })();
  const renderDevMenu = (className = "") => {
    if (!isDevMenuVisible) return null;
    return (
      <div 
        className={`relative flex items-center z-[100] ${className}`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Backdrop for outside click dismissal */}
        {isDevMenuOpen && (
          <div 
            className="fixed inset-0 z-[105]" 
            onClick={(e) => { e.stopPropagation(); setIsDevMenuOpen(false); }} 
            onPointerDown={(e) => { e.stopPropagation(); setIsDevMenuOpen(false); }}
          />
        )}
        <div 
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={`fixed left-1/2 -translate-x-1/2 top-16 sm:absolute sm:top-full sm:right-0 sm:left-auto sm:translate-x-0 sm:mt-2 flex items-center gap-1.5 bg-slate-900/95 border border-green-500/40 rounded-full px-3 py-1.5 shadow-[0_0_20px_rgba(34,197,94,0.3)] backdrop-blur-xl transition-all duration-200 origin-center sm:origin-top-right z-[110] max-w-[95vw] ${isDevMenuOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}`}
        >
            <button 
              onClick={(e) => { e.stopPropagation(); setDevSettings(p => ({ ...p, alwaysWin: !p.alwaysWin })); }}
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${devSettings.alwaysWin ? 'bg-green-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
              title={t("Altijd Winnen")}
            >
              <Check size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setDevSettings(p => ({ ...p, peekCards: !p.peekCards })); }}
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${devSettings.peekCards ? 'bg-purple-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
              title={t("X-Ray Visie")}
            >
              <Eye size={14} />
            </button>
            
            <select
              value=""
              onChange={(e) => { 
                e.stopPropagation();
                if (e.target.value === '1') confirmStart(settings.mode);
                if (e.target.value === '2') {
                  let currentDeck = deck.length > 0 ? [...deck] : shuffleDeck(createDeck());
                  const updatedPlayers = players.map(p => {
                    const cardsNeeded = 4 - p.hand.length;
                    if (cardsNeeded > 0 && currentDeck.length >= cardsNeeded) {
                      const newCards = currentDeck.splice(0, cardsNeeded).map((c, idx) => ({
                        ...c,
                        roundIndex: p.hand.length + idx,
                      }));
                      return { ...p, hand: [...p.hand, ...newCards] };
                    }
                    return p;
                  });
                  setPlayers(updatedPlayers);
                  setDeck(currentDeck);
                  initializePyramid();
                }
                if (e.target.value === '3') {
                  // Switch to the done pyramid screen with all cards face up, then trigger the bus crash animation
                  let currentDeck = deck.length > 0 ? [...deck] : shuffleDeck(createDeck());
                  const updatedPlayers = players.map(p => {
                    const cardsNeeded = 4 - p.hand.length;
                    if (cardsNeeded > 0 && currentDeck.length >= cardsNeeded) {
                      const newCards = currentDeck.splice(0, cardsNeeded).map((c, idx) => ({
                        ...c,
                        roundIndex: p.hand.length + idx,
                      }));
                      return { ...p, hand: [...p.hand, ...newCards] };
                    }
                    return p;
                  });

                  let currentPyramid = pyramid;
                  const required = (settings.pyramidRows * (settings.pyramidRows + 1)) / 2;
                  if (!currentPyramid || currentPyramid.length !== settings.pyramidRows) {
                    if (currentDeck.length < required) currentDeck = shuffleDeck(createDeck());
                    const newPyramid: Card[][] = [];
                    for (let i = 1; i <= settings.pyramidRows; i++) {
                      const rowCards: Card[] = [];
                      for (let j = 0; j < i; j++) {
                        rowCards.push(currentDeck.pop()!);
                      }
                      newPyramid.push(rowCards);
                    }
                    currentPyramid = newPyramid;
                  }

                  const allPyramidCardIds = new Set<string>();
                  currentPyramid.forEach(row => {
                    row.forEach(card => {
                      if (card?.id) allPyramidCardIds.add(card.id);
                    });
                  });

                  setPlayers(updatedPlayers);
                  setDeck(currentDeck);
                  setPyramid(currentPyramid);
                  setRevealedPyramidCards(allPyramidCardIds);
                  setIsPyramidComplete(true);
                  setIsPyramidDoubleSetup(false);
                  setPendingMatches(null);
                  setDistributeBanner(null);
                  setFeedback(null);
                  setLoserReveal(null);
                  setIsSelectingBusPlayer(false);
                  setIsBusCrashing(false);
                  setIsBusDeparting(false);
                  setJumpingBusPlayer(null);
                  setPyramidScatterCards(false);
                  setBusVerticalOffset(null);

                  setPhase(GamePhase.PYRAMID);

                  const forced = devSettings.forceBusPlayerId ? updatedPlayers.find(p => p.id === devSettings.forceBusPlayerId) : null;
                  const victim = forced || (() => {
                    const withCards = updatedPlayers.filter(p => p.hand.length > 0);
                    if (withCards.length === 0) return updatedPlayers[0];
                    return [...withCards].sort((a, b) => {
                      if (b.hand.length !== a.hand.length) return b.hand.length - a.hand.length;
                      const sumA = a.hand.reduce((acc, c) => acc + c.rank, 0);
                      const sumB = b.hand.reduce((acc, c) => acc + c.rank, 0);
                      return sumB - sumA;
                    })[0];
                  })();

                  setTimeout(() => {
                    determineLoserAndAnimate(victim);
                  }, 250);
                }
                setIsDevMenuOpen(false);
              }}
              className="bg-slate-800 text-[10px] font-bold text-slate-200 rounded-md py-1 px-1 outline-none border border-slate-700 max-w-[55px] uppercase tracking-wider"
              title={t("Verander Fase")}
            >
              <option value="" disabled>{t("Fase")}</option>
              <option value="1">{t("Ronde")}</option>
              <option value="2">{t("Pira")}</option>
              <option value="3">{t("Bus")}</option>
            </select>
            
            <select 
              value={devSettings.forceBusPlayerId || ''}
              onChange={(e) => { e.stopPropagation(); setDevSettings(p => ({ ...p, forceBusPlayerId: e.target.value || null })); }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 text-[10px] font-bold text-slate-200 rounded-md py-1 px-1 outline-none border border-slate-700 max-w-[65px] uppercase tracking-wider"
              title={t("Forceer Bus Speler")}
            >
              <option value="">{t("Auto")}</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.name.slice(0,5)}</option>
              ))}
            </select>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsDevMenuOpen(false); setIsSettingsOpen(true); }}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 transition-colors"
              title={t("Instellingen")}
            >
              <Settings size={14} />
            </button>
          </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsDevMenuOpen(!isDevMenuOpen); }}
          onPointerDown={(e) => { e.stopPropagation(); }}
          className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-green-400 hover:text-green-300 hover:bg-slate-800/70 transition-all active:scale-90 backdrop-blur-sm relative z-[111] cursor-pointer touch-manipulation"
        >
          {isDevMenuOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
    );
  };
  // --- RENDERING ---
  // Global fixed quit button shown during active gameplay (not on SETUP or GAME_OVER)
  const isInActiveGame = phase !== GamePhase.SETUP && phase !== GamePhase.GAME_OVER;
  const renderAdditionalModals = () => (
    <>
        <SlideMenuModal
          isOpen={isMoreSettingsOpen}
          onClose={() => {
            setIsMoreSettingsOpen(false);
            setIsPhraseEditorOpen(false);
            setIsPhraseEditorClosing(false);
            setPreviewDeckStyle(null);
            setIsDeckPreviewClosing(false);
          }}
          onBackdropClick={isPhraseEditorOpen ? handlePhraseEditorBack : previewDeckStyle ? handleDeckPreviewBack : undefined}
          className="relative w-full max-w-sm m-4 flex flex-col max-h-[85vh]"
        >
          {({ close }) => (
            <>
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-800 p-6 shrink-0">
                <h3 className="text-xl font-black text-white uppercase tracking-wider">{t("Meer Instellingen")}</h3>
                <button onClick={close} className="text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              {/* Scrollable Body with Theme-Dependent Scroll Indicators */}
              <ScrollIndicatorContainer
                orientation="vertical"
                theme={settings.theme}
                className="flex-1 min-h-0"
                scrollClassName="p-6 space-y-6"
              >
                <div className="flex flex-col gap-3 w-full">
                  <h4 className="text-white font-medium">{t("Taal / Language")}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setLanguage('nl');
                        triggerHaptic('subtle');
                      }}
                      className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${lang === 'nl' ? 'border-amber-400 bg-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'border-slate-700 bg-slate-800 hover:bg-slate-700'}`}
                    >
                      <span className="text-white text-lg font-bold">🇳🇱 NL</span>
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('en');
                        triggerHaptic('subtle');
                      }}
                      className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${lang === 'en' ? 'border-amber-400 bg-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'border-slate-700 bg-slate-800 hover:bg-slate-700'}`}
                    >
                      <span className="text-white text-lg font-bold">🇬🇧 EN</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-full pt-2">
                  <h4 className="text-white font-medium">{t("Berichten aanpassen")}</h4>
                  <button
                    onClick={() => {
                      setIsPhraseEditorOpen(true);
                      setIsPhraseEditorClosing(false);
                    }}
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
                          onPointerDown={() => {
                            if (settings.theme === tName) return;
                            longPressTimerRef.current = setTimeout(() => {
                              const n = { ...settings, theme: tName };
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
                          onClick={() => {
                            if (settings.theme === tName) return;
                            setThemeToUnlock(tName);
                            triggerHaptic('subtle');
                          }}
                          className={`flex-1 py-1.5 text-xs capitalize transition-all flex items-center justify-center gap-1 ${btnStyle}`}
                        >
                          {t(tName)}
                          {!isActive && <Video size={10} className="text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {/* Full-width Stars Theme Button (only visible if player already had it active) */}
                  {hasStarsLegacyTheme && (() => {
                    const isStarsActive = settings.theme === UITheme.STARS;
                    return (
                      <div className="bg-slate-800/70 p-1 rounded-2xl border border-slate-700/50 mt-1">
                        <button
                          onClick={() => {
                            if (isStarsActive) return;
                            const n = { ...settings, theme: UITheme.STARS };
                            setSettings(n);
                            queueStorageWrite(GAME_SETTINGS_KEY, JSON.stringify(n), 'instellingen');
                            triggerHaptic('subtle');
                          }}
                          className={`w-full py-1.5 text-xs capitalize transition-all flex items-center justify-center gap-1.5 relative overflow-hidden ${
                            isStarsActive
                              ? 'font-bold rounded-xl shadow-md border border-white/50 text-white'
                              : 'text-slate-300 hover:text-white rounded-xl active:scale-[0.98]'
                          }`}
                          style={{
                            background: isStarsActive
                              ? 'linear-gradient(135deg, #181d2c 0%, #0e1220 50%, #070911 100%)'
                              : 'linear-gradient(135deg, #0f1320 0%, #080b14 100%)',
                          }}
                        >
                          <span className="relative z-10">{t("Stars")}</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
                {settings.theme === UITheme.CALM && (
                  <div className="flex flex-col gap-3 w-full pt-2">
                    <h4 className="text-white font-medium">{t("Calm Accent Kleur")}</h4>
                    <CalmAccentColorPicker
                      accentColor={settings.calmAccentColor || '#fb7185'}
                      onColorChange={(newColor) => {
                        const n = { ...settings, calmAccentColor: newColor };
                        setSettings(n);
                        queueStorageWrite(GAME_SETTINGS_KEY, JSON.stringify(n), 'instellingen');
                      }}
                      isOpen={isColorPickerOpen}
                      onToggleOpen={() => setIsColorPickerOpen(prev => !prev)}
                      onClose={() => setIsColorPickerOpen(false)}
                      t={t}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-3 w-full pt-2">
                  <h4 className="text-white font-medium mb-1">{t("Kaartstijl")}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[CardStyle.MODERN, CardStyle.DARK, CardStyle.CLASSIC, CardStyle.NEON].map((style) => (
                      <div
                        key={style}
                        role="button"
                        tabIndex={0}
                        onPointerDown={() => {
                          if (settings.cardStyle === style) return;
                          longPressTimerRef.current = setTimeout(() => {
                            const n = { ...settings, cardStyle: style };
                            setSettings(n);
                            queueStorageWrite(GAME_SETTINGS_KEY, JSON.stringify(n), 'instellingen');
                            triggerHaptic('subtle');
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
                          triggerHaptic('subtle');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setStyleToUnlock(style);
                            triggerHaptic('subtle');
                          }
                        }}
                        className={`py-4 rounded-2xl border relative flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${settings.cardStyle === style ? 'border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-red-500/50' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 hover:border-slate-600'}`}
                      >
                        {/* Preview eye button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDeckStyle(style);
                            triggerHaptic('subtle');
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
                        </div>
                      ))}
                  </div>
                  {/* Full-width Galaxy Card Style Button (only visible if unlocked) */}
                  {(isGalaxyUnlocked || settings.cardStyle === CardStyle.GALAXY) && (() => {
                    const isGalaxyStyleActive = settings.cardStyle === CardStyle.GALAXY;
                    return (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (isGalaxyStyleActive) return;
                          const n = { ...settings, cardStyle: CardStyle.GALAXY };
                          setSettings(n);
                          queueStorageWrite(GAME_SETTINGS_KEY, JSON.stringify(n), 'instellingen');
                          triggerHaptic('subtle');
                          handleDeckPreviewBack();
                        }}
                        className={`w-full py-4 rounded-2xl border relative flex flex-col items-center justify-center gap-3 transition-all cursor-pointer overflow-hidden select-none mt-3 ${
                          isGalaxyStyleActive
                            ? 'border-white/30 border-t-white/50 shadow-[0_0_20px_rgba(226,232,240,0.15)] ring-1 ring-white/20'
                            : 'border-white/10 hover:border-white/25 active:scale-[0.99]'
                        }`}
                        style={{
                          background: isGalaxyStyleActive
                            ? 'linear-gradient(135deg, #181d2c 0%, #0e1220 50%, #070911 100%)'
                            : 'linear-gradient(135deg, #0f1320 0%, #080b14 100%)',
                        }}
                      >
                        {/* Preview eye button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDeckStyle(CardStyle.GALAXY);
                            triggerHaptic('subtle');
                          }}
                          className="absolute top-2 left-2 bg-slate-800/80 rounded-full p-1 border border-slate-600 shadow-lg flex items-center justify-center active:scale-95 transition-transform z-20"
                        >
                          <Eye size={12} className="text-white" />
                        </button>
                        <div className="scale-[0.55] h-16 flex items-center justify-center">
                          <PlayingCard card={PREVIEW_CARD} size="base" style={CardStyle.GALAXY} className="shadow-2xl" />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-widest ${isGalaxyStyleActive ? 'text-slate-100' : 'text-slate-400'}`}>
                          {t("Galaxy")}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                {/* Bus Pakjes / Decks Slider */}
                <div className="flex flex-col gap-2 w-full pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium text-sm sm:text-base">{t("Bus Pakjes")}</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const next = ((Math.round(draftBusDecks)) % 5) + 1;
                        setDraftBusDecks(next);
                        setSettings(prev => ({ ...prev, busDecks: next }));
                        triggerHaptic('subtle');
                      }}
                      className="text-xs sm:text-sm font-black text-white px-2 py-0.5 rounded-lg border bg-slate-800 border-slate-700 active:scale-95 transition-all cursor-pointer"
                    >
                      {Math.round(draftBusDecks)}
                    </button>
                  </div>
                  <div className="relative w-full h-5 flex items-center">
                    {/* Track background */}
                    <div className="absolute inset-x-0 h-2 bg-slate-800 rounded-lg overflow-hidden flex items-center border border-white/10">
                      {/* Active fill */}
                      <div 
                        className={`slider-active-fill absolute left-0 top-0 bottom-0 pointer-events-none z-0 ${
                          isBusDecksDragging ? '' : 'transition-all duration-300 ease-out'
                        }`}
                        style={{
                          width: `calc(8px + (100% - 16px) * ${(draftBusDecks - 1) / 4})`,
                          background: 'var(--theme-accent-gradient, var(--theme-accent, #ef4444))',
                          opacity: 0.85
                        }}
                      />
                    </div>
                    {/* Threshold marks */}
                    <div className="absolute inset-x-0 h-3 flex items-center pointer-events-none z-10">
                      {[1.5, 2.5, 3.5, 4.5].map(thresh => {
                        const threshFraction = (thresh - 1) / 4;
                        const isPast = draftBusDecks >= thresh;
                        return (
                          <div 
                            key={thresh} 
                            className={`absolute w-[1.5px] h-2.5 rounded-full -translate-x-1/2 transition-all duration-300 ease-out ${
                              isPast ? 'bg-white/60 shadow-[0_0_3px_rgba(255,255,255,0.6)]' : 'bg-slate-600/70'
                            }`} 
                            style={{
                              left: `calc(8px + (100% - 16px) * ${threshFraction})`
                            }}
                          />
                        );
                      })}
                    </div>
                    {/* Custom Animated Thumb Knob linked with fill */}
                    <div 
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white pointer-events-none z-30 shadow-[0_0_10px_rgba(0,0,0,0.5),0_0_4px_var(--theme-accent)] ${
                        isBusDecksDragging ? 'scale-115' : 'transition-all duration-300 ease-out'
                      }`}
                      style={{
                        left: `calc(8px + (100% - 16px) * ${(draftBusDecks - 1) / 4})`,
                        background: 'var(--theme-accent-gradient, var(--theme-accent, #ef4444))'
                      }}
                    />
                    {/* Invisible Range Input for Drag & Touch Interaction */}
                    <input 
                      type="range" 
                      min={1} 
                      max={5} 
                      step="any"
                      value={draftBusDecks}
                      onMouseDown={() => setIsBusDecksDragging(true)}
                      onTouchStart={() => setIsBusDecksDragging(true)}
                      onChange={(e) => handleBusDecksChange(parseFloat(e.target.value))}
                      onInput={(e) => handleBusDecksChange(parseFloat((e.target as HTMLInputElement).value))}
                      onMouseUp={handleBusDecksCommit}
                      onTouchEnd={handleBusDecksCommit}
                      className="custom-slider-invisible absolute inset-0 z-40 cursor-grab active:cursor-grabbing"
                    />
                  </div>
                </div>
              </ScrollIndicatorContainer>
              {/* Footer */}
              <div className="p-6 border-t border-slate-800 shrink-0">
                <button
                  onClick={close}
                  className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-transform uppercase tracking-widest"
                >
                  {t("Sluiten")}
                </button>
              </div>

              {/* Phrase Editor Overlay */}
              {isPhraseEditorOpen && (
                <div className={`absolute inset-0 z-20 bg-slate-900 flex flex-col rounded-3xl overflow-hidden ${isPhraseEditorClosing ? 'animate-slide-right-exit pointer-events-none' : 'animate-slide-left-enter'}`}>
                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-slate-800 p-6 shrink-0 bg-slate-900">
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">{t("Berichten")} ({lang.toUpperCase()})</h3>
                    <button
                      onClick={handlePhraseEditorBack}
                      className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                      title={t("Terug")}
                      aria-label={t("Terug")}
                    >
                      <ArrowLeft size={24} />
                    </button>
                  </div>
                  {/* Category Filter */}
                  <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
                    <div className="flex bg-slate-800 p-1 rounded-2xl gap-1 border border-slate-700">
                      {(['success', 'failure', 'loser'] as PhraseCategory[]).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setEditorCategory(cat)}
                          className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                            editorCategory === cat
                              ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-md border border-red-500/40'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-transparent'
                          }`}
                        >
                          {t(cat === 'success' ? "Goed" : cat === 'failure' ? "Fout" : "Bus Loser")}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Phrases List with Theme-Dependent Scroll Indicators */}
                  <ScrollIndicatorContainer
                    orientation="vertical"
                    theme={settings.theme}
                    className="flex-1 min-h-0 bg-slate-900"
                    scrollClassName="px-6 py-4 space-y-2.5"
                  >
                    {(() => {
                      const effectivePhrases = getEffectivePhrases(editorCategory);
                      return effectivePhrases.map((phrase, idx) => (
                        <div key={`${editorCategory}-${idx}`} className="flex justify-between items-center bg-slate-800 p-3.5 rounded-xl border border-slate-700 group">
                          <span className="text-white font-medium text-sm pr-2 break-words">{phrase}</span>
                          <button
                            onClick={() => {
                              const newPhrases = { ...customPhrases };
                              if (!newPhrases[lang]) newPhrases[lang] = { success: [...DEFAULT_PHRASES[lang].success], failure: [...DEFAULT_PHRASES[lang].failure], loser: [...DEFAULT_PHRASES[lang].loser] };
                              newPhrases[lang][editorCategory] = effectivePhrases.filter((_, i) => i !== idx);
                              setCustomPhrases(newPhrases);
                              localStorage.setItem(CUSTOM_PHRASES_KEY, JSON.stringify(newPhrases));
                              triggerHaptic('medium');
                            }}
                            className="text-slate-500 hover:text-red-400 p-1 transition-colors shrink-0 cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ));
                    })()}
                  </ScrollIndicatorContainer>
                  {/* Add Input & Reset */}
                  <div className="p-6 border-t border-slate-800 bg-slate-900 space-y-3 shrink-0">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingPhraseText}
                        onChange={(e) => setEditingPhraseText(e.target.value)}
                        placeholder={t("Nieuw bericht toevoegen...")}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 placeholder:text-slate-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editingPhraseText.trim()) {
                            const newPhrases = { ...customPhrases };
                            if (!newPhrases[lang]) newPhrases[lang] = { success: [...DEFAULT_PHRASES[lang].success], failure: [...DEFAULT_PHRASES[lang].failure], loser: [...DEFAULT_PHRASES[lang].loser] };
                            newPhrases[lang][editorCategory] = [...getEffectivePhrases(editorCategory), editingPhraseText.trim()];
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
                            if (!newPhrases[lang]) newPhrases[lang] = { success: [...DEFAULT_PHRASES[lang].success], failure: [...DEFAULT_PHRASES[lang].failure], loser: [...DEFAULT_PHRASES[lang].loser] };
                            newPhrases[lang][editorCategory] = [...getEffectivePhrases(editorCategory), editingPhraseText.trim()];
                            setCustomPhrases(newPhrases);
                            localStorage.setItem(CUSTOM_PHRASES_KEY, JSON.stringify(newPhrases));
                            setEditingPhraseText('');
                            triggerHaptic('success');
                          }
                        }}
                        className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-xl px-5 flex items-center justify-center transition-all active:scale-95 shadow-md cursor-pointer border border-red-500/30"
                      >
                        <Plus size={22} />
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
                      className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <RotateCcw size={14} /> {t("Herstel standaardberichten")}
                    </button>
                  </div>
                </div>
              )}
              {/* Card Style Preview Overlay (uses identical UI architecture to Berichten overlay) */}
              {previewDeckStyle && (
                <div className={`absolute inset-0 z-20 bg-slate-900 flex flex-col rounded-3xl overflow-hidden ${isDeckPreviewClosing ? 'animate-slide-right-exit pointer-events-none' : 'animate-slide-left-enter'}`}>
                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-slate-800 p-6 shrink-0 bg-slate-900">
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">
                      {t("Card Style Preview")}
                    </h3>
                    <button
                      onClick={handleDeckPreviewBack}
                      className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                      title={t("Terug")}
                      aria-label={t("Terug")}
                    >
                      <ArrowLeft size={24} />
                    </button>
                  </div>

                  {/* Style Switcher Bar (identical to Berichten category tabs) */}
                  <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
                    <div className="flex bg-slate-800 p-1 rounded-2xl gap-1 border border-slate-700 overflow-x-auto no-scrollbar">
                      {[
                        CardStyle.MODERN,
                        CardStyle.DARK,
                        CardStyle.CLASSIC,
                        CardStyle.NEON,
                        ...(isGalaxyUnlocked || settings.cardStyle === CardStyle.GALAXY ? [CardStyle.GALAXY] : [])
                      ].map(st => (
                        <button
                          key={st}
                          onClick={() => {
                            setPreviewDeckStyle(st);
                            triggerHaptic('subtle');
                          }}
                          className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center whitespace-nowrap ${
                            previewDeckStyle === st
                              ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-md border border-red-500/40'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-transparent'
                          }`}
                        >
                          {t(st === CardStyle.MODERN ? "Modern" :
                             st === CardStyle.DARK ? "Donker" :
                             st === CardStyle.CLASSIC ? "Klassiek" :
                             st === CardStyle.GALAXY ? "Galaxy" : "Neon")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cards List with Theme-Dependent Scroll Indicators */}
                  <ScrollIndicatorContainer
                    orientation="vertical"
                    theme={settings.theme}
                    className="flex-1 min-h-0 bg-slate-900"
                    scrollClassName="px-6 py-4"
                  >
                    <div className="grid grid-cols-2 gap-3.5 pb-2">
                      {/* Back Preview (Achterkant) */}
                      <div className="flex flex-col items-center gap-2 bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                        <PlayingCard card={PREVIEW_SAMPLE_CARDS[0]} isFaceDown size="base" style={previewDeckStyle} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("Achterkant")}</span>
                      </div>
                      {/* Sample Front Cards */}
                      {PREVIEW_SAMPLE_CARDS.map(card => (
                        <div key={card.id} className="flex flex-col items-center gap-2 bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                          <PlayingCard card={card} size="base" style={previewDeckStyle} />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t(card.suit)} {getRankString(card.rank)}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollIndicatorContainer>

                  {/* Action Footer */}
                  <div className="p-6 border-t border-slate-800 bg-slate-900 shrink-0">
                    <button
                      onClick={() => {
                        if (settings.cardStyle === previewDeckStyle) {
                          handleDeckPreviewBack();
                          return;
                        }
                        if (previewDeckStyle === CardStyle.GALAXY) {
                          const n = { ...settings, cardStyle: CardStyle.GALAXY };
                          setSettings(n);
                          queueStorageWrite(GAME_SETTINGS_KEY, JSON.stringify(n), 'instellingen');
                          triggerHaptic('subtle');
                          handleDeckPreviewBack();
                          return;
                        }
                        setStyleToUnlock(previewDeckStyle);
                        triggerHaptic('subtle');
                      }}
                      className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md ${
                        settings.cardStyle === previewDeckStyle
                          ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-pointer hover:bg-slate-700'
                          : 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white border border-red-500/30 cursor-pointer'
                      }`}
                    >
                      {settings.cardStyle === previewDeckStyle ? (
                        t("Huidige stijl")
                      ) : previewDeckStyle === CardStyle.GALAXY ? (
                        t("Selecteer stijl")
                      ) : (
                        <>
                          <Video size={16} className="text-amber-400" />
                          {t("Stijl Wisselen")}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </SlideMenuModal>
        {/* Physical Mode Info Modal */}
        <SlideMenuModal
          isOpen={showPhysicalModeInfo}
          onClose={() => setShowPhysicalModeInfo(false)}
          className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl w-full max-w-sm m-4 space-y-4"
          backdropClassName="bg-black/75 backdrop-blur-sm"
        >
          {({ close }) => (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <span className="text-amber-400 font-black text-lg">i</span>
                </div>
                <h3 className="text-lg font-black text-white">{t("Fysieke Modus")}</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{t("Gebruik je eigen fysieke spelkaarten in plaats van digitale kaarten. De app begeleidt je alleen door de regels.")}</p>
              <button
                onClick={close}
                className="w-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold py-3 rounded-xl transition-colors active:scale-95 cursor-pointer"
              >
                {t("Sluiten")}
              </button>
            </>
          )}
        </SlideMenuModal>
        {renderStyleUnlockModal()}
        {renderThemeUnlockModal()}
        {renderColorPickerModal()}
        {renderAdLoadingModal()}
        <HardBusWarningModal
          isOpen={showHardBusWarning}
          busLength={settings.busLength}
          t={t}
          lang={lang}
          onCancel={() => setShowHardBusWarning(false)}
          onAdjust={() => {
            setShowHardBusWarning(false);
            setIsSettingsOpen(true);
          }}
          onConfirm={() => {
            setShowHardBusWarning(false);
            confirmStart(settings.physicalMode ? GameMode.PHYSICAL : GameMode.DIGITAL);
          }}
        />
        <GalaxyCelebrationModal
          isOpen={isGalaxyCelebrationOpen}
          onClose={() => setIsGalaxyCelebrationOpen(false)}
          onEquipBoth={() => {
            const n = { ...settings, cardStyle: CardStyle.GALAXY };
            setSettings(n);
            queueStorageWrite(GAME_SETTINGS_KEY, JSON.stringify(n), 'instellingen');
            setIsGalaxyCelebrationOpen(false);
            triggerHaptic('heavy');
          }}
          t={t}
          lang={lang}
        />
    </>
  );
  if (phase === GamePhase.SETUP) {
    return (
      <>
        <PersistentBackground theme={settings.theme} calmAccentColor={settings.calmAccentColor} />
        <BusTransitionOverlay loserReveal={loserReveal} isBusEntrance={isBusEntrance} busPassengers={busPassengers} t={t} theme={settings.theme} />
        <RootContainer className="p-4" showChest={true} theme={settings.theme}>
        <div className="flex-none mb-6 mt-2 animate-in slide-in-from-top-4 duration-700">
          {settings.theme === UITheme.STARS ? (
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1.5 opacity-60">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/40" />
                <span className="text-[#fef08a] text-[10px]">✦</span>
                <div className="h-px w-16 bg-gradient-to-r from-white/30 to-transparent" />
              </div>
              <h1 
                className="text-4xl sm:text-5xl font-semibold uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 drop-shadow-[0_0_20px_rgba(255,255,255,0.35)] cursor-pointer select-none"
                style={{ fontFamily: "'Outfit', sans-serif" }}
                onPointerDown={handleHeaderPointerDown}
                onPointerUp={handleHeaderPointerUpOrLeave}
                onPointerLeave={handleHeaderPointerUpOrLeave}
                onContextMenu={(e) => e.preventDefault()}
              >
                {t("Bussen")}
              </h1>
            </div>
          ) : (
            <h1 
              className={`text-5xl font-black tracking-tighter uppercase cursor-pointer select-none transition-all duration-300 ${
                headerArmed || devModeArmed
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 drop-shadow-[0_2px_15px_rgba(59,130,246,0.7)]'
                  : 'text-[var(--theme-accent,#ef4444)]'
              }`}
              style={
                headerArmed || devModeArmed
                  ? undefined
                  : {
                      color: 'var(--theme-accent, #ef4444)',
                      textShadow: '0 2px 12px var(--theme-accent-glow, rgba(220,38,38,0.5))',
                    }
              }
              onPointerDown={handleHeaderPointerDown}
              onPointerUp={handleHeaderPointerUpOrLeave}
              onPointerLeave={handleHeaderPointerUpOrLeave}
              onContextMenu={(e) => e.preventDefault()}
            >
              {t("Bussen")}
            </h1>
          )}
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] ml-1 neon-text"></p>
        </div>
        <div className="flex-1 flex flex-col min-h-0 mb-4 glass-panel rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-red-900/20">
          <div className="flex justify-between items-center p-4 border-b border-slate-700/50 bg-slate-900/60 sticky top-0 z-10">
            <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
              <span
                className="cursor-pointer select-none p-1 -m-1 rounded-lg inline-flex items-center justify-center transition-all duration-300 active:scale-95"
                onPointerDown={handleIconPointerDown}
                onPointerUp={handleIconPointerUpOrLeave}
                onPointerLeave={handleIconPointerUpOrLeave}
                onContextMenu={(e) => e.preventDefault()}
              >
                <Users 
                  size={16} 
                  className={`transition-all duration-300 ${
                    iconArmed || devModeArmed 
                      ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.9)] scale-110' 
                      : settings.theme === UITheme.STARS
                      ? 'text-slate-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                      : 'text-red-500'
                  }`} 
                />
              </span>
              {t("Spelers")}
            </h2>
            {players.length >= 10 && (
              <span 
                className="inline-block text-[10px] font-bold px-2 py-1 rounded-lg border select-none transition-all duration-300 animate-pop text-slate-300 bg-slate-800 border-slate-700"
              >
                {players.length}/12
              </span>
            )}
          </div>
          <PlayerList
            players={players}
            dragPlayerIndex={dragPlayerIndex}
            dragOverIndex={dragOverIndex}
            listRef={playerListRef}
            onDragStart={handleDragStart}
            onRemovePlayer={removePlayer}
            renderAvatar={renderPlayerListAvatar}
            t={t}
            immunePlayerId={immunePlayerId}
            lastAddedPlayerId={lastAddedPlayerId}
            theme={settings.theme}
          />
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
              onClick={() => setIsPhotoOptionsModalOpen(true)}
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
            <button
              onClick={addPlayer}
              disabled={!canAddPlayer}
              className={`flex-none w-14 h-full rounded-2xl transition-all flex items-center justify-center ${
                canAddPlayer
                  ? settings.theme === UITheme.STARS
                    ? 'bg-gradient-to-b from-slate-700 to-slate-900 border border-white/20 border-t-white/40 text-slate-100 shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-90'
                    : 'bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 border-t border-emerald-400 text-white shadow-lg active:scale-90 glass-panel'
                  : 'bg-slate-800/40 border border-slate-700/50 text-slate-500 opacity-40 cursor-not-allowed'
              }`}
            >
              <Check size={24} strokeWidth={4} className={canAddPlayer ? (settings.theme === UITheme.STARS ? 'text-slate-100' : 'text-green-100') : 'text-slate-500'} />
            </button>
          </div>
          {settings.theme === UITheme.STARS ? (
            <button
              onClick={handleStartPress}
              disabled={players.length < 2}
              className="w-full py-3.5 pl-8 pr-2.5 rounded-full text-white font-medium text-sm sm:text-base tracking-[0.18em] uppercase shadow-[0_0_25px_rgba(255,255,255,0.08),inset_0_0_12px_rgba(226,232,240,0.06)] active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer border border-white/20 border-t-white/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale no-calm-override"
              style={{ 
                background: 'linear-gradient(180deg, #181d2c 0%, #070911 100%)',
                fontFamily: "'Outfit', sans-serif" 
              }}
            >
              <span>{t("START SPEL")}</span>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/15 transition-all border border-white/10">
                <Play size={18} fill="currentColor" className="text-white ml-0.5" />
              </div>
            </button>
          ) : settings.theme === UITheme.CALM ? (
            <button
              onClick={handleStartPress}
              disabled={players.length < 2}
              className="w-full py-3.5 pl-8 pr-2.5 rounded-full font-medium text-sm sm:text-base tracking-[0.18em] uppercase active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed no-calm-override"
              style={{
                backgroundColor: 'var(--theme-accent, #fb7185)',
                color: 'var(--theme-btn-text, #ffffff)',
                boxShadow: '0 8px 30px var(--theme-accent-glow, rgba(251, 113, 133, 0.35))',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              <span>{t("START SPEL")}</span>
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-all"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
              >
                <Play size={18} fill="currentColor" className="ml-0.5" style={{ color: 'var(--theme-btn-text, #ffffff)' }} />
              </div>
            </button>
          ) : settings.theme === UITheme.METRO ? (
            <button
              onClick={handleStartPress}
              disabled={players.length < 2}
              className="w-full py-3.5 pl-8 pr-2.5 rounded-none bg-[var(--theme-accent)] text-slate-950 font-mono font-black text-sm sm:text-base tracking-widest uppercase border-2 border-white shadow-[4px_4px_0_rgba(0,0,0,0.8)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-between group cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{t("START SPEL")}</span>
              <div className="w-10 h-10 rounded-none bg-slate-950/20 flex items-center justify-center group-hover:scale-110 transition-all">
                <Play size={18} fill="currentColor" className="text-slate-950 ml-0.5" />
              </div>
            </button>
          ) : settings.theme === UITheme.BEER ? (
            <button
              onClick={handleStartPress}
              disabled={players.length < 2}
              className="w-full py-3.5 pl-8 pr-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 font-black text-sm sm:text-base tracking-wider uppercase shadow-[0_6px_20px_rgba(245,158,11,0.4)] border-t border-amber-300 active:scale-95 transition-all flex items-center justify-between group cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{t("START SPEL")}</span>
              <div className="w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center group-hover:scale-110 transition-all">
                <Play size={18} fill="currentColor" className="text-slate-950 ml-0.5" />
              </div>
            </button>
          ) : (
            <button
              onClick={handleStartPress}
              disabled={players.length < 2}
              className="w-full py-3.5 pl-8 pr-2.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-black text-sm sm:text-base tracking-[0.18em] uppercase shadow-[0_8px_25px_rgba(220,38,38,0.4)] active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer border-t border-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{t("START SPEL")}</span>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all">
                <Play size={18} fill="currentColor" className="text-white ml-0.5" />
              </div>
            </button>
          )}
          <SettingsPanel
            isOpen={isSettingsOpen}
            settings={settings}
            playerCount={players.length}
            t={t}
            onToggleOpen={() => setIsSettingsOpen(!isSettingsOpen)}
            onOpenMoreSettings={() => setIsMoreSettingsOpen(true)}
            onSettingsChange={(key, val) => setSettings(prev => ({ ...prev, [key]: val }))}
            onCommitSettings={(newValues) => {
              if (newValues) {
                setSettings(prev => ({ ...prev, ...newValues }));
              }
            }}
          />
        </div>
        {/* Photo Options Modal */}
        <PhotoOptionsModal
          isOpen={isPhotoOptionsModalOpen}
          t={t}
          onTakePhoto={handleTakePhoto}
          onSelectFromGallery={handleSelectFromGallery}
          onClose={() => setIsPhotoOptionsModalOpen(false)}
        />
        {renderAdditionalModals()}
      </RootContainer>
      </>
    );
  }
  if (phase === GamePhase.ROUNDS_1_4) {
    const activePlayerSuits = new Set(activePlayer.hand.map(c => c.suit));
    const missingSuit = ALL_SUITS.find(s => !activePlayerSuits.has(s));
    const canAttemptDisco = roundStep === RoundStep.SUIT && activePlayerSuits.size === 3 && !!missingSuit;
    if (isWaitingForNextPlayer) {
      return (
        <>
          <PersistentBackground theme={settings.theme} calmAccentColor={settings.calmAccentColor} />
        <BusTransitionOverlay loserReveal={loserReveal} isBusEntrance={isBusEntrance} busPassengers={busPassengers} t={t} theme={settings.theme} />
          <RootContainer className="items-center justify-center p-6" theme={settings.theme}>
          <div className="text-center animate-in zoom-in duration-300 flex flex-col items-center">
            <div className="mb-4"><ThemeLabel text={t("Aan de beurt")} theme={settings.theme} size="sm" variant="simple" /></div>
            <PlayerAvatar 
              player={activePlayer} 
              size="xl" 
              className="mb-6" 
              theme={settings.theme} 
              onPointerDown={() => activePlayer && handleAvatarPointerDown(activePlayer)}
              onPointerUp={handleAvatarPointerUpOrLeave}
              onPointerLeave={handleAvatarPointerUpOrLeave}
            />
            {settings.theme === UITheme.STARS ? (
              <h1 
                className="text-4xl sm:text-5xl font-semibold uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 drop-shadow-[0_0_20px_rgba(255,255,255,0.35)] mb-8"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {activePlayer.name}
              </h1>
            ) : (
              <h1 className="text-5xl font-black text-white mb-8 tracking-tight drop-shadow-lg">{activePlayer.name}</h1>
            )}
            {settings.theme === UITheme.STARS ? (
              <button
                onClick={() => setIsWaitingForNextPlayer(false)}
                className="w-full max-w-xs py-3.5 pl-8 pr-2.5 rounded-full text-white font-medium text-base tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(255,255,255,0.08),inset_0_0_12px_rgba(226,232,240,0.06)] active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer border border-white/20 border-t-white/40 mx-auto"
                style={{
                  background: 'linear-gradient(180deg, #181d2c 0%, #070911 100%)',
                  fontFamily: "'Outfit', sans-serif"
                }}
              >
                <span>{t("Start")}</span>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/15 transition-all border border-white/10">
                  <ArrowRight size={20} strokeWidth={2.5} className="text-white" />
                </div>
              </button>
            ) : (
              <button
                onClick={() => setIsWaitingForNextPlayer(false)}
                className="bg-white text-black text-xl font-black px-10 py-4 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center gap-3 mx-auto hover:scale-105 transition-transform active:scale-95"
              >
                {t("Start")} <ArrowRight size={24} strokeWidth={3} />
              </button>
            )}
          </div>
        </RootContainer>
      </>
    );
  }
    return (
      <>
        <PersistentBackground theme={settings.theme} calmAccentColor={settings.calmAccentColor} isDiscoActive={isDiscoActive} />
        <BusTransitionOverlay loserReveal={loserReveal} isBusEntrance={isBusEntrance} busPassengers={busPassengers} t={t} theme={settings.theme} />
        <RootContainer className="p-2 pb-safe" shake={screenShake} isDiscoActive={isDiscoActive} theme={settings.theme}>
        {showConfetti && <Confetti />}
        <div className={`flex-none flex items-center justify-between p-2.5 ${getHeaderClasses()}`}>
          <div key={activePlayer?.id} className="flex items-center gap-3 animate-card-hand-subtle">
            <PlayerAvatar 
              player={activePlayer} 
              size="lg" 
              theme={settings.theme} 
              onPointerDown={() => activePlayer && handleAvatarPointerDown(activePlayer)}
              onPointerUp={handleAvatarPointerUpOrLeave}
              onPointerLeave={handleAvatarPointerUpOrLeave}
            />
            <div className="overflow-hidden">
              <ThemeLabel text={t("Aan de beurt")} theme={settings.theme} size="sm" variant="simple" />
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-white text-lg leading-none truncate max-w-[120px] drop-shadow-md">{activePlayer?.name}</p>
                {activePlayer?.isImmune && <Shield size={14} className="text-yellow-400 shrink-0" />}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {renderDevMenu()}
            <div className="flex flex-col items-end px-2">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{t("Slokken gedronken")}</span>
              <span className="text-red-400 font-black font-mono text-lg leading-none drop-shadow-sm"><Beer size={12} className="inline mr-1 mb-0.5" />{activePlayer?.drinksTaken}</span>
            </div>
            {renderQuitButton()}
          </div>
        </div>
        {renderSettingsModal()}
        {renderDevModeOrb()}
        {renderAdditionalModals()}
{renderQuitModal()}
{renderAdLoadingModal()}
{renderColorPickerModal()}
        <div className="flex-1 flex flex-col min-h-0">
          {/* HAND - Fixed Size */}
          <div className={getHandContainerClasses()}>
            {/* Table Felt Texture */}
            {settings.theme === UITheme.CLASSIC && <div className="absolute inset-0 bg-[#0f172a]/50 mix-blend-overlay"></div>}
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
                    const isNewlyAdded = !!lastDrawnCard && c.id === lastDrawnCard.id;
                    const animClass = isNewlyAdded ? 'animate-card-hand-slot-in' : 'animate-card-hand-subtle';
                    return (
                      <div
                        key={`${activePlayer.id}-${c.id}`}
                        className={`flex-none transition-transform hover:-translate-y-2 duration-200 origin-bottom ${animClass}`}
                        style={{ zIndex: idx }}
                      >
                        <PlayingCard card={c} size="base" className="shadow-lg" style={settings.cardStyle} />
                      </div>
                    );
                  } else if (isCurrent) {
                    return renderActiveSlot(idx);
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
                      const isNewlyAdded = !!lastDrawnCard && idx === currentCardsCount - 1;
                      const animClass = isNewlyAdded ? 'animate-card-hand-slot-in' : 'animate-card-hand-subtle';
                      return (
                        <div
                          key={`${activePlayer.id}-phys-${idx}`}
                          className={`w-20 h-28 rounded-xl bg-[#1e40af] border-[3px] border-white shadow-lg flex items-center justify-center flex-none overflow-hidden relative ${animClass}`}
                          style={{ zIndex: idx }}
                        >
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
                      return renderActiveSlot(idx);
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
            <div className="text-center mb-6 relative z-10 flex flex-col items-center">
              <div 
                className="inline-block cursor-pointer"
                onPointerDown={handleHeaderPointerDown}
                onPointerUp={handleHeaderPointerUpOrLeave}
                onPointerLeave={handleHeaderPointerUpOrLeave}
                onContextMenu={(e) => e.preventDefault()}
              >
                <ThemeLabel text={`${t("Ronde")} ${roundStep} / 4`} theme={settings.theme} size="sm" />
              </div>
              <h2 className="text-3xl font-black text-white mt-3 drop-shadow-xl neon-text">
                {roundStep === 1 && t("Rood of Zwart?")}
                {roundStep === 2 && (activePlayer?.hand?.[0] ? `${t("Hoger of Lager dan")} ${getFullRankName(activePlayer.hand[0].rank, t)}?` : t("Hoger of Lager?"))}
                {roundStep === 3 && (activePlayer?.hand?.[0] && activePlayer?.hand?.[1] ? `${t("Binnen of Buiten")} ${getFullRankName(activePlayer.hand[0].rank, t)} ${t("en")} ${getFullRankName(activePlayer.hand[1].rank, t)}?` : t("Binnen of Buiten?"))}
                {roundStep === 4 && t("Hetzelfde Teken?")}
              </h2>
            </div>
            <div className="relative h-64 w-full flex items-center justify-center perspective-1000 z-0">
              {lastDrawnCard ? (
                <PlayingCard 
                  key={lastDrawnCard.id} 
                  card={lastDrawnCard} 
                  size="lg" 
                  className="animate-card-hand-enter shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]" 
                  style={settings.cardStyle} 
                />
              ) : (
                settings.mode === GameMode.DIGITAL ? (
                  <div className="w-48 h-64 border-4 border-dashed border-slate-700/50 rounded-2xl flex items-center justify-center bg-slate-900/30">
                    <span className="text-slate-700 font-black text-6xl opacity-30">?</span>
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
            <div className="space-y-4">
              <div
                key={feedback.text}
                className={`p-4 rounded-2xl text-center font-black text-lg border-2 shadow-2xl backdrop-blur-md ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-[0_0_35px_rgba(16,185,129,0.3)] animate-feedback-success'
                    : 'bg-red-950/90 border-red-400 text-white shadow-[0_0_35px_rgba(239,68,68,0.3)] animate-feedback-error'
                }`}
              >
                {feedback.text}
              </div>
              <button 
                onClick={() => dispatchGameEvent({ type: 'NEXT_PLAYER' })} 
                className="w-full bg-white hover:bg-slate-100 text-slate-900 py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100 fill-mode-both"
              >
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
                    <button onClick={() => handleDigitalGuess('RED')} className={getGuessBtnClasses('RED')}>{t("ROOD")}</button>
                    <button onClick={() => handleDigitalGuess('BLACK')} className={getGuessBtnClasses('BLACK')}>{t("ZWART")}</button>
                  </>
                )}
                {roundStep === 2 && (() => {
                  const baseCard = activePlayer?.hand?.[0];
                  const cardText = baseCard ? getRankString(baseCard.rank) : '';
                  return (
                    <>
                      <div className="col-span-2 flex justify-center">
                        <button 
                          type="button" 
                          onClick={() => handleDigitalGuess('EQUAL')} 
                          className={getGuessBtnClasses('EQUAL')}
                        >
                          <Equal size={15} strokeWidth={2.5} />
                          <span>{t("GELIJK")}{cardText ? ` (${cardText})` : ''}</span>
                        </button>
                      </div>
                      <button onClick={() => handleDigitalGuess('HIGHER')} className={getGuessBtnClasses('HIGHER')}>
                        <ChevronUp size={24} strokeWidth={3} />
                        <span>{t("HOGER")}</span>
                      </button>
                      <button onClick={() => handleDigitalGuess('LOWER')} className={getGuessBtnClasses('LOWER')}>
                        <ChevronDown size={24} strokeWidth={3} />
                        <span>{t("LAGER")}</span>
                      </button>
                    </>
                  );
                })()}
                {roundStep === 3 && (() => {
                  const c1 = activePlayer?.hand?.[0];
                  const c2 = activePlayer?.hand?.[1];
                  const boundaryText = c1 && c2 
                    ? (c1.rank === c2.rank ? getRankString(c1.rank) : `${getRankString(Math.min(c1.rank, c2.rank))}/${getRankString(Math.max(c1.rank, c2.rank))}`)
                    : '';
                  return (
                    <>
                      <div className="col-span-2 flex justify-center">
                        <button 
                          type="button" 
                          onClick={() => handleDigitalGuess('ON_IT')} 
                          className={getGuessBtnClasses('ON_IT')}
                        >
                          <Target size={15} strokeWidth={2.5} />
                          <span>{t("EROP")}{boundaryText ? ` (${boundaryText})` : ''}</span>
                        </button>
                      </div>
                      <button onClick={() => handleDigitalGuess('BETWEEN')} className={getGuessBtnClasses('BETWEEN')}>
                        <Minimize2 size={20} strokeWidth={3} />
                        <span>{t("BINNEN")}</span>
                      </button>
                      <button onClick={() => handleDigitalGuess('OUTSIDE')} className={getGuessBtnClasses('OUTSIDE')}>
                        <Maximize2 size={20} strokeWidth={3} />
                        <span>{t("BUITEN")}</span>
                      </button>
                    </>
                  );
                })()}
                {roundStep === 4 && (
                  <>
                    <button onClick={() => handleDigitalGuess('MATCH')} className={getGuessBtnClasses('MATCH')}>
                      <Equal size={22} strokeWidth={3} />
                      <span>{t("ZELFDE")}</span>
                    </button>
                    <button onClick={() => handleDigitalGuess('NO_MATCH')} className={getGuessBtnClasses('NO_MATCH')}>
                      <Shuffle size={20} strokeWidth={3} />
                      <span>{t("ANDERS")}</span>
                    </button>
                    {canAttemptDisco && (
                      <button
                        onClick={handleDiscoAttempt}
                        className={`col-span-2 relative overflow-hidden border-2 border-white/20 rounded-2xl font-black text-white text-lg shadow-[0_10px_30px_rgba(236,72,153,0.35)] active:scale-95 transition-transform ${settings.theme === UITheme.METRO ? 'rounded-none shadow-[4px_4px_0_rgba(0,0,0,0.8)]' : ''}`}
                        style={{
                          background: 'linear-gradient(90deg, #f472b6, #7c3aed, #22d3ee, #f97316, #f472b6, #7c3aed, #22d3ee, #f97316, #f472b6)',
                          backgroundSize: '200% 100%',
                          animation: 'disco-gradient 2s linear infinite'
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
      </>
      );
      }
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
  const digitalBusBackgroundStyle: React.CSSProperties | undefined = isBusWon
    ? {
      background: 'radial-gradient(circle at 16% 18%, rgba(251,191,36,0.22), transparent 40%), radial-gradient(circle at 84% 14%, rgba(168,85,247,0.24), transparent 36%), radial-gradient(circle at 48% 78%, rgba(34,211,238,0.2), transparent 42%), linear-gradient(135deg, #0b1f33 0%, #123a55 24%, #0c3b35 50%, #2d1f45 74%, #0b2c4c 100%)',
      backgroundSize: '260% 260%',
      animation: 'gradient-xy 20s ease-in-out infinite',
      transition: 'background 2000ms ease-in-out, filter 2000ms ease-in-out'
    }
    : (settings.theme === UITheme.CLASSIC ? {
      background: 'radial-gradient(circle at 12% 14%, rgba(255,255,255,0.06), transparent 40%), radial-gradient(circle at 84% 10%, rgba(59,130,246,0.08), transparent 36%), linear-gradient(135deg, #0b1224 0%, #111827 40%, #0b1320 100%)',
      backgroundSize: '240% 240%',
      animation: 'gradient-xy 16s ease-in-out infinite',
      transition: 'background 1800ms ease-in-out, filter 1800ms ease-in-out'
    } : undefined);
  // 4. PYRAMID
  if (phase === GamePhase.PYRAMID) {
    
    // Custom dark background for Classic theme during the pyramid phase
    const pyramidBackgroundStyle = settings.theme === UITheme.CLASSIC ? {
      background: 'radial-gradient(circle at 12% 14%, rgba(255,255,255,0.06), transparent 40%), radial-gradient(circle at 84% 10%, rgba(59,130,246,0.08), transparent 36%), linear-gradient(135deg, #0b1224 0%, #111827 40%, #0b1320 100%)',
      backgroundSize: '240% 240%',
      animation: 'gradient-xy 16s ease-in-out infinite',
      transition: 'background 1800ms ease-in-out, filter 1800ms ease-in-out'
    } : undefined;
    const manualBusSelectionOverlay = isSelectingBusPlayer ? (
      <div className="absolute inset-0 z-[95] bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) setIsSelectingBusPlayer(false); }}>
        <div className="w-full max-w-lg bg-slate-900/80 border border-white/10 rounded-3xl shadow-2xl p-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase font-black tracking-[0.25em] text-amber-300">{t("de bus in jij")}</p>
            <h3 className="text-3xl font-black text-white leading-tight">{t("Wie heeft nu de meeste kaarten?")}</h3>
            <p className="text-slate-300 text-sm"></p>
          </div>
          <ScrollIndicatorContainer
            orientation="vertical"
            theme={settings.theme}
            className="max-h-[50vh]"
            scrollClassName="flex flex-col gap-3"
          >
            {players.filter(p => !p.isImmune).map((p) => (
              <button
                key={p.id}
                onClick={() => handleManualBusPassengerSelect(p)}
                className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl p-3 text-left hover:border-amber-400 hover:bg-amber-500/10 transition-all active:scale-95"
              >
                <PlayerAvatar
                  player={p}
                  size="custom"
                  className="w-12 h-12 text-lg"
                  theme={settings.theme}
                />
                <span className="text-white font-bold truncate">{p.name}</span>
              </button>
            ))}
            {players.filter(p => p.isImmune).map((p) => (
              <button
                key={p.id}
                disabled
                className="flex items-center gap-3 bg-black/20 border border-white/5 rounded-2xl p-3 text-left cursor-not-allowed opacity-50"
              >
                <PlayerAvatar
                  player={p}
                  size="custom"
                  className="w-12 h-12 text-lg grayscale opacity-70"
                  theme={settings.theme}
                />
                <span className="text-white/70 font-bold truncate line-through">{p.name}</span>
                <Shield size={20} className="text-yellow-400 ml-auto" />
              </button>
            ))}
          </ScrollIndicatorContainer>
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
        <>
          <PersistentBackground theme={settings.theme} calmAccentColor={settings.calmAccentColor} style={pyramidBackgroundStyle} />
        <BusTransitionOverlay loserReveal={loserReveal} isBusEntrance={isBusEntrance} busPassengers={busPassengers} t={t} theme={settings.theme} />
          <RootContainer className="p-4 sm:p-6 items-center justify-center overflow-y-auto" theme={settings.theme}>
          {manualBusSelectionOverlay}
        {renderSettingsModal()}
        {renderDevModeOrb()}
        {renderAdditionalModals()}
{renderQuitModal()}
{renderAdLoadingModal()}
{renderColorPickerModal()}
          <div className="w-full max-w-2xl bg-black/70 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-6 text-center">
            <div className="space-y-4 text-left">
              <div className="flex justify-center"><ThemeLabel text={t("een echte piramide")} theme={settings.theme} size="sm" /></div>
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
            <div className="flex flex-col items-center gap-2 w-full">
              {renderToTheBusButton(() => setIsSelectingBusPlayer(true))}
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
      </>
    );
  }
    return (
      <>
        <PersistentBackground 
          theme={settings.theme} 
          calmAccentColor={settings.calmAccentColor} 
          isDiscoActive={isDiscoActive} 
          style={isBusDeparting && !settings.sharedBus ? digitalBusBackgroundStyle : pyramidBackgroundStyle} 
        />
        <BusTransitionOverlay loserReveal={loserReveal} isBusEntrance={isBusEntrance} busPassengers={busPassengers} t={t} theme={settings.theme} />
        <RootContainer key="pyramid-phase" className="p-2 pb-safe flex flex-col" shake={screenShake} isDiscoActive={isDiscoActive} theme={settings.theme}>
        {manualBusSelectionOverlay}
        {renderSettingsModal()}
        {renderPyramidHandTray()}
        {renderDevModeOrb()}
        {renderAdditionalModals()}
        {renderQuitModal()}
        {renderAdLoadingModal()}
        {renderColorPickerModal()}
        {/* Match Modal */}
        <PyramidMatchModal
          pendingMatches={pendingMatches}
          players={players}
          cardStyle={settings.cardStyle}
          theme={settings.theme}
          calmAccentColor={settings.calmAccentColor}
          isClosing={isMatchModalClosing}
          onResolveMatch={resolveMatch}
          onDismiss={dismissMatchModal}
          t={t}
          getSipsText={getSipsText}
        />
        {/* Early Bus Header Fade-In as Bus Starts Driving Away */}
        <div 
          key="early-bus-header"
          className={`flex-none px-2 sm:px-4 pt-2 absolute left-0 right-0 z-35 transition-opacity duration-1000 ease-out pointer-events-none ${
            isBusDeparting ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ top: 'var(--safe-top, 0px)' }}
        >
          <div className={`flex items-center justify-between p-3 sm:px-5 gap-3 ${getHeaderClasses()} !mb-0`}>
            {/* Left: Title & Passenger */}
            <div className={`flex flex-col justify-center min-w-0 gap-1 sm:gap-1.5 ${settings.theme === UITheme.CALM ? 'ml-3 sm:ml-4' : ''}`}>
              <div className="shrink-0 flex items-center">
                <ThemeLabel text={t("De Bus")} theme={settings.theme} size="lg" showCursor={false} />
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 font-medium">
                <span className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wider shrink-0">
                  {busPassengers.length > 1 ? t('Passagiers') : t('Passagier')}:
                </span>
                <span className="text-white font-black break-words">
                  {busPassengers.map(p => p.name).join(' & ')}
                </span>
              </div>
            </div>

            {/* Right: Counter */}
            <div className="flex items-center gap-2 sm:gap-3 flex-nowrap justify-end shrink-0 min-w-0">
              {renderDevMenu()}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full border text-[10px] uppercase font-black tracking-widest border-white/10 bg-white/5 text-slate-200 shrink-0">
                <PlayingCardIcon size={14} className="text-red-500 shrink-0" />
                <span className="whitespace-nowrap tabular-nums">{remainingBusCards} {t("kaarten")}</span>
              </div>
              {settings.busDecks > 1 && (
                <div className={`flex items-center gap-1 px-2 py-1.5 sm:py-2 rounded-full border text-[10px] uppercase font-black tracking-widest shrink-0 ${busDecksUsed >= settings.busDecks ? 'border-red-500/50 bg-red-900/20 text-red-200' : 'border-white/10 bg-white/5 text-slate-200'}`}>
                  <span>{t("Pakje")}</span>
                  <span className={`tabular-nums ${busDecksUsed >= settings.busDecks ? 'text-red-400' : 'text-slate-200'}`}>{busDecksUsed}/{settings.busDecks}</span>
                </div>
              )}
              {renderQuitButton()}
            </div>
          </div>
        </div>
        <div 
          key="pyramid-header"
          className={`flex-none flex justify-between items-center px-2.5 sm:px-4 py-2 gap-3 sm:gap-4 h-[76px] min-h-[76px] max-h-[76px] box-border ${getHeaderClasses()} !z-35 relative transition-opacity duration-500 ease-out ${
            (jumpingBusPlayer || isBusPassengerBoarded)
              ? 'opacity-0 pointer-events-none'
              : 'opacity-100'
          }`}
        >
          <div className="flex items-center gap-3 sm:gap-5 min-w-0 h-full">
                <div className="shrink-0 flex flex-col justify-center items-start text-left">
                  <div 
                    className="inline-block cursor-pointer"
                    onPointerDown={handleHeaderPointerDown}
                    onPointerUp={handleHeaderPointerUpOrLeave}
                    onPointerLeave={handleHeaderPointerUpOrLeave}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <ThemeLabel text={t("Piramide")} theme={settings.theme} size="md" align="left" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 leading-tight text-left">
                    {isPyramidDoubleSetup ? t("Kies een kaart per niveau") : t("Draai kaarten om")}
                  </p>
                </div>
                {!isPyramidDoubleSetup && (
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap shrink-0 h-full">
                {(() => {
                  const victim = findLoser();
                  const sortedPlayers = [...players].sort((a, b) => {
                    if (victim) {
                      if (a.id === victim.id) return -1;
                      if (b.id === victim.id) return 1;
                    }
                    return b.hand.length - a.hand.length;
                  });

                  const hasMore = sortedPlayers.length > 4;
                  const displayedPlayers = hasMore ? sortedPlayers.slice(0, 3) : sortedPlayers.slice(0, 4);

                  return (
                    <>
                      {displayedPlayers.map(p => {
                        const isLoser = victim && p.id === victim.id;
                        const hasCards = p.hand.length > 0;
                        const isSelected = isHandTrayOpen && !isMoreHandMode && playerHandToView?.id === p.id && !isHandClosing;
                        return (
                          <button 
                            key={p.id} 
                            onClick={() => handleTogglePlayerHand(p)} 
                            className="flex flex-col items-center justify-center shrink-0 p-0.5 transition-transform active:scale-95 cursor-pointer"
                          >
                            <div className={`w-9 h-9 flex items-center justify-center relative shrink-0 transition-all duration-300 ${jumpingBusPlayer?.id === p.id ? 'opacity-0 scale-50 pointer-events-none' : ''}`}>
                              {/* Selected Outer Halo */}
                              {isSelected && (
                                <div className="absolute -inset-[2px] rounded-full ring-2 ring-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] pointer-events-none z-20 animate-in fade-in zoom-in-95 duration-200" />
                              )}

                              {/* Avatar Circle - Exactly w-9 h-9 with 2px border for all */}
                              <div className={`w-9 h-9 rounded-full relative overflow-hidden flex items-center justify-center transition-all duration-200 ${
                                isLoser
                                  ? 'p-[2px]'
                                  : `border-2 ${isSelected ? 'border-white' : hasCards ? 'border-amber-500' : 'border-white/20 opacity-60'}`
                              }`}>
                                {isLoser && (
                                  <div 
                                    className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full pointer-events-none"
                                    style={{
                                      background: 'conic-gradient(from 0deg, #f59e0b, #ef4444, #f59e0b)'
                                    }}
                                  />
                                )}
                                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative z-10">
                                  <PlayerAvatar
                                    player={p}
                                    size="custom"
                                    className="w-full h-full text-[11px]"
                                    theme={settings.theme}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 mt-0.5 leading-none">
                              {isLoser && <Bus size={10} className="text-red-500 shrink-0" />}
                              <span className={`text-[10px] font-black tabular-nums leading-none ${
                                isSelected ? 'text-white' : isLoser ? 'text-amber-400' : hasCards ? 'text-amber-400' : 'text-slate-500'
                              }`}>
                                {p.hand.length}/4
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      {hasMore && (
                        <button
                          onClick={handleOpenMoreHand}
                          className="flex flex-col items-center justify-center shrink-0 p-0.5 transition-transform active:scale-95 cursor-pointer"
                          title={t("Meer spelers")}
                          aria-label={t("Meer spelers")}
                        >
                          <div className="w-9 h-9 flex items-center justify-center relative shrink-0">
                            {/* Selected Outer Halo */}
                            {isHandTrayOpen && isMoreHandMode && !isHandClosing && (
                              <div className="absolute -inset-[2px] rounded-full ring-2 ring-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] pointer-events-none z-20 animate-in fade-in zoom-in-95 duration-200" />
                            )}
                            <div className={`w-9 h-9 rounded-full bg-slate-800/80 border-2 transition-all flex items-center justify-center hover:border-amber-400/80 hover:bg-slate-700/80 ${
                              isHandTrayOpen && isMoreHandMode && !isHandClosing
                                ? 'border-white text-white'
                                : 'border-white/20 text-amber-400'
                            }`}>
                              <span className="text-[11px] font-black tracking-tight">+{sortedPlayers.length - 3}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 mt-0.5 leading-none">
                            <span className={`text-[10px] font-bold leading-none ${
                              isHandTrayOpen && isMoreHandMode && !isHandClosing ? 'text-white' : 'text-slate-400'
                            }`}>
                              {t("Meer")}
                            </span>
                          </div>
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-1">
            {renderDevMenu()}
            {renderQuitButton()}
          </div>
        </div>
        {feedback && !pendingMatches && (
          <div className="absolute top-24 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className={`mx-4 px-6 py-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl border-2 text-base font-black text-center animate-in zoom-in duration-200 ${feedback.type.includes('success') ? 'bg-green-900/90 border-green-400 text-green-100' : feedback.type === 'error' ? 'bg-red-900/90 border-red-500 text-white' : 'bg-slate-800/90 border-slate-500 text-white'}`}>
              {feedback.text}
            </div>
          </div>
        )}
        {distributeBanner && !pendingMatches && (
          <div key={distributeBanner.id} className={`absolute left-0 right-0 z-50 flex flex-col items-center gap-3 pointer-events-none px-4 ${distributeBanner.position === 'bottom' ? 'bottom-16' : 'top-28'}`}>
            <p className={`bg-slate-900/70 backdrop-blur-md border border-emerald-500/30 rounded-3xl px-6 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-1 ring-white/10 text-xl sm:text-2xl text-slate-200 font-medium drop-shadow-2xl text-center max-w-sm sm:max-w-md w-full
              ${distributeBanner.isFadingOut 
                ? (distributeBanner.position === 'bottom' ? 'animate-slide-out-bottom' : 'animate-slide-out-top') 
                : (distributeBanner.position === 'bottom' ? 'animate-slide-in-bottom' : 'animate-slide-in-top')}
            `}>
              {(() => {
                interface GroupedRes {
                  names: string[];
                  sips: number;
                  type: 'general' | 'self' | 'target';
                  targetName?: string;
                }
                const groups: GroupedRes[] = [];
                for (const res of distributeBanner.resolutions) {
                  const type: 'general' | 'self' | 'target' = !res.targetName
                    ? 'general'
                    : res.targetName === res.name
                    ? 'self'
                    : 'target';
                  const existing = groups.find(
                    (g) => g.sips === res.sips && g.type === type && (type !== 'target' || g.targetName === res.targetName)
                  );
                  if (existing) {
                    if (!existing.names.includes(res.name)) {
                      existing.names.push(res.name);
                    }
                  } else {
                    groups.push({
                      names: [res.name],
                      sips: res.sips,
                      type,
                      targetName: res.targetName,
                    });
                  }
                }
                const renderNames = (names: string[]) => {
                  return names.map((name, i) => (
                    <React.Fragment key={i}>
                      <span className="text-white font-black mx-1 underline decoration-emerald-500 underline-offset-4">
                        {name}
                      </span>
                      {i < names.length - 2 ? ", " : i === names.length - 2 ? (lang === 'en' ? " and " : " en ") : ""}
                    </React.Fragment>
                  ));
                };
                return groups.map((g, idx) => {
                  const isLast = idx === groups.length - 1;
                  const punctuation = isLast ? "!" : ", ";
                  const quantifierEn = g.names.length === 2 ? "both" : "all";
                  const quantifierNl = g.names.length === 2 ? "beiden" : "allemaal";
                  if (lang === 'en') {
                    if (g.type === 'general') {
                      if (g.names.length > 1) {
                        return (
                          <span key={idx}>
                            {renderNames(g.names)}
                            {` ${quantifierEn} give out `}
                            <span className="text-emerald-400 font-black text-4xl mx-1">{g.sips}</span>
                            {g.sips === 1 ? " sip" : " sips"}
                            {punctuation}
                          </span>
                        );
                      } else {
                        return (
                          <span key={idx}>
                            {renderNames(g.names)}
                            {" gives out "}
                            <span className="text-emerald-400 font-black text-4xl mx-1">{g.sips}</span>
                            {g.sips === 1 ? " sip" : " sips"}
                            {punctuation}
                          </span>
                        );
                      }
                    } else if (g.type === 'self') {
                      if (g.names.length > 1) {
                        return (
                          <span key={idx}>
                            {renderNames(g.names)}
                            {` ${quantifierEn} give `}
                            <span className="text-emerald-400 font-black text-4xl mx-1">{g.sips}</span>
                            {g.sips === 1 ? " sip" : " sips"}
                            {" to themselves"}
                            {punctuation}
                          </span>
                        );
                      } else {
                        return (
                          <span key={idx}>
                            {renderNames(g.names)}
                            {" gives "}
                            <span className="text-emerald-400 font-black text-4xl mx-1">{g.sips}</span>
                            {g.sips === 1 ? " sip" : " sips"}
                            {" to themselves"}
                            {punctuation}
                          </span>
                        );
                      }
                    } else {
                      if (g.names.length > 1) {
                        return (
                          <span key={idx}>
                            {renderNames(g.names)}
                            {` ${quantifierEn} give `}
                            <span className="text-emerald-400 font-black text-4xl mx-1">{g.sips}</span>
                            {g.sips === 1 ? " sip" : " sips"}
                            {" to "}
                            <span className="text-white font-black mx-1 underline decoration-amber-400 underline-offset-4">
                              {g.targetName}
                            </span>
                            {punctuation}
                          </span>
                        );
                      } else {
                        return (
                          <span key={idx}>
                            {renderNames(g.names)}
                            {" gives "}
                            <span className="text-emerald-400 font-black text-4xl mx-1">{g.sips}</span>
                            {g.sips === 1 ? " sip" : " sips"}
                            {" to "}
                            <span className="text-white font-black mx-1 underline decoration-amber-400 underline-offset-4">
                              {g.targetName}
                            </span>
                            {punctuation}
                          </span>
                        );
                      }
                    }
                  } else {
                    if (g.type === 'general') {
                      if (g.names.length > 1) {
                        return (
                          <span key={idx}>
                            {renderNames(g.names)}
                            {` delen ${quantifierNl} `}
                            <span className="text-emerald-400 font-black text-4xl mx-1">{g.sips}</span>
                            {g.sips === 1 ? " slok" : " slokken"}
                            {" uit"}
                            {punctuation}
                          </span>
                        );
                      } else {
                        return (
                          <span key={idx}>
                            {renderNames(g.names)}
                            {" deelt "}
                            <span className="text-emerald-400 font-black text-4xl mx-1">{g.sips}</span>
                            {g.sips === 1 ? " slok" : " slokken"}
                            {" uit"}
                            {punctuation}
                          </span>
                        );
                      }
                    } else if (g.type === 'self') {
                      if (g.names.length > 1) {
                        return (
                          <span key={idx}>
                            {renderNames(g.names)}
                            {` delen ${quantifierNl} `}
                            <span className="text-emerald-400 font-black text-4xl mx-1">{g.sips}</span>
                            {g.sips === 1 ? " slok" : " slokken"}
                            {" uit aan zichzelf"}
                            {punctuation}
                          </span>
                        );
                      } else {
                        return (
                          <span key={idx}>
                            {renderNames(g.names)}
                            {" deelt "}
                            <span className="text-emerald-400 font-black text-4xl mx-1">{g.sips}</span>
                            {g.sips === 1 ? " slok" : " slokken"}
                            {" uit aan zichzelf"}
                            {punctuation}
                          </span>
                        );
                      }
                    } else {
                      if (g.names.length > 1) {
                        return (
                          <span key={idx}>
                            {renderNames(g.names)}
                            {` delen ${quantifierNl} `}
                            <span className="text-emerald-400 font-black text-4xl mx-1">{g.sips}</span>
                            {g.sips === 1 ? " slok" : " slokken"}
                            {" uit aan "}
                            <span className="text-white font-black mx-1 underline decoration-amber-400 underline-offset-4">
                              {g.targetName}
                            </span>
                            {punctuation}
                          </span>
                        );
                      } else {
                        return (
                          <span key={idx}>
                            {renderNames(g.names)}
                            {" deelt "}
                            <span className="text-emerald-400 font-black text-4xl mx-1">{g.sips}</span>
                            {g.sips === 1 ? " slok" : " slokken"}
                            {" uit aan "}
                            <span className="text-white font-black mx-1 underline decoration-amber-400 underline-offset-4">
                              {g.targetName}
                            </span>
                            {punctuation}
                          </span>
                        );
                      }
                    }
                  }
                });
              })()}
            </p>
          </div>
        )}
        {isPyramidDoubleSetup && !isBusCrashing && pyramidDoubleSetupRow >= settings.pyramidRows - 2 && (
          <div className="absolute top-32 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
            <div className="bg-slate-900/90 backdrop-blur-xl border-2 border-red-500/50 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-sm w-full animate-in slide-in-from-top-10 duration-500 ring-1 ring-red-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase tracking-tight leading-none" style={{ color: 'var(--theme-accent)' }}>{t("Piramide")}</h3>
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
        {isPyramidComplete && !pendingMatches && !isBusCrashing && (
          <div className="absolute bottom-10 left-0 right-0 z-[60] flex justify-center animate-in slide-in-from-bottom-10 fade-in duration-500 px-4">
            <div className="w-full max-w-xs sm:max-w-sm animate-bounce-subtle">
              {renderToTheBusButton(proceedToBus, 'shadow-2xl hover:scale-105')}
            </div>
          </div>
        )}
          {/* Crashing Bus Animation Driving Across Cards, Braking Hard, Reversing & Waiting */}
          {isBusCrashing ? (
            <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden">
              <div 
                className="w-full flex justify-center"
                style={{
                  transform: busVerticalOffset !== null ? `translate3d(0, ${busVerticalOffset}px, 0)` : 'translate3d(0, 7.5vh, 0)',
                }}
              >
                <div 
                  ref={busCrashRef} 
                  data-bus-drop-target="true"
                  className={`animate-bus-crash w-full max-w-[500px] sm:max-w-[560px] transition-all duration-300 ${isBusPaused ? 'animate-bus-paused' : ''} ${
                    isHoveredOverBus ? 'scale-[1.03] drop-shadow-[0_0_35px_rgba(52,211,153,0.65)]' : ''
                  }`}
                >
                  <div className={`w-full ${isBusBraking ? 'animate-bus-skid-shake' : ''}`}>
                    <AnimatedPartyBus
                      passengers={busPassengers}
                      destinationText={busPassengers[0]?.name || t("DE BUS")}
                      isCrash={true}
                      isBraking={isBusBraking}
                      isReversing={isBusReversing}
                      passengerBoarded={isBusPassengerBoarded}
                      isChassisBouncing={isBusChassisBouncing}
                      theme={settings.theme}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {/* Loser Profile Picture Drops Down From Header Into Parked Bus */}
          {jumpingBusPlayer && (
            <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
              <div 
                className="w-full flex justify-center"
                style={{
                  transform: busVerticalOffset !== null ? `translate3d(0, ${busVerticalOffset}px, 0)` : 'translate3d(0, 7.5vh, 0)',
                }}
              >
                <div className="animate-player-bus-jump relative z-10 flex items-center justify-center">
                  <PlayerAvatar
                    player={jumpingBusPlayer}
                    size="custom"
                    className="w-14 h-14 sm:w-16 sm:h-16 text-2xl sm:text-3xl shadow-xl"
                    theme={settings.theme}
                  />
                  <div className="animate-player-jump-badge absolute top-full mt-1.5 left-1/2 -translate-x-1/2 flex flex-col items-center text-center pointer-events-none whitespace-nowrap">
                    <span className="text-base sm:text-lg font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      {jumpingBusPlayer.name}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-300 tracking-wide bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-white/10 shadow-sm mt-0.5">
                      {t("Gaat de bus in")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Shared Bus In-Place Partner Selection at Spotlight Drop Position */}
          {isSharedBusSelecting && (
            <div className="absolute inset-0 z-50 pointer-events-auto flex items-center justify-center overflow-visible select-none">
              <div 
                className="w-full flex justify-center"
                style={{
                  transform: busVerticalOffset !== null ? `translate3d(0, ${busVerticalOffset}px, 0)` : 'translate3d(0, 7.5vh, 0)',
                }}
              >
                <div 
                  className="relative z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300"
                  style={{
                    transform: 'translate3d(0, -32vh, 0)',
                  }}
                >
                  {/* 'shared bus' is only the above subtext */}
                  <div className="mb-1 opacity-80 pointer-events-none flex items-center justify-center">
                    <ThemeLabel text={t("Gedeelde Bus")} theme={settings.theme} size="lg" showCursor={false} />
                  </div>

                  {/* Main Question: {playername}, who will you bring with you into the bus? */}
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight text-center max-w-sm sm:max-w-md px-2 mb-4 drop-shadow-md leading-tight pointer-events-none">
                    <span className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.35)]">
                      {(busPassengers[0] || findLoser())?.name}
                    </span>
                    {t(", Wie neem je mee de bus in?")}
                  </h2>

                  {/* Candidate profile picture(s) - max 6 per row, 2 rows max, like match modal */}
                  <div className="flex flex-wrap justify-center gap-3 sm:gap-4 py-1 max-w-[420px] sm:max-w-[500px]">
                    {players.filter(p => !busPassengers.some(bp => bp.id === p.id) && !p.isImmune).slice(0, 12).map(candidate => {
                      const isThisDragged = draggedSharedBusPartnerId === candidate.id;

                      return (
                        <div
                          key={candidate.id}
                          onPointerDown={(e) => handlePartnerPointerDown(e, candidate.id)}
                          className={`group relative flex flex-col items-center gap-1.5 p-1 rounded-2xl select-none touch-none cursor-grab active:cursor-grabbing shrink-0 transition-all ${
                            isThisDragged ? 'opacity-20 scale-95' : ''
                          }`}
                          style={{ width: '64px' }}
                        >
                          <div className="relative">
                            <div
                              className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-105 group-active:scale-95 transition-all pointer-events-none ${getMatcherAvatarFrameClasses()}`}
                            >
                              <PlayerAvatar
                                player={candidate}
                                size="custom"
                                className="w-full h-full text-xl sm:text-2xl"
                                theme={settings.theme}
                              />
                            </div>
                          </div>

                          <span className="text-xs sm:text-sm font-bold text-slate-300 group-hover:text-white drop-shadow pointer-events-none transition-colors truncate max-w-[60px]">
                            {candidate.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Nobody option */}
                  <button
                    onClick={() => handleInPlaceSharedBusSelection(null)}
                    className="mt-4 px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white bg-slate-950/80 hover:bg-slate-900 border border-white/15 hover:border-white/35 backdrop-blur-md shadow-lg transition-all active:scale-95"
                  >
                    {t("NIEMAND")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Floating Drag Avatar Ghost (Exact MATCH modal UI/UX) */}
          {isSharedBusSelecting && draggedSharedBusPartnerId && sharedBusDragPos && (
            <div
              className="fixed z-[999] pointer-events-none flex flex-col items-center"
              style={{
                left: sharedBusDragPos.x,
                top: sharedBusDragPos.y,
                transform: `translate(-50%, -6px) rotate(${sharedBusDragTilt}deg)`,
              }}
            >
              <div className="flex flex-col items-center z-20 mb-4">
                <div
                  className={`w-3 h-3 transition-all ${getDragPointerClasses(isHoveredOverBus)}`}
                />
              </div>

              <div className="flex flex-col items-center gap-2 -mt-1 relative">
                <div className="relative">
                  <div
                    className={`w-16 h-16 flex items-center justify-center overflow-hidden transition-all shadow-[0_15px_30px_rgba(0,0,0,0.5)] ${getDragAvatarRingClasses(
                      isHoveredOverBus
                    )}`}
                  >
                    {(() => {
                      const draggingPlayer = players.find(p => p.id === draggedSharedBusPartnerId);
                      return draggingPlayer ? (
                        <PlayerAvatar
                          player={draggingPlayer}
                          size="custom"
                          theme={settings.theme}
                          className="w-full h-full text-xl"
                        />
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        {/* Pyramid Grid - Reduced Scale - No Entry Animation */}
        <div
          ref={pyramidContainerRef}
          onPointerDown={handlePyramidPointerDown}
          onPointerMove={handlePyramidPointerMove}
          onPointerUp={handlePyramidPointerEnd}
          onPointerCancel={handlePyramidPointerEnd}
          onPointerLeave={handlePyramidPointerEnd}
          className="flex-1 flex items-center justify-center p-2 relative touch-none select-none overflow-hidden"
        >
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
                    const scatterStyle = (() => {
                      if (!pyramidScatterCards) return undefined;
                      const xDir = cardIndex >= rowIndex / 2 ? 1 : -1;
                      const xDist = (280 + cardIndex * 150) * xDir;
                      const yDist = (rowIndex - settings.pyramidRows / 2) * 190 + (rowIndex === 0 ? -280 : 120);
                      const rot = xDir * (100 + cardIndex * 50) + (rowIndex % 2 === 0 ? 180 : -180);
                      return {
                        transform: `translate3d(${xDist}px, ${yDist}px, 0) rotate(${rot}deg) scale(0.25)`,
                        opacity: 0,
                        transition: `transform 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${cardIndex * 0.03}s, opacity 0.55s ease-out ${cardIndex * 0.03}s`,
                        pointerEvents: 'none' as const,
                      };
                    })();
                    return (
                      <div
                        key={card ? card.id : `${rowIndex}-${cardIndex}`}
                        data-pyramid-card="true"
                        data-card-id={card ? card.id : `${rowIndex}-${cardIndex}`}
                        data-row-index={rowIndex}
                        data-card-index={cardIndex}
                        style={scatterStyle}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          isPyramidSwipingRef.current = true;
                          lastSwipedCardKeyRef.current = null;
                          handlePyramidCardInteraction(rowIndex, cardIndex);
                        }}
                        className={`relative group ${hasMatch ? 'cursor-pointer' : ''}`}
                      >
                        <PlayingCard
                          card={isRevealed ? card : null}
                          isFaceDown={!isRevealed}
                          size="md"
                          style={settings.cardStyle}
                          className={`${doubledPyramidCardIds.has(card?.id || '') ? 'rotate-90' : ''} ${isPyramidDoubleSetup && rowIndex === pyramidDoubleSetupRow ? 'ring-4 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : ''} ${pulseValidCards && rowIndex === activeRowIndex && !isRevealed ? (settings.theme === UITheme.STARS ? 'ring-2 ring-slate-200 shadow-[0_0_25px_rgba(226,232,240,0.8),0_0_10px_rgba(255,255,255,0.5)] z-20 animate-pulse' : 'animate-pyramid-ring-pulse z-20') : ''} transition-all duration-300 ${!isRevealed ? 'z-10' : 'z-0'} ${hasMatch ? (settings.theme === UITheme.STARS ? 'ring-2 ring-[#fef08a] shadow-[0_0_35px_rgba(254,240,138,0.85),0_0_15px_rgba(226,232,240,0.6)] scale-[1.04]' : 'ring-[3px] ring-green-500 shadow-[0_0_25px_rgba(34,197,94,0.7)] scale-[1.02]') : ''}`}
                        />
                      </div>
                    );
                  })}
                  {/* Row Indicator */}
                  {rowIndex !== settings.pyramidRows - 1 && (
                    <div className={`absolute top-1/2 -translate-y-1/2 right-full text-[12px] sm:text-[14px] text-right whitespace-nowrap drop-shadow-lg transition-opacity duration-500 ease-out ${
                      isBusCrashing ? 'opacity-0 pointer-events-none' : 'opacity-80'
                    } ${
                      row[0] && doubledPyramidCardIds.has(row[0].id) ? 'mr-12 sm:mr-16' : 'mr-4 sm:mr-6'
                    }`}>
                      {settings.theme === UITheme.STARS ? (
                        <span className="text-amber-200 font-mono tracking-widest text-[11px] sm:text-xs drop-shadow-[0_0_8px_rgba(254,240,138,0.7)] flex items-center gap-1 justify-end">
                          {Array(settings.pyramidRows - rowIndex).fill('✦').join(' ')}
                        </span>
                      ) : (
                        Array(settings.pyramidRows - rowIndex).fill('🍺').join('')
                      )}
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        </div>
      </RootContainer>
      </>
    );
  }

  // 5. BUS TEAM SELECT - Minimalist text-focused shared bus screen
  if (phase === GamePhase.BUS_TEAM_SELECTION) {
    const victim = busPassengers[0] || players[0];
    const baseStyle = resolvedBusMode === 'digital' ? digitalBusBackgroundStyle : physicalBusBackgroundStyle;
    return (
      <>
        <PersistentBackground theme={settings.theme} calmAccentColor={settings.calmAccentColor} style={baseStyle as React.CSSProperties} />
        <RootContainer 
          className="items-center justify-center text-center border-0 outline-0 animate-in fade-in duration-700 select-none" 
          disableSafeTop 
          theme={settings.theme}
        >
          {/* Top Bar - Minimal controls */}
          <div 
            className="w-full flex items-center justify-between px-4 pt-3 absolute top-0 left-0 right-0 z-40"
            style={{ paddingTop: 'calc(0.75rem + var(--safe-top, 0px))' }}
          >
            <div 
              className="cursor-pointer select-none"
              onPointerDown={handleHeaderPointerDown}
              onPointerUp={handleHeaderPointerUpOrLeave}
              onPointerLeave={handleHeaderPointerUpOrLeave}
            >
              {/* Invisible tap target for dev menu toggling */}
              <div className="w-10 h-10 -m-2 opacity-0" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              {renderDevMenu()}
              {renderQuitButton()}
            </div>
          </div>

          {renderSettingsModal()}
          {renderDevModeOrb()}
          {renderAdditionalModals()}
          {renderQuitModal()}
          {renderAdLoadingModal()}
          {renderColorPickerModal()}

          {/* Clean, spacious center content: Just text on the relatively empty screen */}
          <div className="flex-1 w-full max-w-xl mx-auto flex flex-col items-center justify-center px-4 py-8 animate-in fade-in duration-700">
            {/* Subtext 'shared bus' */}
            <div 
              className="cursor-pointer mb-3 select-none flex items-center justify-center opacity-85"
              onPointerDown={handleHeaderPointerDown}
              onPointerUp={handleHeaderPointerUpOrLeave}
              onPointerLeave={handleHeaderPointerUpOrLeave}
            >
              <ThemeLabel text={t("Gedeelde Bus")} theme={settings.theme} size="lg" showCursor={false} />
            </div>

            {/* Main Title: {playername}, who will you bring into the bus with you */}
            <div 
              className="cursor-pointer mb-8 sm:mb-12 max-w-lg mx-auto"
              onPointerDown={handleHeaderPointerDown}
              onPointerUp={handleHeaderPointerUpOrLeave}
              onPointerLeave={handleHeaderPointerUpOrLeave}
            >
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                <span className="text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.35)]">
                  {victim?.name}
                </span>
                {t(", Wie neem je mee de bus in?")}
              </h1>
            </div>

            {/* Clean player selection options */}
            <ScrollIndicatorContainer
              orientation="vertical"
              theme={settings.theme}
              className="w-full max-w-xs sm:max-w-sm max-h-[42vh]"
              scrollClassName="space-y-2.5 px-2"
            >
              {/* Option: Nobody / Alone */}
              <button
                onClick={() => handleSharedBusSelection(null)}
                className="w-full py-3.5 px-4 rounded-2xl text-slate-300 hover:text-white font-bold text-xs uppercase tracking-widest border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all active:scale-95 mb-1 shadow-sm"
              >
                {t("NIEMAND")}
              </button>

              {/* Eligible Players */}
              {players.filter(p => !busPassengers.some(bp => bp.id === p.id) && !p.isImmune).map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSharedBusSelection(p)}
                  className="w-full py-3 px-4 rounded-2xl flex items-center justify-between text-white font-semibold text-sm bg-white/5 hover:bg-white/15 border border-white/10 hover:border-amber-400/40 backdrop-blur-md transition-all shadow-md active:scale-95 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <PlayerAvatar player={p} size="custom" className="w-9 h-9 text-base shadow-sm" theme={settings.theme} />
                    <span className="text-base font-bold truncate">{p.name}</span>
                  </div>
                  <HeartPulse size={20} className="text-red-400/70 group-hover:text-red-400 shrink-0 transition-colors" />
                </button>
              ))}

              {/* Immune Players */}
              {players.filter(p => !busPassengers.some(bp => bp.id === p.id) && p.isImmune).map(p => (
                <button
                  key={p.id}
                  disabled
                  className="w-full py-3 px-4 rounded-2xl flex items-center justify-between text-white/40 font-semibold text-sm border border-white/5 bg-white/[0.02] cursor-not-allowed opacity-50 shadow-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <PlayerAvatar player={p} size="custom" className="w-9 h-9 text-base grayscale opacity-50" theme={settings.theme} />
                    <span className="text-base font-bold truncate line-through">{p.name}</span>
                  </div>
                  <Shield size={20} className="text-amber-400/50 shrink-0" />
                </button>
              ))}
            </ScrollIndicatorContainer>
          </div>
        </RootContainer>
      </>
    );
  }
  // 6. THE BUS
  if (phase === GamePhase.THE_BUS) {
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
        <>
          <PersistentBackground theme={settings.theme} calmAccentColor={settings.calmAccentColor} />
        <BusTransitionOverlay loserReveal={loserReveal} isBusEntrance={isBusEntrance} busPassengers={busPassengers} t={t} theme={settings.theme} />
          <RootContainer className="animate-in fade-in duration-500" theme={settings.theme}>
          {isBusWon && <Confetti />}
          {isBusWon && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center px-6 pb-28 pt-8 z-[90] gap-5 sm:gap-7 max-w-2xl mx-auto">
              {/* Top Text - Above Bus */}
              <div className="w-full text-center animate-[fadeInText_1.5s_ease-out_2.5s_forwards] opacity-0 shrink-0">
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg leading-tight">
                  {t("Je mag uit de bus! 🎉")}
                </h2>
              </div>
              
              {/* Center Animated Bus SVG - Perfectly Centered Between Texts */}
              <div className="animate-[driveIn_2.5s_cubic-bezier(0.34,1.56,0.64,1)_1.2s_forwards] opacity-0 shrink-0 flex items-center justify-center py-1">
                <Bus size={175} strokeWidth={1.5} className="text-emerald-400 drop-shadow-[0_15px_35px_rgba(52,211,153,0.5)] opacity-95" />
              </div>
              
              {/* Bottom Text - Below Bus */}
              {busPassengers.length > 0 && (() => {
                const busCardTotal = busCards.length > 0 ? busCards.length : (settings.busLength || 5);
                const firstTryChance = Math.round(Math.pow(0.71, Math.max(1, busCardTotal - 1)) * 100);
                const isFirstTry = busAttempts <= 1 && busSipsTaken === 0;
                
                return (
                  <div className="w-full text-center animate-[fadeInText_1.5s_ease-out_3.8s_forwards] opacity-0 shrink-0 px-2 sm:px-4">
                    <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-slate-100 font-bold drop-shadow-xl mx-auto max-w-2xl sm:max-w-3xl leading-snug tracking-tight">
                      {isFirstTry ? (
                        lang === 'en' ? (
                          <>Well done, you got out on the first try! The chance of that happening is approximately <span className="text-emerald-400 font-black text-3xl sm:text-4xl md:text-5xl mx-1.5 inline-block">{firstTryChance}%</span> <span className="text-emerald-400 font-bold text-2xl sm:text-3xl md:text-4xl ml-1">;)</span></>
                        ) : (
                          <>Goed gedaan, je bent er in één keer uitgekomen! De kans dat dit gebeurt is ongeveer <span className="text-emerald-400 font-black text-3xl sm:text-4xl md:text-5xl mx-1.5 inline-block">{firstTryChance}%</span> <span className="text-emerald-400 font-bold text-2xl sm:text-3xl md:text-4xl ml-1">;)</span></>
                        )
                      ) : (
                        lang === 'en' ? (
                          <>Double check if <span className="text-white font-black mx-1 underline decoration-emerald-500 underline-offset-4 decoration-2 sm:decoration-4">{busPassengers.map(p => p.name).join(' & ')}</span> really drank <span className="text-emerald-400 font-black text-3xl sm:text-4xl md:text-5xl mx-1.5 inline-block">{busSipsTaken}</span> {busSipsTaken === 1 ? 'sip' : 'sips'} <span className="text-emerald-400 font-bold text-2xl sm:text-3xl md:text-4xl ml-1">;)</span></>
                        ) : (
                          <>Controleer nog even of <span className="text-white font-black mx-1 underline decoration-emerald-500 underline-offset-4 decoration-2 sm:decoration-4">{busPassengers.map(p => p.name).join(' & ')}</span> echt <span className="text-emerald-400 font-black text-3xl sm:text-4xl md:text-5xl mx-1.5 inline-block">{busSipsTaken}</span> {busSipsTaken === 1 ? 'slok' : 'slokken'} {busPassengers.length > 1 ? 'hebben' : 'heeft'} gedronken <span className="text-emerald-400 font-bold text-2xl sm:text-3xl md:text-4xl ml-1">;)</span></>
                        )
                      )}
                    </p>
                  </div>
                );
              })()}
            </div>
          )}
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
                      <h2 
                        className="text-3xl sm:text-4xl font-black text-white leading-tight cursor-pointer"
                        onPointerDown={handleHeaderPointerDown}
                        onPointerUp={handleHeaderPointerUpOrLeave}
                        onPointerLeave={handleHeaderPointerUpOrLeave}
                      >
                        {t("De Busrit")}
                      </h2>
                    </div>
                    {!isBusWon && (
                      <p 
                        className="text-slate-300 text-sm cursor-pointer"
                        onPointerDown={() => {
                          const target = busPassengers[0] || players[0];
                          if (target) handleAvatarPointerDown(target);
                        }}
                        onPointerUp={handleAvatarPointerUpOrLeave}
                        onPointerLeave={handleAvatarPointerUpOrLeave}
                      >
                        {t("Passagier")}{busPassengers.length > 1 ? 's' : ''}: <span className="text-white font-black">{passengerNames || 'Onbekend'}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-center">
                    {renderDevMenu()}
                    <div className="text-right text-slate-200 text-[11px] uppercase font-black tracking-[0.25em] bg-white/5 border border-white/10 px-3 py-2 rounded-2xl">
                      {t("Kaart")} {physicalBusPosition} / {settings.busLength}
                    </div>
                  </div>
                </div>
                {!isBusWon && (
                  <div className="fixed z-[96] items-center" style={{ top: 'calc(var(--safe-top, 0px) + 1rem)', right: '1rem' }}>
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
                    onClick={() => dispatchGameEvent({ type: 'START_BUS', passengers: busPassengers })}
                    className={`w-full sm:w-auto text-center text-slate-300 font-semibold py-2 px-3 rounded-lg hover:text-white transition-opacity duration-300 underline underline-offset-4 decoration-slate-500/70 ${isBusWon ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  >
                    {t("Toch een Digitale Bus")}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {isBusWon && (
            <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 flex justify-center z-30 animate-in slide-in-from-bottom-4 duration-500 delay-[4000ms] fill-mode-both px-4">
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
          {renderSettingsModal()}
          {renderDevModeOrb()}
        {renderAdditionalModals()}
{renderQuitModal()}
{renderAdLoadingModal()}
{renderColorPickerModal()}
        </RootContainer>
      </>
    );
  }
    const passengerNames = busPassengers.map(p => p.name).join(' & ');
    return (
      <>
        <PersistentBackground theme={settings.theme} calmAccentColor={settings.calmAccentColor} isDiscoActive={isDiscoActive} style={digitalBusBackgroundStyle} />
        <BusTransitionOverlay loserReveal={loserReveal} isBusEntrance={isBusEntrance} busPassengers={busPassengers} t={t} theme={settings.theme} />
        <RootContainer 
          key="bus-phase"
          className="p-0 relative flex flex-col" 
          shake={screenShake} 
          isDiscoActive={isDiscoActive}
          theme={settings.theme}
        >
        {isBusWon && <Confetti />}
        {isBusWon && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center px-6 pb-28 pt-8 z-[90] gap-5 sm:gap-7 max-w-2xl mx-auto">
            {/* Top Text - Above Bus */}
            <div className="w-full text-center animate-[fadeInText_1.5s_ease-out_2.5s_forwards] opacity-0 shrink-0">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg leading-tight">
                {t("Je mag uit de bus! 🎉")}
              </h2>
            </div>
            
            {/* Center Animated Bus SVG - Perfectly Centered Between Texts */}
            <div className="animate-[driveIn_2.5s_cubic-bezier(0.34,1.56,0.64,1)_1.2s_forwards] opacity-0 shrink-0 flex items-center justify-center py-1">
              <Bus size={175} strokeWidth={1.5} className="text-emerald-400 drop-shadow-[0_15px_35px_rgba(52,211,153,0.5)] opacity-95" />
            </div>
            
            {/* Bottom Text - Below Bus */}
            {busPassengers.length > 0 && (() => {
              const busCardTotal = busCards.length > 0 ? busCards.length : (settings.busLength || 5);
              const firstTryChance = Math.round(Math.pow(0.71, Math.max(1, busCardTotal - 1)) * 100);
              const isFirstTry = busAttempts <= 1 && busSipsTaken === 0;
              
              return (
                <div className="w-full text-center animate-[fadeInText_1.5s_ease-out_3.8s_forwards] opacity-0 shrink-0 px-2 sm:px-4">
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-slate-100 font-bold drop-shadow-xl mx-auto max-w-2xl sm:max-w-3xl leading-snug tracking-tight">
                    {isFirstTry ? (
                      lang === 'en' ? (
                        <>Well done, you got out on the first try! The chance of that happening is approximately <span className="text-emerald-400 font-black text-3xl sm:text-4xl md:text-5xl mx-1.5 inline-block">{firstTryChance}%</span> <span className="text-emerald-400 font-bold text-2xl sm:text-3xl md:text-4xl ml-1">;)</span></>
                      ) : (
                        <>Goed gedaan, je bent er in één keer uitgekomen! De kans dat dit gebeurt is ongeveer <span className="text-emerald-400 font-black text-3xl sm:text-4xl md:text-5xl mx-1.5 inline-block">{firstTryChance}%</span> <span className="text-emerald-400 font-bold text-2xl sm:text-3xl md:text-4xl ml-1">;)</span></>
                      )
                    ) : (
                      lang === 'en' ? (
                        <>Double check if <span className="text-white font-black mx-1 underline decoration-emerald-500 underline-offset-4 decoration-2 sm:decoration-4">{busPassengers.map(p => p.name).join(' & ')}</span> really drank <span className="text-emerald-400 font-black text-3xl sm:text-4xl md:text-5xl mx-1.5 inline-block">{busSipsTaken}</span> {busSipsTaken === 1 ? 'sip' : 'sips'} <span className="text-emerald-400 font-bold text-2xl sm:text-3xl md:text-4xl ml-1">;)</span></>
                      ) : (
                        <>Controleer nog even of <span className="text-white font-black mx-1 underline decoration-emerald-500 underline-offset-4 decoration-2 sm:decoration-4">{busPassengers.map(p => p.name).join(' & ')}</span> echt <span className="text-emerald-400 font-black text-3xl sm:text-4xl md:text-5xl mx-1.5 inline-block">{busSipsTaken}</span> {busSipsTaken === 1 ? 'slok' : 'slokken'} {busPassengers.length > 1 ? 'hebben' : 'heeft'} gedronken <span className="text-emerald-400 font-bold text-2xl sm:text-3xl md:text-4xl ml-1">;)</span></>
                      )
                    )}
                  </p>
                </div>
              );
            })()}
          </div>
        )}
        {showReshuffleBanner && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 px-6 py-3 bg-slate-900/95 border border-red-500/50 text-white rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.5)] backdrop-blur-xl flex-row animate-[bounce-subtle_2s_ease-in-out_infinite]">
              <RefreshCw size={20} className="animate-spin text-red-500 shrink-0" strokeWidth={3} />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-red-400 uppercase font-black tracking-widest leading-none mb-1">{t("Kaarten van pakje zijn toegevoegd")}</span>
                <span className="text-sm font-black uppercase tracking-wider leading-none text-white">
                  {t("Pakje")} {busDecksUsed}/{settings.busDecks}
                </span>
              </div>
            </div>
          </div>
        )}
        {/* Header - Responsive & Stable with Smooth Entrance Animation */}
        <div className="flex-none px-2 sm:px-4 pt-2 relative z-30">
          <div 
            className={`flex items-center justify-between p-3 sm:px-5 gap-3 ${getHeaderClasses()} !mb-0`}
          >
            {/* Left: Title & Passenger */}
            <div className={`flex flex-col justify-center min-w-0 gap-1 sm:gap-1.5 ${settings.theme === UITheme.CALM ? 'ml-3 sm:ml-4' : ''}`}>
              <div className="shrink-0 flex items-center">
                <div 
                  className="pointer-events-auto cursor-pointer"
                  onPointerDown={handleHeaderPointerDown}
                  onPointerUp={handleHeaderPointerUpOrLeave}
                  onPointerLeave={handleHeaderPointerUpOrLeave}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <ThemeLabel text={t("De Bus")} theme={settings.theme} size="lg" showCursor={false} />
                </div>
              </div>
              {/* Passenger Line - Horizontal, never truncated */}
              <div 
                className={`flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 font-medium transition-opacity duration-300 pointer-events-auto cursor-pointer ${isBusWon ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                onPointerDown={() => {
                  const target = busPassengers[0] || players[0];
                  if (target) handleAvatarPointerDown(target);
                }}
                onPointerUp={handleAvatarPointerUpOrLeave}
                onPointerLeave={handleAvatarPointerUpOrLeave}
              >
                <span className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-bold tracking-wider shrink-0">
                  {busPassengers.length > 1 ? t('Passagiers') : t('Passagier')}:
                </span>
                <span className="text-white font-black break-words">
                  {passengerNames}
                </span>
              </div>
            </div>

            {/* Right: Actions / Counter / Quit - Vertically Centered */}
            <div className="flex items-center gap-2 sm:gap-3 flex-nowrap justify-end shrink-0 min-w-0">
              {renderDevMenu()}
              <button 
                onClick={() => setIsCardOverviewOpen(true)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full border text-[10px] uppercase font-black tracking-widest transition-all active:scale-95 hover:bg-white/5 cursor-pointer border-white/10 bg-white/5 text-slate-200 shrink-0 ${
                  remainingBusCards > 0 && !isBusWon ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <PlayingCardIcon size={14} className="text-red-500 shrink-0" />
                <span className="whitespace-nowrap tabular-nums">{remainingBusCards} {t("kaarten")}</span>
              </button>
              {settings.busDecks > 1 && (
                <div className={`flex items-center gap-1 px-2 py-1.5 sm:py-2 rounded-full border text-[10px] uppercase font-black tracking-widest shrink-0 transition-opacity duration-300 ${isBusWon ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${busDecksUsed >= settings.busDecks ? 'border-red-500/50 bg-red-900/20 text-red-200' : 'border-white/10 bg-white/5 text-slate-200'}`}>
                  <span>{t("Pakje")}</span>
                  <span className={`tabular-nums ${busDecksUsed >= settings.busDecks ? 'text-red-400' : 'text-slate-200'}`}>{busDecksUsed}/{settings.busDecks}</span>
                </div>
              )}
              {!isBusWon && renderQuitButton()}
            </div>
          </div>
        </div>
        {renderSettingsModal()}
        {renderDevModeOrb()}
        {renderAdditionalModals()}
{renderQuitModal()}
{renderAdLoadingModal()}
{renderColorPickerModal()}
        {/* Bus Cards */}
        <div key="bus-cards-container" className="flex-1 relative flex items-center bg-transparent overflow-hidden w-full animate-in fade-in duration-500 ease-out">
          <div
            ref={busScrollRef}
            className="w-full overflow-x-auto flex items-center px-[40vw] gap-6 snap-x snap-mandatory scroll-smooth no-scrollbar h-full py-6"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)',
              maskImage: 'linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)',
            }}
          >
            {busCardStates.map(({ card, index, isBase, isHistory, isReference, isFocused, isRevealed, containerClass, isWrong }) => (
              <div
                key={`${card.id}-${index}`}
                className="animate-bus-card-deal flex-none flex flex-col items-center justify-center snap-center relative"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div
                  ref={el => busCardRefs.current[index] = el}
                  className={`relative flex-none flex flex-col items-center justify-center transition-all duration-700 ${containerClass} ${isBusWon ? 'animate-[fallDown_1.5s_cubic-bezier(0.55,0.085,0.68,0.53)_forwards]' : ''}`}
                  style={isBusWon ? { animationDelay: `${index * 0.15}s` } : undefined}
                  onPointerDown={() => devSettings.peekCards && (busPassengers.some(p => p.isDev) || players.some(p => p.isDev) || devModeArmed) && setPreviewCardId(card.id)}
                  onPointerUp={() => setPreviewCardId(null)}
                  onPointerLeave={() => setPreviewCardId(null)}
                  onPointerCancel={() => setPreviewCardId(null)}
                >
                  {isBase && !isBusWon && (
                    <span className={`absolute -top-10 text-xs uppercase font-black tracking-widest ${
                      settings.theme === UITheme.STARS 
                        ? 'text-[#fef08a] font-mono tracking-[0.25em] drop-shadow-[0_0_10px_rgba(254,240,138,0.75)]' 
                        : 'text-slate-500'
                    }`}>
                      {t("Start")}
                    </span>
                  )}
                  <PlayingCard
                    card={card}
                    isFaceDown={!isRevealed && previewCardId !== card.id}
                    size="md"
                    style={settings.cardStyle}
                    highlight={!isBusWon && (isReference || isWrong || isFocused)}
                    className={
                      isBusWon
                        ? 'ring-2 ring-amber-300 shadow-[0_0_15px_rgba(250,204,21,0.5)] border border-white/40 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-[1px]'
                        : `${isHistory && !isReference && !isBusWon ? 'grayscale' : ''} ${isWrong ? 'ring-4 ring-red-600 shadow-[0_0_60px_rgba(220,38,38,0.7)]' : ''} ${isFocused ? 'scale-[1.03] ring-2 ring-red-300/70' : ''} border border-white/40 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-[1px]`
                    }
                  />
                  {/* Icons */}
                  {isHistory && index > 0 && !isReference && !isBusWon && (
                    <div className={`absolute -bottom-4 rounded-full p-1.5 shadow-lg z-20 ${
                      settings.theme === UITheme.STARS 
                        ? 'bg-[#0a0d18]/90 border border-white/25 text-slate-100 shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                        : 'bg-emerald-500 border-2 border-black'
                    }`}>
                      <Check size={16} className={settings.theme === UITheme.STARS ? "text-slate-100" : "text-white"} strokeWidth={4} />
                    </div>
                  )}
                  {isWrong && !isBusWon && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                      <div className="bg-red-600 rounded-full p-2.5 shadow-2xl animate-stamp border-4 border-black no-calm-override">
                        <X size={36} className="text-white" strokeWidth={5} />
                      </div>
                    </div>
                  )}
                  {isBusWon && (
                    <div className="absolute -top-16 z-50 animate-[bounce_0.5s_infinite]">
                      <Sparkles className="text-yellow-400 w-12 h-12 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" fill="currentColor" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Controls */}
        <div key="bus-controls-bar" className="flex-none w-full bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-4 pb-safe pb-6 px-4 z-20 animate-in fade-in duration-500 ease-out">
          <div className="max-w-md mx-auto w-full">
            {feedback ? (
              <div className="w-full">
                <div
                  key={feedback.text}
                  className={`p-4 rounded-2xl text-center font-black text-lg border-2 shadow-2xl backdrop-blur-md ${
                    feedback.type === 'success' || feedback.type === 'info'
                      ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-[0_0_35px_rgba(16,185,129,0.3)] animate-feedback-success'
                      : 'bg-red-950/90 border-red-400 text-white shadow-[0_0_35px_rgba(239,68,68,0.3)] animate-feedback-error'
                  }`}
                >
                  {feedback.text}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                {isBusDeckExhausted ? (
                  <div className="text-center w-full text-red-200 font-black text-sm uppercase tracking-[0.2em] bg-red-900/30 border border-red-800 rounded-2xl px-4 py-3">
                    {t("Pakje leeg – pak een nieuw deck om verder te gaan")}
                  </div>
                ) : busWrongCardIndex === null && !isBusWon ? (
                  <div className="flex flex-col gap-3 w-full">
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={() => handleBusGuess('HIGHER')} className={getBusGuessBtnClasses('HIGHER')}>
                        <ChevronUp size={32} className={`${settings.theme === UITheme.METRO ? 'text-slate-950 mb-1 group-hover:scale-125 transition-transform' : settings.theme === UITheme.BEER ? 'text-slate-950 mb-1 group-hover:scale-125 transition-transform' : settings.theme === UITheme.STARS ? 'text-slate-200 mb-1 group-hover:scale-125 transition-transform drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]' : 'text-green-400 mb-1 group-hover:scale-125 transition-transform'}`} />
                        <span className="text-sm uppercase tracking-[0.2em]">{t("Hoger")}</span>
                      </button>
                      <button onClick={() => handleBusGuess('LOWER')} className={getBusGuessBtnClasses('LOWER')}>
                        <ChevronDown size={32} className={`${settings.theme === UITheme.METRO ? 'text-[var(--theme-accent)] mb-1 group-hover:scale-125 transition-transform' : settings.theme === UITheme.BEER ? 'text-amber-100 mb-1 group-hover:scale-125 transition-transform' : settings.theme === UITheme.STARS ? 'text-slate-200 mb-1 group-hover:scale-125 transition-transform drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]' : 'text-red-400 mb-1 group-hover:scale-125 transition-transform'}`} />
                        <span className="text-sm uppercase tracking-[0.2em]">{t("Lager")}</span>
                      </button>
                    </div>
                    {(() => {
                      const prevCard = busCards[currentBusIndex - 1];
                      const cardText = prevCard ? getRankString(prevCard.rank) : '';
                      return (
                        <button onClick={() => handleBusGuess('EQUAL')} className={getBusGuessBtnClasses('EQUAL')}>
                          {t("GELIJK")}{cardText ? ` (${cardText})` : ''}
                        </button>
                      );
                    })()}
                  </div>
                ) : isBusWon ? (
                  <button
                    onClick={() => { prepareAdInterstitial(ADMOB_INTERSTITIAL_LEADERBOARD_UNIT_ID); setPhase(GamePhase.GAME_OVER); }}
                    className={`w-full text-xl sm:text-2xl font-black px-8 sm:px-14 py-5 rounded-[2rem] flex items-center justify-center gap-4 transition-all active:scale-95 animate-bounce-subtle ${
                      settings.theme === UITheme.STARS
                        ? 'text-slate-100 border-2 border-white/25 border-t-white/50 shadow-[0_0_40px_rgba(226,232,240,0.3)]'
                        : 'text-amber-950 border-4 border-amber-300/50 shadow-[0_0_60px_rgba(251,191,36,0.6)]'
                    }`}
                    style={
                      settings.theme === UITheme.STARS
                        ? {
                            background: 'linear-gradient(135deg, #1c2236 0%, #0d101d 50%, #060810 100%)',
                          }
                        : {
                            background: 'linear-gradient(90deg, #fcd34d, #f59e0b, #fbbf24, #fcd34d)',
                            backgroundSize: '200% 200%',
                            animation: 'end-gradient 3s linear infinite',
                          }
                    }
                  >
                    <span className="tracking-[0.18em] uppercase">{t("Naar het Einde")}</span> <ArrowRight size={28} strokeWidth={3} className={settings.theme === UITheme.STARS ? "text-amber-200" : ""} />
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
        <SlideMenuModal
          isOpen={isCardOverviewOpen}
          onClose={() => setIsCardOverviewOpen(false)}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]"
          backdropClassName="p-4 bg-black/80 backdrop-blur-md"
        >
          {({ close }) => (
            <>
              <button
                onClick={close}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
              <div className="mb-6 pr-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <PlayingCardIcon size={22} className="text-red-500" />
                  {t("Kaarten in dit pakje")} ({busDecksUsed}/{settings.busDecks})
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {t("Overzicht van alle 52 kaarten in het huidige actieve pakje.")}
                </p>
              </div>
              <ScrollIndicatorContainer
                orientation="vertical"
                theme={settings.theme}
                className="flex-1 min-h-0"
                scrollClassName="pr-1 space-y-4 custom-scrollbar"
              >
                {/* Legend */}
                <div className="flex items-center gap-4 flex-wrap text-[10px] uppercase font-black tracking-wider border-b border-slate-800/60 pb-3 text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-4 bg-slate-800 border border-slate-700 rounded-sm"></div>
                    <span>{t("In pakje")}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-4 bg-amber-950/20 border border-amber-900/40 border-dashed rounded-sm"></div>
                    <span>{t("Layout (Dicht)")}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-4 bg-emerald-950/40 border border-emerald-500/50 rounded-sm"></div>
                    <span>{t("Layout (Open)")}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-4 bg-slate-950 border border-slate-900 opacity-45 rounded-sm line-through"></div>
                    <span>{t("Gedraaid")}</span>
                  </div>
                </div>
                {/* Cards Grid */}
                <div className="space-y-4">
                  {[Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES].map(suit => {
                    const isRed = suit === Suit.HEARTS || suit === Suit.DIAMONDS;
                    const suitSymbol = getSuitSymbol(suit);
                    const suitColor = isRed ? 'text-red-500' : 'text-slate-400';
                    
                    return (
                      <div key={suit} className="space-y-1.5">
                        <div className={`text-xs font-black uppercase tracking-widest ${suitColor} flex items-center gap-1`}>
                          <span>{suitSymbol}</span>
                          <span className="text-[10px] text-slate-500">{t(suit)}</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1.5">
                          {[Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE].map(rank => {
                            const card = currentPackCards.find(c => c.suit === suit && c.rank === rank);
                            const rankChar = getRankChar(rank);
                            
                            if (!card) return null;
                            
                            const isInLayout = busCards.some(bc => bc.id === card.id);
                            const isInDeck = busDeck.some(bd => bd.id === card.id);
                            const isDiscarded = !isInLayout && !isInDeck;
                            
                            let cardStyle = "bg-slate-800 border-slate-700 text-white";
                            
                            if (isDiscarded) {
                              cardStyle = "bg-slate-950/40 border-slate-900/50 text-slate-600 line-through opacity-45";
                            } else if (isInLayout) {
                              const layoutIdx = busCards.findIndex(bc => bc.id === card.id);
                              const isRevealed = layoutIdx < currentBusIndex || (busWrongCardIndex !== null && layoutIdx === busWrongCardIndex);
                              if (isRevealed) {
                                cardStyle = "bg-emerald-950/40 border-emerald-500/50 text-emerald-200";
                              } else {
                                cardStyle = "bg-amber-950/20 border-amber-900/40 border-dashed text-amber-500";
                              }
                            }
                            const displayColor = isDiscarded ? 'text-slate-600' : (isRed ? 'text-red-500' : 'text-slate-200');
                            
                            return (
                              <div 
                                key={rank}
                                className={`h-9 flex flex-col items-center justify-center rounded-lg border text-xs font-bold transition-all ${cardStyle}`}
                                title={`${t(rank)} ${t(suit)}`}
                              >
                                <span className={displayColor}>{rankChar}</span>
                                <span className={`text-[8px] leading-none ${isDiscarded ? 'text-slate-600' : suitColor}`}>{suitSymbol}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollIndicatorContainer>
              <button
                onClick={close}
                className="mt-6 w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl uppercase tracking-widest active:scale-95 transition-all shrink-0 shadow-lg shadow-red-900/30 border border-red-500/30 cursor-pointer"
              >
                {t("Sluiten")}
              </button>
            </>
          )}
        </SlideMenuModal>
      </RootContainer>
      </>
      );
      }
  // 7. GAME OVER
  if (phase === GamePhase.GAME_OVER) {
    return (
      <>
        <PersistentBackground theme={settings.theme} calmAccentColor={settings.calmAccentColor} />
        <BusTransitionOverlay loserReveal={loserReveal} isBusEntrance={isBusEntrance} busPassengers={busPassengers} t={t} theme={settings.theme} />
        <RootContainer className="p-0" theme={settings.theme}>
        <Confetti />
        <div className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="text-center mb-6 mt-6">
            {settings.theme === UITheme.STARS ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2 opacity-60">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/40" />
                  <span className="text-[#fef08a] text-xs">✦</span>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/40" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-semibold italic text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 uppercase tracking-[0.2em] drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {t("Uitslag")}
                </h1>
              </div>
            ) : (
              <h1 className="text-5xl font-black text-white uppercase tracking-tighter drop-shadow-xl">{t("Uitslag")}</h1>
            )}
            {immunePlayerId && (
              <div className={`p-3 inline-flex items-center gap-3 mt-4 ${
                settings.theme === UITheme.STARS 
                  ? 'bg-[#0a0d18]/90 border border-amber-300/40 rounded-2xl shadow-[0_0_20px_rgba(254,240,138,0.2)]'
                  : 'bg-yellow-500/20 border border-yellow-500/50 rounded-xl'
              }`}>
                <Shield size={20} className={settings.theme === UITheme.STARS ? "text-amber-200" : "text-yellow-400"} />
                <div>
                  <p className={`text-[10px] font-black uppercase leading-none tracking-widest mb-1 ${settings.theme === UITheme.STARS ? "text-amber-200/80 font-sans" : "text-yellow-400"}`}>{t("Bus Immuniteit")}</p>
                  <p className="text-white font-bold text-lg leading-none">{players.find(p => p.id === immunePlayerId)?.name}</p>
                </div>
              </div>
            )}
          </div>
          <div className={`${
            settings.theme === UITheme.STARS
              ? 'stars-chronometer-bar bg-[#060810]/95 backdrop-blur-2xl rounded-3xl border border-white/15 border-t-white/35 overflow-hidden mb-8 shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_25px_rgba(255,255,255,0.06)] relative'
              : 'bg-slate-900/80 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden mb-8 shadow-2xl'
          }`}>
            <div className={`grid grid-cols-12 p-4 text-[10px] font-bold uppercase tracking-[0.2em] ${
              settings.theme === UITheme.STARS ? 'bg-white/[0.03] text-slate-300 border-b border-white/10 font-sans' : 'bg-black/40 text-slate-400 font-black'
            }`}>
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-7">{t("Speler")}</div>
              <div className="col-span-4 text-right">{t("Slokken")}</div>
            </div>
            {sortedPlayers.map((p, i) => (
              <div key={p.id} className={`grid grid-cols-12 p-4 items-center border-b border-white/5 transition-colors ${
                p.id === immunePlayerId 
                  ? (settings.theme === UITheme.STARS ? 'bg-amber-400/10' : 'bg-yellow-500/10') 
                  : (settings.theme === UITheme.STARS ? 'hover:bg-white/[0.02]' : '')
              }`}>
                <div className={`col-span-1 text-center font-bold text-lg flex items-center justify-center gap-1 ${
                  i === 0 && settings.theme === UITheme.STARS ? 'text-amber-200 drop-shadow-[0_0_8px_rgba(254,240,138,0.7)]' : 'text-slate-400'
                }`}>
                  {i === 0 && settings.theme === UITheme.STARS ? '✦' : i + 1}
                </div>
                <div className="col-span-7 font-medium text-white text-base truncate flex items-center gap-3">
                  <PlayerAvatar player={p} size="sm" theme={settings.theme} />
                  <span style={{ fontFamily: settings.theme === UITheme.STARS ? "'Outfit', sans-serif" : undefined }}>{p.name}</span>
                  {p.id === immunePlayerId && <Shield size={14} className="text-yellow-400" />}
                </div>
                <div className={`col-span-4 text-right font-bold text-lg ${
                  settings.theme === UITheme.STARS ? 'text-slate-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]' : 'font-mono text-red-400 drop-shadow-md'
                }`}>
                  {p.drinksTaken}
                </div>
              </div>
            ))}
          </div>
          {settings.theme === UITheme.STARS ? (
            <button 
              onClick={handleGameOverContinue} 
              className="w-full py-4 pl-8 pr-3 rounded-full text-white font-medium text-base tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(255,255,255,0.1),inset_0_0_12px_rgba(226,232,240,0.06)] active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer border border-white/20 border-t-white/40"
              style={{
                background: 'linear-gradient(180deg, #181d2c 0%, #070911 100%)',
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              <span>{t("Terug naar Menu")}</span>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/15 transition-all border border-white/10">
                <ArrowRight size={18} className="text-white" />
              </div>
            </button>
          ) : (
            <button onClick={handleGameOverContinue} className="w-full bg-white text-black py-5 rounded-2xl font-black shadow-[0_0_30px_rgba(255,255,255,0.3)] text-lg uppercase tracking-widest hover:scale-105 transition-transform active:scale-95">
              {t("Terug naar Menu")}
            </button>
          )}
        </div>
      </RootContainer>
      {renderAdLoadingModal()}
      </>
    );
  }
  // This fallthrough renders when in results or other unhandled states
  return (
    <>
      <PersistentBackground theme={settings.theme} calmAccentColor={settings.calmAccentColor} />
      {renderSettingsModal()}
      {renderDevModeOrb()}
        {renderAdditionalModals()}
{renderQuitModal()}
{renderAdLoadingModal()}
{renderColorPickerModal()}
    </>
  );
};
export default App;
