import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { X } from 'lucide-react';
import PlayingCard from '../PlayingCard';
import { triggerHaptic } from '../../services/haptics';

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
  cardStyle: any;
  isClosing?: boolean;
  onResolveMatch: (sourceId: string, targetId?: string) => void;
  onDismiss: () => void;
  t: (key: string) => string;
  getSipsText: (sips: number) => string;
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
}) => {
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [dragTilt, setDragTilt] = useState<number>(0);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);

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
  const matchIdsKey = pendingMatches?.matches.map((m) => `${m.player.id}:${m.count}`).join(',') ?? '';

  const snapshotPositions = () => {
    const map = new Map<string, DOMRect>();
    itemRefs.current.forEach((el, id) => {
      if (el) {
        map.set(id, el.getBoundingClientRect());
      }
    });
    prevPositions.current = map;
  };

  useEffect(() => {
    if (isClosing) {
      setTimeout(() => {
        onDismiss();
      }, 500);
    }
  }, [isClosing]);

  useEffect(() => {
    setDraggedPlayerId(null);
    setDragPos(null);
    setHoveredTargetId(null);
    initialMatchesRef.current = pendingMatches?.matches ?? [];
  }, [pendingMatches?.card?.id]);

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
              setHoveredTargetId((prev) => {
                if (prev !== targetId) triggerHaptic('tick');
                return targetId;
              });
            } else {
              setHoveredTargetId(null);
            }
          } else {
            setHoveredTargetId(null);
          }
        });
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

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

          if (targetEl) {
            const targetId = targetEl.getAttribute('data-target-player-id');
            if (targetId) {
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
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const initialMatches = initialMatchesRef.current.length > 0 ? initialMatchesRef.current : pendingMatches.matches;

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

  const localCardStyle = {
    ...cardStyle,
    transform: dragPos
      ? `rotateX(${(dragPos.y - window.innerHeight / 2) * 0.02}deg) rotateY(${(dragPos.x - window.innerWidth / 2) * 0.02}deg)`
      : 'none',
    transition: dragPos ? 'none' : 'transform 0.5s ease-out',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => {
          if (!isDraggingActive) onDismiss();
        }}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <div
        onClick={(e) => {
          if (e.target === e.currentTarget && !isDraggingActive) {
            onDismiss();
          }
        }}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 ${
          isClosing ? 'animate-slide-left-exit pointer-events-none' : 'animate-slide-left-enter'
        }`}
      >
        <div className="mb-4 drop-shadow-xl flex flex-col items-center">
          <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-2xl">
            <span className="text-emerald-400 font-black text-lg tracking-widest uppercase">
              {getSipsText(pendingMatches.sips)} {t("uitdelen")}
            </span>
          </div>
          <div className="mt-2 h-6 flex items-center justify-center">
            <span
              className={`text-sm font-black uppercase tracking-wider transition-all duration-300 ${
                isDraggingActive
                  ? hoveredTargetId
                    ? 'text-emerald-300 scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] opacity-100'
                    : 'text-slate-400 opacity-70 scale-95'
                  : 'opacity-0 scale-90 pointer-events-none'
              }`}
            >
              {hoveredTargetId
                ? `${t("aan")} ${potentialTargets.find((p) => p.id === hoveredTargetId)?.name}?`
                : `${t("aan")}?`}
            </span>
          </div>
        </div>

        <div className="mb-6 pointer-events-none drop-shadow-[0_0_30px_rgba(52,211,153,0.3)]">
          <PlayingCard card={pendingMatches.card} size="md" style={localCardStyle} />
        </div>

        <div
          className="bg-gradient-to-b from-slate-800 to-slate-900 w-full rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full">
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full text-slate-400 hover:text-white transition-colors z-10"
            >
              <X size={16} />
            </button>

            <div className="pt-6 pb-4 px-6 text-center border-b border-white/5">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-teal-400 drop-shadow-md">
                {t("MATCH!")}
              </h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 px-4 leading-relaxed">
                {getMatchersText()}
              </p>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white/20 bg-slate-800 flex items-center justify-center font-black text-white text-xl sm:text-2xl overflow-hidden shadow-lg group-hover:border-emerald-400/60 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] group-hover:scale-105 group-active:scale-95 transition-all pointer-events-none">
                          {m.player.image ? (
                            <img src={m.player.image} className="w-full h-full object-cover pointer-events-none" />
                          ) : (
                            m.player.name.charAt(0)
                          )}
                        </div>

                        {m.count > 1 && (
                          <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-orange-500 text-black font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-lg pointer-events-none z-10">
                            {m.count}x
                          </div>
                        )}
                      </div>

                      <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[76px] sm:max-w-[90px] text-center leading-tight pointer-events-none">
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
              onDismiss();
            }
          }}
          className="w-full min-h-[160px] mt-4 flex items-start justify-center relative"
        >
          {showTargets && (
            <div className="w-full animate-slide-in-bottom" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-center font-bold uppercase tracking-widest mb-3 text-emerald-400 text-xs transition-colors">
                {t("Slachtoffers")}
              </h3>

              <div className="flex flex-wrap justify-center gap-2 px-2 w-full max-w-sm">
                {potentialTargets.map((p) => {
                  const isHovered = hoveredTargetId === p.id;
                  const isSource = draggedPlayerId === p.id;

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
                      className={`flex flex-col items-center gap-1.5 shrink-0 transition-all duration-200 cursor-pointer ${
                        isHovered
                          ? 'scale-125 -translate-y-2 z-10'
                          : isSource
                          ? 'scale-100 opacity-50 grayscale'
                          : 'scale-100 opacity-90'
                      }`}
                    >
                      <div
                        className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white overflow-hidden shadow-lg transition-all pointer-events-none ${
                          isHovered
                            ? 'bg-emerald-500 ring-4 ring-emerald-400/50 shadow-[0_10px_25px_rgba(52,211,153,0.6)] grayscale-0 opacity-100'
                            : isSource
                            ? 'bg-slate-800 border-2 border-white/10'
                            : 'bg-slate-800 border-2 border-white/20'
                        }`}
                      >
                        {p.image ? (
                          <img src={p.image} className="w-full h-full object-cover pointer-events-none" />
                        ) : (
                          p.name.charAt(0)
                        )}
                      </div>
                      <span
                        className={`${textClass} truncate pointer-events-none transition-colors ${
                          isHovered ? 'text-emerald-300 font-bold drop-shadow' : 'text-slate-300 font-semibold'
                        }`}
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
              className={`w-3 h-3 rounded-full transition-all ${
                hoveredTargetId
                  ? 'border-2 border-emerald-400 bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.8)] scale-125'
                  : 'border-2 border-white bg-slate-800 shadow-md'
              }`}
            />
          </div>

          <div className="flex flex-col items-center gap-2 -mt-1">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-white text-xl overflow-hidden transition-all shadow-[0_15px_30px_rgba(0,0,0,0.5)] ${
                hoveredTargetId
                  ? 'scale-110 border-4 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.8)]'
                  : 'border-2 border-white'
              }`}
            >
              {draggingPlayer.image ? (
                <img src={draggingPlayer.image} className="w-full h-full object-cover bg-slate-800" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  {draggingPlayer.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="bg-slate-900/90 border border-emerald-400/50 rounded-full px-3 py-0.5 text-[10px] font-black text-emerald-300 shadow-xl whitespace-nowrap">
              {getSipsText(pendingMatches.sips)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PyramidMatchModal;
