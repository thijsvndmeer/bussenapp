import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { X } from 'lucide-react';
import PlayingCard from '../PlayingCard';
import { triggerHaptic } from '../../services/haptics';
import { CardStyle, UITheme } from '../../types';
import { PlayerAvatar } from '../../src/components/ui/PlayerAvatar';

export interface PyramidMatchModalProps {
  pendingMatches: {
    card: any;
    sips: number;
    matches: {
      player: any;
      count: number;
      initialCount: number;
    }[];
  } | null;
  players: any[];
  cardStyle?: CardStyle;
  isClosing?: boolean;
  onResolveMatch: (sourceId: string, targetId?: string) => void;
  onDismiss: () => void;
  t: (key: string) => string;
  getSipsText: (sips: number) => string;
  theme?: UITheme;
  calmAccentColor?: string;
}

export const PyramidMatchModal: React.FC<PyramidMatchModalProps> = ({
  pendingMatches,
  players,
  cardStyle,
  isClosing,
  onResolveMatch,
  onDismiss,
  t,
  getSipsText,
  theme = UITheme.CLASSIC,
  calmAccentColor,
}) => {
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [dragTilt, setDragTilt] = useState<number>(0);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const [selfHoldProgress, setSelfHoldProgress] = useState<number>(0);
  const [isSelfHoldComplete, setIsSelfHoldComplete] = useState<boolean>(false);

  const initialMatchesRef = useRef(pendingMatches?.matches ?? []);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevPositions = useRef<Map<string, DOMRect>>(new Map());

  const dragStartRef = useRef<{
    x: number;
    y: number;
    playerId: string;
    isDragging: boolean;
  } | null>(null);
  const animationFrameRef = useRef<number>();
  const selfHoldStartTimeRef = useRef<number | null>(null);
  const selfHoldAnimFrameRef = useRef<number | null>(null);
  const isSelfHoldCompleteRef = useRef<boolean>(false);
  const hoveredTargetIdRef = useRef<string | null>(null);
  const selfHoldHapticTicksRef = useRef<{ tick1: boolean; tick2: boolean }>({ tick1: false, tick2: false });
  const matchIdsKey = pendingMatches?.matches.map((m) => `${m.player.id}:${m.count}`).join(',') ?? '';

  const startSelfHold = () => {
    if (selfHoldAnimFrameRef.current) {
      cancelAnimationFrame(selfHoldAnimFrameRef.current);
    }
    selfHoldStartTimeRef.current = performance.now();
    isSelfHoldCompleteRef.current = false;
    setIsSelfHoldComplete(false);
    setSelfHoldProgress(0);
    selfHoldHapticTicksRef.current = { tick1: false, tick2: false };

    const step = (timestamp: number) => {
      if (!selfHoldStartTimeRef.current) return;
      const elapsed = timestamp - selfHoldStartTimeRef.current;
      const progress = Math.min(1, elapsed / 2000);
      setSelfHoldProgress(progress);

      if (progress >= 1) {
        isSelfHoldCompleteRef.current = true;
        setIsSelfHoldComplete(true);
        triggerHaptic('success');
        setTimeout(() => triggerHaptic('heavy'), 80);
        return;
      }

      selfHoldAnimFrameRef.current = requestAnimationFrame(step);
    };

    selfHoldAnimFrameRef.current = requestAnimationFrame(step);
  };

  const cancelSelfHold = () => {
    if (selfHoldAnimFrameRef.current) {
      cancelAnimationFrame(selfHoldAnimFrameRef.current);
      selfHoldAnimFrameRef.current = null;
    }
    selfHoldStartTimeRef.current = null;
    isSelfHoldCompleteRef.current = false;
    setIsSelfHoldComplete(false);
    setSelfHoldProgress(0);
    selfHoldHapticTicksRef.current = { tick1: false, tick2: false };
  };

  const snapshotPositions = () => {
    const map = new Map<string, DOMRect>();
    itemRefs.current.forEach((el, id) => {
      if (el) {
        map.set(id, el.getBoundingClientRect());
      }
    });
    prevPositions.current = map;
  };

  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (selfHoldAnimFrameRef.current) cancelAnimationFrame(selfHoldAnimFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (isClosing) {
      setTimeout(() => {
        onDismiss();
      }, 500);
    }
  }, [isClosing]);

  useEffect(() => {
    mountTimeRef.current = Date.now();
    cancelSelfHold();
    setDraggedPlayerId(null);
    setDragPos(null);
    setHoveredTargetId(null);
    hoveredTargetIdRef.current = null;
    initialMatchesRef.current = pendingMatches?.matches ?? [];
  }, [pendingMatches?.card?.id]);

  const safeDismiss = () => {
    if (Date.now() - mountTimeRef.current < 400) return;
    onDismiss();
  };

  useLayoutEffect(() => {
    itemRefs.current.forEach((el, id) => {
      const prevRect = prevPositions.current.get(id);
      if (prevRect && el) {
        const newRect = el.getBoundingClientRect();
        const deltaX = prevRect.left - newRect.left;

        if (Math.abs(deltaX) > 0.5) {
          el.getAnimations().forEach((a) => a.cancel());
          el.animate(
            [
              { transform: `translateX(${deltaX}px)` },
              { transform: 'translateX(0px)' },
            ],
            {
              duration: 320,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              fill: 'none',
            }
          );
        }
      }
    });

    snapshotPositions();
  }, [matchIdsKey]);

  if (!pendingMatches) return null;

  const handlePointerDown = (e: React.PointerEvent, playerId: string) => {
    e.stopPropagation();
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      playerId,
      isDragging: false,
    };

    let lastX = e.clientX;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!dragStartRef.current) return;

      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!dragStartRef.current.isDragging && dist > 8) {
        dragStartRef.current.isDragging = true;
        setDraggedPlayerId(playerId);
        triggerHaptic('light');
      }

      if (dragStartRef.current.isDragging) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        const currentX = moveEvent.clientX;
        const tilt = (currentX - lastX) * 1.5;
        lastX = currentX;

        animationFrameRef.current = requestAnimationFrame(() => {
          setDragPos({ x: moveEvent.clientX, y: moveEvent.clientY });
          setDragTilt(Math.max(-15, Math.min(15, tilt)));

          const elements = document.elementsFromPoint(moveEvent.clientX, moveEvent.clientY);
          const targetEl = elements.find((el) => el.getAttribute('data-target-player-id'));

          if (targetEl) {
            const targetId = targetEl.getAttribute('data-target-player-id');
            if (targetId) {
              hoveredTargetIdRef.current = targetId;
              setHoveredTargetId((prev) => {
                if (prev !== targetId && targetId !== playerId) triggerHaptic('tick');
                return targetId;
              });

              if (targetId === playerId) {
                if (!selfHoldStartTimeRef.current && !isSelfHoldCompleteRef.current) {
                  startSelfHold();
                }
              } else {
                if (selfHoldStartTimeRef.current || isSelfHoldCompleteRef.current) {
                  cancelSelfHold();
                }
              }
            } else {
              hoveredTargetIdRef.current = null;
              setHoveredTargetId(null);
              if (selfHoldStartTimeRef.current || isSelfHoldCompleteRef.current) {
                cancelSelfHold();
              }
            }
          } else {
            hoveredTargetIdRef.current = null;
            setHoveredTargetId(null);
            if (selfHoldStartTimeRef.current || isSelfHoldCompleteRef.current) {
              cancelSelfHold();
            }
          }
        });
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const isComplete = isSelfHoldCompleteRef.current;
      cancelSelfHold();

      const startInfo = dragStartRef.current;
      dragStartRef.current = null;

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      if (startInfo) {
        snapshotPositions();
        if (startInfo.isDragging) {
          const elements = document.elementsFromPoint(upEvent.clientX, upEvent.clientY);
          const targetEl = elements.find((el) => el.getAttribute('data-target-player-id'));
          const targetId = targetEl ? targetEl.getAttribute('data-target-player-id') : hoveredTargetIdRef.current;

          if (targetId) {
            if (targetId === playerId) {
              if (isComplete) {
                onResolveMatch(playerId, targetId);
              }
            } else {
              onResolveMatch(playerId, targetId);
            }
          }
        } else {
          onResolveMatch(playerId);
        }
      }

      setDraggedPlayerId(null);
      setDragPos(null);
      setDragTilt(0);
      setHoveredTargetId(null);
      hoveredTargetIdRef.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const initialMatches = initialMatchesRef.current.length > 0 ? initialMatchesRef.current : pendingMatches.matches;

  const isMetro = theme === UITheme.METRO;
  const isCalm = theme === UITheme.CALM;
  const isBeer = theme === UITheme.BEER;
  const isStars = theme === UITheme.STARS;
  const calmAccent = calmAccentColor || 'var(--theme-accent, #fb7185)';

  const getMatchersText = () => {
    const names = initialMatches.map((m) => m.player.name);
    if (names.length === 0) return '';
    if (names.length === 1) {
      return `${names[0]} ${t("heeft deze kaart")}`;
    }
    if (names.length === 2) {
      return `${names[0]} ${t("en")} ${names[1]} ${t("hebben deze kaart")}`;
    }
    return `${names.slice(0, -1).join(', ')} ${t("en")} ${names[names.length - 1]} ${t("hebben deze kaart")}`;
  };

  const potentialTargets = players.filter((p) => !p.isEliminated);
  const isDraggingActive = !!draggedPlayerId;
  const showTargets = isDraggingActive;
  const draggingPlayer = draggedPlayerId ? players.find((p) => p.id === draggedPlayerId) : null;

  const getBackdropClasses = () => {
    if (isMetro) return 'bg-black/85 backdrop-blur-none';
    if (isCalm) return 'bg-[#05070e]/75 backdrop-blur-md';
    if (isBeer) return 'bg-[#02180c]/80 backdrop-blur-md';
    if (isStars) return 'bg-[#020008]/85 backdrop-blur-md';
    return 'bg-black/60 backdrop-blur-sm';
  };

  const getTopPillClasses = () => {
    if (isMetro) return 'bg-[#0d0d0d] px-6 py-2 rounded-none border-2 border-[var(--theme-accent,#fb7185)] shadow-[4px_4px_0_rgba(0,0,0,0.9)]';
    if (isCalm) return 'bg-white/[0.06] backdrop-blur-xl px-6 py-2 rounded-full border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)]';
    if (isBeer) return 'bg-gradient-to-r from-amber-950/80 via-yellow-950/70 to-amber-950/80 backdrop-blur-md px-6 py-2 rounded-xl border-2 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.35)]';
    if (isStars) return 'bg-purple-950/40 backdrop-blur-xl px-6 py-2 rounded-full border border-purple-400/30 border-t-white/30 shadow-[0_0_25px_rgba(192,132,252,0.35)]';
    return 'bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-2xl';
  };

  const getTopPillTextClasses = () => {
    if (isMetro) return 'font-mono font-black text-lg tracking-wider uppercase text-[var(--theme-accent,#fb7185)]';
    if (isCalm) return 'font-black text-lg tracking-wider uppercase';
    if (isBeer) return 'font-black text-lg tracking-widest uppercase text-amber-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]';
    if (isStars) return 'font-black text-lg tracking-wider uppercase text-slate-100 drop-shadow-[0_0_10px_rgba(192,132,252,0.6)]';
    return 'font-black text-lg tracking-widest uppercase text-emerald-400';
  };

  const getTargetHintClasses = (isHovered: boolean) => {
    if (!isDraggingActive) return 'opacity-0 scale-90 pointer-events-none';
    if (!isHovered) return 'text-slate-400 opacity-70 scale-95';

    if (isMetro) return 'font-mono font-black text-sm scale-110 drop-shadow-[2px_2px_0_rgba(0,0,0,1)] uppercase text-[var(--theme-accent,#fb7185)] opacity-100';
    if (isCalm) return 'font-black text-sm scale-110 uppercase drop-shadow-[0_0_10px_var(--theme-accent-glow)] tracking-wider opacity-100';
    if (isBeer) return 'font-black text-sm scale-110 uppercase text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] tracking-wider opacity-100';
    if (isStars) return 'font-black text-sm scale-110 uppercase text-purple-200 drop-shadow-[0_0_12px_rgba(192,132,252,0.8)] tracking-wider opacity-100';
    return 'font-black text-sm scale-110 uppercase text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] tracking-wider opacity-100';
  };

  const getCardPreviewShadow = () => {
    if (isMetro) return 'drop-shadow-[4px_4px_0_rgba(0,0,0,0.9)] drop-shadow-[0_0_20px_rgba(251,113,133,0.25)]';
    if (isCalm) return 'drop-shadow-[0_0_35px_var(--theme-accent-glow,rgba(251,113,133,0.3))]';
    if (isBeer) return 'drop-shadow-[0_0_35px_rgba(245,158,11,0.45)]';
    if (isStars) return 'drop-shadow-[0_0_40px_rgba(192,132,252,0.45)]';
    return 'drop-shadow-[0_0_30px_rgba(52,211,153,0.3)]';
  };

  const getModalContainerClasses = () => {
    if (isMetro) {
      return 'bg-[#0d0d0d] w-full rounded-none border-2 border-[var(--theme-accent,#fb7185)] shadow-[6px_6px_0_rgba(0,0,0,1)] relative overflow-hidden font-mono';
    }
    if (isCalm) {
      return 'bg-[#0b0d19]/85 backdrop-blur-2xl w-full rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_30px_var(--theme-accent-glow,rgba(251,113,133,0.15))] relative overflow-hidden';
    }
    if (isBeer) {
      return 'bg-gradient-to-b from-[#032b12] to-[#011709] w-full rounded-2xl border-2 border-amber-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(245,158,11,0.2)] relative overflow-hidden';
    }
    if (isStars) {
      return 'bg-[rgba(7,3,18,0.88)] backdrop-blur-2xl w-full rounded-3xl border border-purple-400/20 border-t-[rgba(255,255,255,0.25)] shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.15),0_0_35px_rgba(192,132,252,0.18)] relative overflow-hidden';
    }
    return 'bg-gradient-to-b from-slate-800 to-slate-900 w-full rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden';
  };

  const getCloseButtonClasses = () => {
    if (isMetro) return 'rounded-none border-2 border-zinc-700 bg-[#18181b] hover:border-[var(--theme-accent,#fb7185)] text-zinc-300 hover:text-white transition-all';
    if (isCalm) return 'rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors';
    if (isBeer) return 'rounded-xl border border-amber-500/30 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 hover:text-amber-100 transition-colors';
    if (isStars) return 'rounded-full border border-purple-300/25 bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 hover:text-white shadow-[0_0_12px_rgba(192,132,252,0.2)] transition-colors';
    return 'rounded-full bg-black/30 hover:bg-black/50 text-slate-400 hover:text-white transition-colors';
  };

  const getHeaderDividerClasses = () => {
    if (isMetro) return 'border-b-2 border-zinc-800';
    if (isCalm) return 'border-b border-white/[0.07]';
    if (isBeer) return 'border-b border-amber-500/20';
    if (isStars) return 'border-b border-purple-400/15';
    return 'border-b border-white/5';
  };

  const renderTitle = () => {
    if (isMetro) {
      return (
        <h2 className="text-3xl sm:text-4xl font-mono font-black uppercase tracking-tight text-[var(--theme-accent,#fb7185)] drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
          <span className="opacity-40 mr-2">&gt;&gt;</span>
          {t("MATCH!")}
        </h2>
      );
    }
    if (isCalm) {
      return (
        <h2
          className="text-3xl sm:text-4xl font-black uppercase tracking-tight drop-shadow-md"
          style={{
            color: calmAccent,
            textShadow: '0 0 15px var(--theme-accent-glow, rgba(251,113,133,0.3))',
          }}
        >
          {t("MATCH!")}
        </h2>
      );
    }
    if (isBeer) {
      return (
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 drop-shadow-[0_2px_10px_rgba(245,158,11,0.6)]">
          🍻 {t("MATCH!")}
        </h2>
      );
    }
    if (isStars) {
      return (
        <h2
          className="text-3xl sm:text-4xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-purple-100 to-purple-300 drop-shadow-[0_0_20px_rgba(192,132,252,0.6)]"
        >
          ✨ {t("MATCH!")}
        </h2>
      );
    }
    return (
      <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-teal-400 drop-shadow-md tracking-tight uppercase">
        {t("MATCH!")}
      </h2>
    );
  };

  const getSubtitleClasses = () => {
    if (isMetro) return 'text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mt-1 px-4 leading-relaxed';
    if (isCalm) return 'text-[11px] font-bold text-slate-300/80 uppercase tracking-wider mt-1 px-4 leading-relaxed';
    if (isBeer) return 'text-[11px] font-bold text-amber-200/80 uppercase tracking-wider mt-1 px-4 leading-relaxed';
    if (isStars) return 'text-[11px] font-bold text-purple-200/70 tracking-wider uppercase mt-1 px-4 leading-relaxed';
    return 'text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 px-4 leading-relaxed';
  };

  const getInstructionClasses = () => {
    if (isMetro) return 'text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500';
    if (isCalm) return 'text-[10px] font-bold uppercase tracking-wider text-slate-400';
    if (isBeer) return 'text-[10px] font-bold uppercase tracking-wider text-amber-300/60';
    if (isStars) return 'text-[10px] font-bold uppercase tracking-wider text-purple-300/60';
    return 'text-[10px] font-bold uppercase tracking-wider text-slate-500';
  };

  const getMatcherAvatarFrameClasses = () => {
    if (isMetro) return 'rounded-full border-2 border-zinc-700 group-hover:border-[var(--theme-accent,#fb7185)] group-hover:shadow-[3px_3px_0_rgba(0,0,0,0.9)]';
    if (isCalm) return 'rounded-full border-2 border-white/15 group-hover:border-[var(--theme-accent,#fb7185)] group-hover:shadow-[0_0_20px_var(--theme-accent-glow,rgba(251,113,133,0.3))]';
    if (isBeer) return 'rounded-full border-2 border-amber-500/30 group-hover:border-amber-400 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]';
    if (isStars) return 'rounded-full border-2 border-purple-400/25 group-hover:border-purple-300 group-hover:shadow-[0_0_25px_rgba(192,132,252,0.6)]';
    return 'rounded-full border-2 border-white/20 group-hover:border-emerald-400/60 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]';
  };

  const getMultiplierBadgeClasses = () => {
    if (isMetro) return 'rounded-none border border-black bg-[var(--theme-accent,#fb7185)] text-slate-950 font-mono font-black text-[10px] px-1.5 py-0.5 shadow-[2px_2px_0_rgba(0,0,0,0.9)]';
    if (isCalm) return 'rounded-full border border-white/20 bg-[var(--theme-accent,#fb7185)] text-[var(--theme-btn-text,#ffffff)] font-black text-[10px] px-1.5 py-0.5 shadow-md';
    if (isBeer) return 'rounded-lg border border-amber-300/50 bg-gradient-to-br from-amber-400 to-yellow-500 text-stone-950 font-black text-[10px] px-1.5 py-0.5 shadow-md';
    if (isStars) return 'rounded-full border border-purple-300/40 bg-gradient-to-r from-purple-200 to-slate-100 text-slate-950 font-black text-[10px] px-1.5 py-0.5 shadow-[0_0_10px_rgba(192,132,252,0.4)]';
    return 'bg-gradient-to-br from-amber-400 to-orange-500 text-black font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-lg';
  };

  const getPlayerNameClasses = () => {
    if (isMetro) return 'font-mono font-bold text-xs sm:text-sm text-zinc-100 truncate max-w-[76px] sm:max-w-[90px] text-center leading-tight pointer-events-none';
    if (isCalm) return 'font-bold text-xs sm:text-sm text-slate-200 truncate max-w-[76px] sm:max-w-[90px] text-center leading-tight pointer-events-none';
    if (isBeer) return 'font-black text-xs sm:text-sm text-amber-100 tracking-tight truncate max-w-[76px] sm:max-w-[90px] text-center leading-tight pointer-events-none';
    if (isStars) return 'font-bold text-xs sm:text-sm text-purple-100 truncate max-w-[76px] sm:max-w-[90px] text-center leading-tight pointer-events-none';
    return 'font-bold text-xs sm:text-sm text-white truncate max-w-[76px] sm:max-w-[90px] text-center leading-tight pointer-events-none';
  };

  const getVictimsTitleClasses = () => {
    if (isMetro) return 'text-center font-mono font-black uppercase tracking-widest mb-3 text-[var(--theme-accent,#fb7185)] text-xs transition-colors';
    if (isCalm) return 'text-center font-black uppercase tracking-widest mb-3 text-xs transition-colors';
    if (isBeer) return 'text-center font-black uppercase tracking-widest mb-3 text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-xs transition-colors';
    if (isStars) return 'text-center font-black uppercase tracking-widest mb-3 text-purple-200 drop-shadow-[0_0_10px_rgba(192,132,252,0.5)] text-xs transition-colors';
    return 'text-center font-bold uppercase tracking-widest mb-3 text-emerald-400 text-xs transition-colors';
  };

  const getTargetAvatarFrameClasses = (isHovered: boolean, isSource: boolean) => {
    const shape = 'rounded-full';

    if (isHovered) {
      if (isMetro) return `${shape} ring-4 ring-[var(--theme-accent,#fb7185)] shadow-[4px_4px_0_rgba(0,0,0,1)] grayscale-0 opacity-100`;
      if (isCalm) return `${shape} ring-4 ring-[var(--theme-accent,#fb7185)]/60 shadow-[0_10px_25px_var(--theme-accent-glow,rgba(251,113,133,0.3))] grayscale-0 opacity-100`;
      if (isBeer) return `${shape} ring-4 ring-amber-400/80 shadow-[0_10px_25px_rgba(245,158,11,0.7)] grayscale-0 opacity-100`;
      if (isStars) return `${shape} ring-4 ring-purple-400/70 shadow-[0_10px_25px_rgba(192,132,252,0.8)] grayscale-0 opacity-100`;
      return `${shape} ring-4 ring-emerald-400/50 shadow-[0_10px_25px_rgba(52,211,153,0.6)] grayscale-0 opacity-100`;
    }

    if (isSource) {
      if (isMetro) return `${shape} border-2 border-zinc-800`;
      if (isBeer) return `${shape} border-2 border-amber-950/60`;
      if (isStars) return `${shape} border-2 border-purple-950/40`;
      return `${shape} border-2 border-white/10`;
    }

    if (isMetro) return `${shape} border-2 border-zinc-700`;
    if (isBeer) return `${shape} border-2 border-amber-900/50`;
    if (isStars) return `${shape} border-2 border-purple-900/40`;
    return `${shape} border-2 border-white/20`;
  };

  const getTargetNameClasses = (isHovered: boolean) => {
    if (isHovered) {
      if (isMetro) return 'text-[var(--theme-accent,#fb7185)] font-mono font-bold drop-shadow-[1px_1px_0_rgba(0,0,0,1)]';
      if (isCalm) return 'font-bold drop-shadow';
      if (isBeer) return 'text-amber-300 font-bold drop-shadow';
      if (isStars) return 'text-purple-200 font-bold drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]';
      return 'text-emerald-300 font-bold drop-shadow';
    }
    if (isMetro) return 'text-zinc-400 font-mono font-semibold';
    if (isCalm) return 'text-slate-300 font-semibold';
    if (isBeer) return 'text-amber-200/70 font-semibold';
    if (isStars) return 'text-purple-300/70 font-semibold';
    return 'text-slate-300 font-semibold';
  };

  const getDragPointerClasses = (isHovered: boolean) => {
    const shape = 'rounded-full';
    if (isHovered) {
      if (isMetro) return `${shape} border-2 border-black bg-[var(--theme-accent,#fb7185)] shadow-[2px_2px_0_rgba(0,0,0,1)] scale-125`;
      if (isCalm) return `${shape} border-2 border-white bg-[var(--theme-accent,#fb7185)] shadow-[0_0_12px_var(--theme-accent-glow,rgba(251,113,133,0.3))] scale-125`;
      if (isBeer) return `${shape} border-2 border-amber-300 bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.9)] scale-125`;
      if (isStars) return `${shape} border-2 border-white bg-purple-400 shadow-[0_0_14px_rgba(192,132,252,0.9)] scale-125`;
      return `${shape} border-2 border-emerald-400 bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.8)] scale-125`;
    }
    if (isMetro) return `${shape} border-2 border-zinc-600 bg-zinc-900 shadow-md`;
    return `${shape} border-2 border-white bg-slate-800 shadow-md`;
  };

  const getDragAvatarRingClasses = (isHovered: boolean) => {
    const shape = 'rounded-full';
    if (isHovered) {
      if (isMetro) return `${shape} scale-110 border-4 border-[var(--theme-accent,#fb7185)] shadow-[4px_4px_0_rgba(0,0,0,1)]`;
      if (isCalm) return `${shape} scale-110 border-4 border-[var(--theme-accent,#fb7185)] shadow-[0_0_25px_var(--theme-accent-glow,rgba(251,113,133,0.3))]`;
      if (isBeer) return `${shape} scale-110 border-4 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.8)]`;
      if (isStars) return `${shape} scale-110 border-4 border-purple-300 shadow-[0_0_35px_rgba(192,132,252,0.85)]`;
      return `${shape} scale-110 border-4 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.8)]`;
    }
    if (isMetro) return `${shape} border-2 border-zinc-400`;
    if (isBeer) return `${shape} border-2 border-amber-500/40`;
    if (isStars) return `${shape} border-2 border-purple-400/40`;
    return `${shape} border-2 border-white`;
  };

  const getDragSipsPillClasses = () => {
    if (isMetro) return 'bg-[#0d0d0d] border-2 border-[var(--theme-accent,#fb7185)] rounded-none px-3 py-0.5 text-[10px] font-mono font-black text-[var(--theme-accent,#fb7185)] shadow-[3px_3px_0_rgba(0,0,0,0.9)] whitespace-nowrap';
    if (isCalm) return 'bg-[#0b0d19]/95 border border-[var(--theme-accent,#fb7185)]/50 rounded-full px-3 py-0.5 text-[10px] font-black tracking-wide shadow-xl whitespace-nowrap';
    if (isBeer) return 'bg-stone-950/95 border border-amber-500/60 rounded-xl px-3 py-0.5 text-[10px] font-black text-amber-300 shadow-xl whitespace-nowrap';
    if (isStars) return 'bg-purple-950/90 border border-purple-400/40 rounded-full px-3 py-0.5 text-[10px] font-black tracking-wide text-purple-200 shadow-[0_0_15px_rgba(192,132,252,0.3)] whitespace-nowrap';
    return 'bg-slate-900/90 border border-emerald-400/50 rounded-full px-3 py-0.5 text-[10px] font-black text-emerald-300 shadow-xl whitespace-nowrap';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => {
          if (!isDraggingActive) safeDismiss();
        }}
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${getBackdropClasses()} ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <div
        onClick={(e) => {
          if (e.target === e.currentTarget && !isDraggingActive) {
            safeDismiss();
          }
        }}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 ${
          isClosing ? 'animate-slide-left-exit pointer-events-none' : 'animate-slide-left-enter'
        }`}
      >
        <div className="mb-4 drop-shadow-xl flex flex-col items-center">
          <div className={getTopPillClasses()}>
            <span
              className={getTopPillTextClasses()}
              style={
                isCalm
                  ? { color: calmAccent }
                  : undefined
              }
            >
              {isMetro ? '>> ' : isStars ? '✦ ' : ''}
              {getSipsText(pendingMatches.sips)} {t("uitdelen")}
              {isStars ? ' ✦' : ''}
            </span>
          </div>
          <div className="mt-2 min-h-7 flex flex-col items-center justify-center">
            <span
              className={`transition-all duration-300 ${getTargetHintClasses(
                hoveredTargetId ? (!draggedPlayerId || hoveredTargetId !== draggedPlayerId || isSelfHoldComplete) : false
              )}`}
              style={
                hoveredTargetId && (!draggedPlayerId || hoveredTargetId !== draggedPlayerId || isSelfHoldComplete) && isCalm
                  ? { color: calmAccent }
                  : undefined
              }
            >
              {hoveredTargetId ? (
                isDraggingActive && draggedPlayerId && hoveredTargetId === draggedPlayerId ? (
                  isSelfHoldComplete ? (
                    <>
                      {t("aan")}{' '}
                      <span
                        className="text-transparent bg-clip-text font-black drop-shadow-[0_0_12px_rgba(244,114,182,0.8)]"
                        style={{
                          backgroundImage:
                            'linear-gradient(90deg, #f472b6, #7c3aed, #22d3ee, #f97316, #f472b6, #7c3aed, #22d3ee, #f97316, #f472b6)',
                          backgroundSize: '200% 100%',
                          animation: 'disco-gradient 2s linear infinite',
                        }}
                      >
                        {t("jezelf")}
                      </span>
                      ?
                    </>
                  ) : (
                    `${t("aan")}?`
                  )
                ) : (
                  `${t("aan")} ${potentialTargets.find((p) => p.id === hoveredTargetId)?.name}?`
                )
              ) : (
                `${t("aan")}?`
              )}
            </span>
            {isDraggingActive && !!draggedPlayerId && !!hoveredTargetId && hoveredTargetId === draggedPlayerId && !isSelfHoldComplete && (
              <div className="w-28 h-1 bg-white/15 rounded-full overflow-hidden mt-1 pointer-events-none">
                <div
                  className="h-full transition-all duration-75 ease-linear rounded-full"
                  style={{
                    width: `${selfHoldProgress * 100}%`,
                    backgroundColor: isMetro
                      ? 'var(--theme-accent, #fb7185)'
                      : isCalm
                      ? calmAccent
                      : isBeer
                      ? '#f59e0b'
                      : isStars
                      ? '#c084fc'
                      : '#34d399',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div
          className={`mb-6 pointer-events-none ${getCardPreviewShadow()}`}
          style={{
            transform: dragPos
              ? `rotateX(${(dragPos.y - window.innerHeight / 2) * 0.02}deg) rotateY(${(dragPos.x - window.innerWidth / 2) * 0.02}deg)`
              : 'none',
            transition: dragPos ? 'none' : 'transform 0.5s ease-out',
          }}
        >
          <PlayingCard card={pendingMatches.card} size="md" style={cardStyle} />
        </div>

        <div
          className={getModalContainerClasses()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full">
            <button
              onClick={onDismiss}
              className={`absolute top-4 right-4 p-2 z-10 cursor-pointer ${getCloseButtonClasses()}`}
            >
              <X size={16} />
            </button>

            <div className={`pt-6 pb-4 px-6 text-center ${getHeaderDividerClasses()}`}>
              {renderTitle()}
              <p className={getSubtitleClasses()}>
                {getMatchersText()}
              </p>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className={getInstructionClasses()}>
                  {t("Sleep of tik om uit te delen")}
                </span>
              </div>

              <div className="flex flex-nowrap justify-center items-center gap-3 sm:gap-4 relative w-full py-1 overflow-hidden">
                {pendingMatches.matches.map((m) => {
                  const isThisDragged = draggedPlayerId === m.player.id;

                  return (
                    <div
                      key={m.player.id}
                      ref={(el) => {
                        if (el) {
                          itemRefs.current.set(m.player.id, el);
                        } else {
                          itemRefs.current.delete(m.player.id);
                        }
                      }}
                      onPointerDown={(e) => handlePointerDown(e, m.player.id)}
                      className={`group relative flex flex-col items-center gap-1.5 p-1 rounded-2xl select-none touch-none cursor-grab active:cursor-grabbing shrink-0 min-w-[64px] sm:min-w-[76px] ${
                        isThisDragged ? 'opacity-20 scale-95' : ''
                      }`}
                    >
                      <div className="relative">
                        <div
                          className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-105 group-active:scale-95 transition-all pointer-events-none ${getMatcherAvatarFrameClasses()}`}
                        >
                          <PlayerAvatar
                            player={m.player}
                            size="custom"
                            theme={theme}
                            className="w-full h-full text-xl sm:text-2xl"
                          />
                        </div>

                        {m.count > 1 && (
                          <div
                            className={`absolute -top-1 -right-1 pointer-events-none z-10 ${getMultiplierBadgeClasses()}`}
                          >
                            {m.count}x
                          </div>
                        )}
                      </div>

                      <span className={getPlayerNameClasses()}>
                        {m.player.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Victims Dock */}
        <div
          onClick={() => {
            if (!showTargets && !isDraggingActive) {
              safeDismiss();
            }
          }}
          className="w-full min-h-[160px] mt-4 flex items-start justify-center relative"
        >
          {showTargets && (
            <div className="w-full animate-slide-in-bottom" onClick={(e) => e.stopPropagation()}>
              <h3
                className={getVictimsTitleClasses()}
                style={
                  isCalm
                    ? { color: calmAccent }
                    : undefined
                }
              >
                {isMetro ? '>> ' : isStars ? '✦ ' : ''}
                {t("Slachtoffers")}
                {isStars ? ' ✦' : ''}
              </h3>

              <div className="flex flex-wrap justify-center gap-2 px-2 w-full max-w-sm">
                {potentialTargets.map((p) => {
                  const isHovered = hoveredTargetId === p.id;
                  const isSource = draggedPlayerId === p.id;
                  const isEffectivelyHovered = isHovered && (!isSource || isSelfHoldComplete);

                  const targetCount = potentialTargets.length;
                  let sizeClass = 'w-12 h-12 text-base';
                  let textClass = 'text-[9px] max-w-[48px]';

                  if (targetCount <= 2) {
                    sizeClass = 'w-20 h-20 text-3xl';
                    textClass = 'text-sm max-w-[80px]';
                  } else if (targetCount <= 4) {
                    sizeClass = 'w-16 h-16 text-xl';
                    textClass = 'text-xs max-w-[64px]';
                  } else if (targetCount <= 8) {
                    sizeClass = 'w-14 h-14 text-lg';
                    textClass = 'text-[10px] max-w-[56px]';
                  }

                  return (
                    <div
                      key={p.id}
                      data-target-player-id={p.id}
                      className={`flex flex-col items-center gap-1.5 shrink-0 transition-all duration-200 cursor-pointer relative ${
                        isEffectivelyHovered
                          ? 'scale-125 -translate-y-2 z-10'
                          : isSource
                          ? 'scale-100 opacity-50 grayscale'
                          : 'scale-100 opacity-90'
                      }`}
                    >
                      <div
                        className={`${sizeClass} relative flex items-center justify-center overflow-visible shadow-lg transition-all pointer-events-none ${getTargetAvatarFrameClasses(
                          isEffectivelyHovered,
                          isSource
                        )}`}
                      >
                        <PlayerAvatar
                          player={p}
                          size="custom"
                          theme={theme}
                          className={`w-full h-full ${!isEffectivelyHovered && isSource ? 'grayscale' : ''}`}
                        />
                      </div>
                      <span
                        className={`${textClass} truncate pointer-events-none transition-colors ${getTargetNameClasses(
                          isEffectivelyHovered
                        )}`}
                        style={
                          isEffectivelyHovered && isCalm
                            ? { color: calmAccent }
                            : undefined
                        }
                      >
                        {p.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Drag Avatar Ghost */}
      {isDraggingActive && dragPos && draggingPlayer && (
        <div
          className="fixed z-[999] pointer-events-none flex flex-col items-center"
          style={{
            left: dragPos.x,
            top: dragPos.y,
            transform: `translate(-50%, -6px) rotate(${dragTilt}deg)`,
          }}
        >
          <div className="flex flex-col items-center z-20 mb-4">
            <div
              className={`w-3 h-3 transition-all ${getDragPointerClasses(
                !!hoveredTargetId && (hoveredTargetId !== draggedPlayerId || isSelfHoldComplete)
              )}`}
            />
          </div>

          <div className="flex flex-col items-center gap-2 -mt-1 relative">
            <div className="relative">
              <div
                className={`w-16 h-16 flex items-center justify-center overflow-hidden transition-all shadow-[0_15px_30px_rgba(0,0,0,0.5)] ${getDragAvatarRingClasses(
                  !!hoveredTargetId && (hoveredTargetId !== draggedPlayerId || isSelfHoldComplete)
                )}`}
              >
                <PlayerAvatar
                  player={draggingPlayer}
                  size="custom"
                  theme={theme}
                  className="w-full h-full text-xl"
                />
              </div>

              {(() => {
                const match = pendingMatches.matches.find((m) => m.player.id === draggedPlayerId);
                if (match && match.count > 1) {
                  return (
                    <div
                      className={`absolute -top-1 -right-1 pointer-events-none z-10 ${getMultiplierBadgeClasses()}`}
                    >
                      {match.count}x
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div
              className={getDragSipsPillClasses()}
              style={
                isCalm
                  ? { color: calmAccent }
                  : undefined
              }
            >
              {getSipsText(pendingMatches.sips)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PyramidMatchModal;
