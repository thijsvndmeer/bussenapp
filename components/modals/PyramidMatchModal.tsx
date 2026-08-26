import React, { useState, useEffect, useRef } from 'react';
import { Target, X, ArrowRight } from 'lucide-react';
import PlayingCard from '../PlayingCard';

export const PyramidMatchModal: React.FC<{
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
}> = ({ pendingMatches, players, cardStyle, isClosing, onResolveMatch, onDismiss, t, getSipsText }) => {
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [dragTilt, setDragTilt] = useState(0);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const [selectedMatcherId, setSelectedMatcherId] = useState<string | null>(null);
  
  const dragStartRef = useRef<{ x: number; y: number; playerId: string; isDragging: boolean } | null>(null);
  const animationFrameRef = useRef<number>();

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
    setSelectedMatcherId(null);
  }, [pendingMatches?.card.id]);

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
      
      if (!dragStartRef.current.isDragging && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        dragStartRef.current.isDragging = true;
        setDraggedPlayerId(playerId);
        triggerHaptic('selection');
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
          const targetEl = elements.find(el => el.getAttribute('data-target-player-id'));
          
          if (targetEl) {
            const targetId = targetEl.getAttribute('data-target-player-id');
            if (targetId && targetId !== playerId) {
              setHoveredTargetId(prev => {
                if (prev !== targetId) triggerHaptic('selection');
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
      if (dragStartRef.current?.isDragging) {
        const elements = document.elementsFromPoint(upEvent.clientX, upEvent.clientY);
        const targetEl = elements.find(el => el.getAttribute('data-target-player-id'));
        
        if (targetEl) {
          const targetId = targetEl.getAttribute('data-target-player-id');
          if (targetId && targetId !== playerId) {
            onResolveMatch(playerId, targetId);
          }
        }
      } else {
        if (selectedMatcherId === playerId) {
          setSelectedMatcherId(null);
        } else {
          setSelectedMatcherId(playerId);
          triggerHaptic('selection');
        }
      }
      
      setDraggedPlayerId(null);
      setDragPos(null);
      setDragTilt(0);
      setHoveredTargetId(null);
      dragStartRef.current = null;
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const handleTargetClick = (targetId: string) => {
    if (selectedMatcherId) {
      onResolveMatch(selectedMatcherId, targetId);
    } else if (pendingMatches.matches.length === 1) {
      onResolveMatch(pendingMatches.matches[0].player.id, targetId);
    }
  };

  const getMatchersText = () => {
    if (pendingMatches.matches.length === 1) {
      return pendingMatches.matches[0].player.name;
    }
    return `${pendingMatches.matches.length} ${t("SPELERS")}`;
  };

  const triggerHaptic = (style: 'success' | 'selection' | 'tick') => {
    const win = window as any;
    if (win.Telegram?.WebApp?.HapticFeedback) {
      if (style === 'success') {
        win.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      } else if (style === 'selection') {
        win.Telegram.WebApp.HapticFeedback.selectionChanged();
      } else if (style === 'tick') {
        win.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    }
  };

  const potentialTargets = players.filter(p => !p.isEliminated);
  const isDraggingActive = !!draggedPlayerId;
  const showTargets = isDraggingActive;
  const draggingPlayer = draggedPlayerId ? players.find(p => p.id === draggedPlayerId) : null;

  const localCardStyle = {
    ...cardStyle,
    transform: dragPos 
      ? `rotateX(${(dragPos.y - window.innerHeight/2) * 0.02}deg) rotateY(${(dragPos.x - window.innerWidth/2) * 0.02}deg)`
      : 'none',
    transition: dragPos ? 'none' : 'transform 0.5s ease-out'
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <div className={`fixed top-[15%] left-0 w-full z-[60] flex justify-center pointer-events-none transition-all duration-300 ${
        isClosing ? 'opacity-0 -translate-y-4' : 'opacity-100'
      }`}>
        <div className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-6 py-2 rounded-full font-black text-xl shadow-[0_0_30px_rgba(52,211,153,0.2)] backdrop-blur-md">
          {getSipsText(pendingMatches.sips)} {t("uitdelen")}
        </div>
      </div>

      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 ${
        isClosing ? 'animate-slide-left-exit pointer-events-none' : 'animate-slide-left-enter'
      }`}>
        
        <div className="mb-6 pointer-events-none drop-shadow-[0_0_30px_rgba(52,211,153,0.3)]">
          <PlayingCard card={pendingMatches.card} size="md" style={localCardStyle} />
        </div>

        <div 
          className="bg-gradient-to-b from-slate-800 to-slate-900 w-full rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden transition-all duration-300"
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

              <div className="flex flex-wrap justify-center gap-3 relative transition-all duration-300">
                {pendingMatches.matches.map((m) => {
                  const isThisDragged = draggedPlayerId === m.player.id;
                  const isSelected = selectedMatcherId === m.player.id;
                  const isLastCard = m.player.hand.length === 1;
                  
                  const widthClass = pendingMatches.matches.length > 1 ? 'w-[calc(50%-0.375rem)]' : 'w-full';

                  return (
                    <div
                      key={m.player.id}
                      onPointerDown={(e) => handlePointerDown(e, m.player.id)}
                      className={`group flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-2xl select-none touch-none cursor-grab active:cursor-grabbing border ${widthClass} max-w-full transition-all duration-300 ${
                        isThisDragged
                          ? 'opacity-20 scale-95 border-emerald-500/30 bg-emerald-950/20'
                          : isSelected
                          ? 'bg-emerald-900/40 border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg'
                          : 'bg-black/40 border-white/10 hover:border-emerald-500/50 hover:bg-emerald-950/20 active:scale-95'
                      }`}
                    >
                      {m.initialCount > 1 && (
                        <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-amber-400 to-orange-500 text-black font-black text-[11px] px-2 py-0.5 rounded-full shadow-lg">
                          {m.count}x
                        </div>
                      )}

                      <div className="w-12 h-12 rounded-full border-2 border-white/10 bg-slate-800 flex items-center justify-center font-black text-white overflow-hidden shadow-md shrink-0 pointer-events-none">
                        {m.player.image ? (
                          <img src={m.player.image} className="w-full h-full object-cover pointer-events-none" />
                        ) : (
                          m.player.name.charAt(0)
                        )}
                      </div>

                      <div className="flex flex-col min-w-0 justify-center pointer-events-none">
                        <span className="font-bold text-sm text-white truncate leading-tight">
                          {m.player.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium truncate">
                          {isLastCard ? (
                            t("Laatste kaart")
                          ) : (
                            `${m.player.hand.length} ${t("kaarten")}`
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full min-h-[160px] mt-4 flex items-start justify-center relative">
          {showTargets && (
            <div className="w-full animate-slide-in-bottom">
              <h3 className="text-center font-bold uppercase tracking-widest mb-3 text-emerald-400 text-xs flex items-center justify-center gap-2">
                <Target size={14} /> 
                {isDraggingActive ? t("Laat los op slachtoffer") : t("Tik op een slachtoffer")}
              </h3>

              <div className="flex flex-wrap justify-center gap-2 px-2 w-full max-w-sm">
                {potentialTargets.map((p) => {
                  const isHovered = hoveredTargetId === p.id;
                  const isSource = draggedPlayerId === p.id;

                  const targetCount = potentialTargets.length;
                  let sizeClass = "w-12 h-12 text-base";
                  let textClass = "text-[9px] max-w-[48px]";
                  
                  if (targetCount <= 2) {
                    sizeClass = "w-20 h-20 text-3xl";
                    textClass = "text-sm max-w-[80px]";
                  } else if (targetCount <= 4) {
                    sizeClass = "w-16 h-16 text-xl";
                    textClass = "text-xs max-w-[64px]";
                  } else if (targetCount <= 8) {
                    sizeClass = "w-14 h-14 text-lg";
                    textClass = "text-[10px] max-w-[56px]";
                  }

                  return (
                    <div
                      key={p.id}
                      data-target-player-id={p.id}
                      onClick={() => handleTargetClick(p.id)}
                      className={`flex flex-col items-center gap-1.5 shrink-0 transition-all duration-200 cursor-pointer ${
                        isHovered ? 'scale-125 -translate-y-2 z-10' : 'scale-100 opacity-90'
                      } ${isSource && !isHovered ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                    >
                      <div
                        className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white overflow-hidden shadow-lg transition-all pointer-events-none ${
                          isHovered
                            ? 'bg-emerald-500 ring-4 ring-emerald-400/50 shadow-[0_10px_25px_rgba(52,211,153,0.6)]'
                            : isSource 
                            ? 'bg-slate-700 border-2 border-slate-600'
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
            <div className={`w-3 h-3 rounded-full transition-all ${
              hoveredTargetId
                ? 'border-2 border-emerald-400 bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.8)] scale-125'
                : 'border-2 border-white bg-slate-800 shadow-md'
            }`} />
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
