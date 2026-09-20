import React, { useState, useRef, useEffect } from 'react';
import {
  MangaPage,
  SpeechBubble,
  CharacterFace,
  CastVoice,
  VisemeType
} from '../types';
import { getAnimeMouthSvgPath } from '../utils/rhubarbLipSync';
import { MotionComicStage } from './MotionComicStage';
import {
  Volume2,
  Sparkles,
  User,
  ArrowRight,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface MangaCanvasProps {
  page: MangaPage;
  selectedBubbleId: string | null;
  onSelectBubble: (id: string) => void;
  cast: CastVoice[];
  activeView: 'editor' | 'compare' | 'player';
  zoom: number;
  activePlayingBubbleId: string | null;
  activeViseme: VisemeType;
  showReadingOrder: boolean;
  onToggleReadingOrder: () => void;
  onPlayBubble?: (bubble: SpeechBubble) => void;
  isCleanPlateView?: boolean;
  onToggleCleanPlateView?: () => void;
  currentTime?: number;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onSeek?: (time: number) => void;
}

export const MangaCanvas: React.FC<MangaCanvasProps> = ({
  page,
  selectedBubbleId,
  onSelectBubble,
  cast,
  activeView,
  zoom,
  activePlayingBubbleId,
  activeViseme,
  showReadingOrder,
  onToggleReadingOrder,
  onPlayBubble,
  isCleanPlateView = false,
  onToggleCleanPlateView,
  currentTime = 0,
  isPlaying = false,
  onTogglePlay = () => {},
  onSeek = () => {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // For Compare Slider mode
  const [compareSplit, setCompareSplit] = useState<number>(50); // percentage 0-100
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking empty area or middle click or space key held
    if (e.button === 1 || e.target === containerRef.current || (e.target as HTMLElement).id === 'canvas-wrapper') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }

    if (isDraggingSlider && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const percentage = Math.max(5, Math.min(95, (relativeX / rect.width) * 100));
      setCompareSplit(percentage);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingSlider(false);
  };

  // Find speaker helper
  const getSpeakerForBubble = (speakerId: string) => {
    return cast.find((c) => c.id === speakerId);
  };

  // Find active playing character face for lip sync
  const activeBubble = page.bubbles.find((b) => b.id === activePlayingBubbleId);
  const activeSpeakerId = activeBubble?.speakerId;
  const activeFace = page.faces.find((f) => f.castVoiceId === activeSpeakerId);

  return (
    <div
      ref={containerRef}
      id="manga-canvas-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="flex-1 bg-[#0B0D10] relative overflow-hidden flex items-center justify-center select-none"
      style={{
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
        backgroundSize: '24px 24px',
        cursor: isPanning ? 'grabbing' : 'default',
      }}
    >
      {/* Floating Canvas Top Overlay Controls */}
      <div className="absolute top-3 left-4 z-20 flex items-center gap-2 bg-[#111419]/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] shadow-lg">
        <button
          id="toggle-reading-order-btn"
          onClick={onToggleReadingOrder}
          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
            showReadingOrder
              ? 'bg-[#7C5CFC]/20 text-[#7C5CFC] border border-[#7C5CFC]/40'
              : 'text-[#9AA4B2] hover:text-white'
          }`}
          title="Exibir fluxo de leitura RTL (Right-to-Left)"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          <span>Ordem Mangá (RTL)</span>
        </button>

        {onToggleCleanPlateView && (
          <button
            id="toggle-canvas-clean-plate-btn"
            onClick={onToggleCleanPlateView}
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              isCleanPlateView
                ? 'bg-[#35C98B]/20 text-[#35C98B] border border-[#35C98B]/40 font-bold'
                : 'text-[#9AA4B2] hover:text-white'
            }`}
            title="Alternar entre imagem original e balões limpos"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#35C98B]" />
            <span>{isCleanPlateView ? 'Clean Plate Ativo' : 'Ver Clean Plate'}</span>
          </button>
        )}

        <div className="h-3.5 w-[1px] bg-[rgba(255,255,255,0.1)]" />

        <div className="text-[11px] text-[#9AA4B2] font-mono flex items-center gap-1.5">
          <span>{page.bubbles.length} Balões</span>
          <span>•</span>
          <span>{page.faces.length} Rostos</span>
        </div>
      </div>

      {/* Main Manga Stage */}
      <div
        id="canvas-wrapper"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out',
        }}
        className="relative max-h-[86vh] shadow-2xl rounded-sm border border-[rgba(255,255,255,0.1)]"
      >
        {/* ================= MODE 1: Standard Editor with Interactive Bounding Boxes ================= */}
        {activeView === 'editor' && (
          <div className="relative w-full h-full">
            {/* Base Manga Page Image (Original or Clean Plate based on toggle) */}
            <img
              src={isCleanPlateView ? (page.cleanImageUrl || page.imageUrl) : page.imageUrl}
              alt={page.title}
              className="max-h-[82vh] w-auto block select-none pointer-events-none"
              draggable={false}
            />

            {/* Reading Order Flow Path SVG Overlay */}
            {showReadingOrder && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#7C5CFC" />
                  </marker>
                </defs>
                {/* Draw arrows between sequential bubbles */}
                {page.bubbles
                  .slice()
                  .sort((a, b) => a.readingOrder - b.readingOrder)
                  .map((b, idx, arr) => {
                    if (idx === 0) return null;
                    const prev = arr[idx - 1];
                    const x1 = `${prev.box.x + prev.box.width / 2}%`;
                    const y1 = `${prev.box.y + prev.box.height / 2}%`;
                    const x2 = `${b.box.x + b.box.width / 2}%`;
                    const y2 = `${b.box.y + b.box.height / 2}%`;
                    return (
                      <line
                        key={`flow-${b.id}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#7C5CFC"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                        markerEnd="url(#arrowhead)"
                        opacity="0.85"
                      />
                    );
                  })}
              </svg>
            )}

            {/* Character Face Boxes & Lip Sync Overlay */}
            {page.faces.map((face) => {
              const activeBubble = page.bubbles.find((b) => b.id === activePlayingBubbleId);
              const isSpeaking = Boolean(
                activeBubble && (
                  face.castVoiceId === activeBubble.speakerId ||
                  face.id === activeBubble.speakerId ||
                  (activeBubble.suggestedSpeaker && face.name.toLowerCase().includes(activeBubble.suggestedSpeaker.toLowerCase())) ||
                  (page.faces.length === 1 && activeBubble.bubbleType !== 'narration') ||
                  (() => {
                    // Match panel proximity
                    const bubbleCenterY = activeBubble.box.y + activeBubble.box.height / 2;
                    const faceCenterY = face.box.y + face.box.height / 2;
                    return (bubbleCenterY < 50 && faceCenterY < 50) || (bubbleCenterY >= 50 && faceCenterY >= 50);
                  })()
                )
              );

              return (
                <div
                  key={face.id}
                  id={`face-box-${face.id}`}
                  style={{
                    left: `${face.box.x}%`,
                    top: `${face.box.y}%`,
                    width: `${face.box.width}%`,
                    height: `${face.box.height}%`,
                  }}
                  className={`absolute border-2 rounded transition-all pointer-events-auto z-15 ${
                    isSpeaking
                      ? 'border-[#7C5CFC] shadow-lg shadow-[#7C5CFC]/30 animate-pulse'
                      : 'border-cyan-400/60 hover:border-cyan-400'
                  }`}
                >
                  {/* Face Tag */}
                  <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[10px] font-semibold text-cyan-300 flex items-center gap-1 whitespace-nowrap border border-cyan-400/30">
                    <User className="w-2.5 h-2.5" />
                    <span>{face.name}</span>
                    {isSpeaking && (
                      <span className="w-2 h-2 rounded-full bg-[#7C5CFC] animate-ping" />
                    )}
                  </div>

                  {/* 2D Anime Mouth Lip-Sync Overlay when speaking! */}
                  {isSpeaking && (
                    <div
                      id={`mouth-viseme-${face.id}`}
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-7 bg-black/75 rounded-md p-1 border border-[#7C5CFC] flex items-center justify-center shadow-lg"
                    >
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <path
                          d={getAnimeMouthSvgPath(activeViseme)}
                          fill={activeViseme === 'X' || activeViseme === 'A' ? 'none' : '#EF4444'}
                          stroke="#FFFFFF"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Speech Bubble Bounding Boxes */}
            {page.bubbles.map((bubble) => {
              const isSelected = bubble.id === selectedBubbleId;
              const isPlayingThis = bubble.id === activePlayingBubbleId;
              const speaker = getSpeakerForBubble(bubble.speakerId);
              const isLowConfidence = bubble.confidence < 85 || !bubble.speakerId;

              return (
                <div
                  key={bubble.id}
                  id={`bubble-box-${bubble.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBubble(bubble.id);
                  }}
                  style={{
                    left: `${bubble.box.x}%`,
                    top: `${bubble.box.y}%`,
                    width: `${bubble.box.width}%`,
                    height: `${bubble.box.height}%`,
                  }}
                  className={`absolute rounded cursor-pointer transition-all duration-150 z-20 group ${
                    isSelected
                      ? 'border-2 border-[#7C5CFC] bg-[#7C5CFC]/15 shadow-xl ring-2 ring-[#7C5CFC]/40'
                      : isPlayingThis
                      ? 'border-2 border-[#35C98B] bg-[#35C98B]/20 animate-pulse'
                      : isLowConfidence
                      ? 'border-2 border-[#F2B84B] bg-[#F2B84B]/10 hover:bg-[#F2B84B]/20'
                      : 'border-2 border-transparent hover:border-white/60 hover:bg-white/10'
                  }`}
                >
                  {/* Reading Order Badge */}
                  <div
                    className={`absolute -top-3 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shadow-md transition-transform ${
                      isSelected
                        ? 'bg-[#7C5CFC] text-white scale-110'
                        : isLowConfidence
                        ? 'bg-[#F2B84B] text-black font-extrabold'
                        : 'bg-black/90 text-white border border-white/20'
                    }`}
                  >
                    {bubble.readingOrder}
                  </div>

                  {/* Speaker Label Pill */}
                  {speaker && (
                    <div
                      className="absolute -top-3.5 left-0 px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow flex items-center gap-1 truncate max-w-[120px]"
                      style={{ backgroundColor: speaker.color }}
                    >
                      <span>{speaker.avatarIcon}</span>
                      <span className="truncate">{speaker.name.split(' ')[0]}</span>
                    </div>
                  )}

                  {/* Unassigned Warning Indicator */}
                  {!speaker && (
                    <div className="absolute -top-3.5 left-0 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#F2B84B] text-black shadow">
                      Sem Voz
                    </div>
                  )}

                  {/* Quick Audio Play Button on Bubble */}
                  {onPlayBubble && (
                    <button
                      id={`play-bubble-audio-${bubble.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayBubble(bubble);
                      }}
                      title="Ouvir fala"
                      className="opacity-0 group-hover:opacity-100 absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#7C5CFC] hover:bg-[#6946EB] text-white flex items-center justify-center shadow-lg transition-opacity z-30"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Hover Speech Preview Popover */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 p-2.5 rounded bg-[#111419]/95 border border-[rgba(255,255,255,0.15)] shadow-2xl backdrop-blur-md text-left z-30 transition-opacity">
                    <div className="flex items-center justify-between text-[10px] text-[#9AA4B2] pb-1 border-b border-white/10">
                      <span className="font-semibold text-[#F4F6F8]">
                        {speaker?.name.split(' ')[0] || 'Voz Indefinida'}
                      </span>
                      <div className="flex items-center gap-1">
                        {bubble.audioBase64 && (
                          <span className="text-[8px] bg-[#35C98B]/20 text-[#35C98B] px-1 py-0.2 rounded font-bold">
                            TTS
                          </span>
                        )}
                        <span className="font-mono text-[#35C98B]">{bubble.confidence}%</span>
                      </div>
                    </div>
                    {bubble.japaneseText && (
                      <p className="text-[10px] text-[#9AA4B2] font-mono mt-1 italic line-clamp-1">
                        {bubble.japaneseText}
                      </p>
                    )}
                    <p className="text-[11px] text-[#F4F6F8] font-medium mt-1 leading-snug">
                      "{bubble.translatedText}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= MODE 2: Original vs Clean Plate (Before/After Compare Slider) ================= */}
        {activeView === 'compare' && (
          <div
            id="compare-slider-stage"
            className="relative w-full h-full overflow-hidden select-none"
          >
            {/* Clean Plate Image (Inpainted background) */}
            <img
              src={page.cleanImageUrl || page.imageUrl}
              alt="Clean Inpainted Manga Plate"
              className="max-h-[82vh] w-auto block select-none pointer-events-none"
            />

            {/* Original Manga Image (Clipped by split percentage) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${compareSplit}%` }}
            >
              <img
                src={page.imageUrl}
                alt="Original Manga Page"
                className="max-h-[82vh] w-auto max-w-none block select-none pointer-events-none"
              />
            </div>

            {/* Draggable Divider Handle */}
            <div
              id="compare-divider-handle"
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsDraggingSlider(true);
              }}
              style={{ left: `${compareSplit}%` }}
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30 shadow-[0_0_10px_rgba(0,0,0,0.8)] flex items-center justify-center -translate-x-1/2"
            >
              <div className="w-8 h-8 rounded-full bg-[#7C5CFC] text-white flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold">
                ↔
              </div>
            </div>

            {/* Pill Labels */}
            <div className="absolute top-4 left-4 px-2.5 py-1 rounded bg-black/80 backdrop-blur-sm text-xs font-bold text-white border border-white/10">
              Original (Com Balões)
            </div>
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded bg-[#35C98B]/90 backdrop-blur-sm text-xs font-bold text-black border border-black/10">
              Clean Plate (Texto Removido)
            </div>
          </div>
        )}

        {/* ================= MODE 3: Full Cinematic Motion Comic Player ================= */}
        {activeView === 'player' && (
          <div className="w-full h-full flex items-center justify-center p-2">
            <MotionComicStage
              page={page}
              cast={cast}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onTogglePlay={onTogglePlay}
              onSeek={onSeek}
              activeViseme={activeViseme}
              activePlayingBubbleId={activePlayingBubbleId}
              onBubbleSelect={onSelectBubble}
            />
          </div>
        )}
      </div>
    </div>
  );
};
