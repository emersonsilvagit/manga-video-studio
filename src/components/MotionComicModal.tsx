import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Subtitles,
  Sparkles
} from 'lucide-react';
import { MangaPage, CastVoice, SpeechBubble, VisemeType } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { getAnimeMouthSvgPath } from '../utils/rhubarbLipSync';

interface MotionComicModalProps {
  page: MangaPage;
  cast: CastVoice[];
  onClose: () => void;
}

export const MotionComicModal: React.FC<MotionComicModalProps> = ({
  page,
  cast,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentBubbleIndex, setCurrentBubbleIndex] = useState(0);
  const [activeViseme, setActiveViseme] = useState<VisemeType>('X');
  const [activeSubtitle, setActiveSubtitle] = useState<{ speaker: string; text: string } | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<CastVoice | null>(null);

  const sortedBubbles = page.bubbles
    .slice()
    .sort((a, b) => a.readingOrder - b.readingOrder);
  const currentBubble = sortedBubbles[currentBubbleIndex] || sortedBubbles[0];

  // Find corresponding face
  const activeFace = page.faces.find((f) => f.castVoiceId === currentBubble?.speakerId);

  // Play dialogue and viseme sequence for current bubble
  useEffect(() => {
    if (!isPlaying || !currentBubble) return;

    const speaker = cast.find((c) => c.id === currentBubble.speakerId) || null;
    setCurrentSpeaker(speaker);
    setActiveSubtitle({
      speaker: speaker?.name || 'Narrador',
      text: currentBubble.translatedText,
    });

    // Start mouth viseme animation loop
    let visemeTimer: NodeJS.Timeout | null = null;
    let step = 0;
    const visemes = currentBubble.visemes || [];

    visemeTimer = setInterval(() => {
      if (step < visemes.length) {
        setActiveViseme(visemes[step].viseme);
        step++;
      } else {
        setActiveViseme('X');
      }
    }, 120);

    // Speak text
    audioEngine.speakText(currentBubble.translatedText, {
      audioBase64: currentBubble.audioBase64,
      pitch: currentBubble.pitch,
      rate: currentBubble.rate,
      volume: currentBubble.volume,
      onEnd: () => {
        setActiveViseme('X');
        if (visemeTimer) clearInterval(visemeTimer);

        // Advance to next bubble after pause
        setTimeout(() => {
          if (currentBubbleIndex < sortedBubbles.length - 1) {
            setCurrentBubbleIndex((prev) => prev + 1);
          } else {
            setIsPlaying(false);
          }
        }, 800);
      },
    });

    return () => {
      if (visemeTimer) clearInterval(visemeTimer);
      audioEngine.stopAllSpeech();
    };
  }, [currentBubbleIndex, isPlaying]);

  // Compute camera zoom box based on active bubble or panel
  const getCameraStyle = () => {
    if (!currentBubble) return { transform: 'scale(1)', transformOrigin: 'center center' };

    // Pan camera towards the active bubble / character
    const targetX = currentBubble.box.x + currentBubble.box.width / 2;
    const targetY = currentBubble.box.y + currentBubble.box.height / 2;

    return {
      transform: 'scale(1.35)',
      transformOrigin: `${targetX}% ${targetY}%`,
      transition: 'transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
    };
  };

  return (
    <div
      id="motion-comic-modal"
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-lg select-none"
    >
      {/* Top Controls */}
      <div className="w-full max-w-5xl flex items-center justify-between py-3 px-4 border-b border-white/10 text-white">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#7C5CFC] text-xs font-bold font-mono">
            1080p MOTION MANGA
          </span>
          <span className="text-sm font-bold text-white">
            {page.chapterTitle} • Cena {currentBubbleIndex + 1} de {sortedBubbles.length}
          </span>
        </div>

        <button
          id="close-motion-modal-btn"
          onClick={() => {
            audioEngine.stopAllSpeech();
            onClose();
          }}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main 16:9 Cinema Viewport */}
      <div className="w-full max-w-5xl aspect-[16/9] bg-[#05070A] relative overflow-hidden rounded-xl border border-white/10 shadow-2xl my-auto flex items-center justify-center">
        {/* Animated Page with Cinematic Camera Pan & Zoom */}
        <div
          id="motion-camera-viewport"
          style={getCameraStyle()}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* Manga Image (prefer Clean Plate for anime dubbing) */}
          <img
            src={page.cleanImageUrl || page.imageUrl}
            alt="Motion Manga Stage"
            className="max-h-full max-w-full object-contain block select-none"
          />

          {/* 2D Anime Mouth Overlay on Speaker Face */}
          {activeFace && (
            <div
              style={{
                left: `${activeFace.box.x}%`,
                top: `${activeFace.box.y}%`,
                width: `${activeFace.box.width}%`,
                height: `${activeFace.box.height}%`,
              }}
              className="absolute pointer-events-none z-30"
            >
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-8 bg-black/80 rounded-md p-1 border border-[#7C5CFC] shadow-xl flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path
                    d={getAnimeMouthSvgPath(activeViseme)}
                    fill={activeViseme === 'X' || activeViseme === 'A' ? 'none' : '#EF4444'}
                    stroke="#FFFFFF"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Cinematic Subtitles Caption Box */}
        {activeSubtitle && (
          <div
            id="motion-subtitles"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-2xl w-11/12 bg-black/85 backdrop-blur-md px-5 py-3 rounded-xl border border-white/15 text-center shadow-2xl z-40 transition-all"
          >
            {currentSpeaker && (
              <span
                className="text-xs font-bold uppercase tracking-wider block mb-1"
                style={{ color: currentSpeaker.color }}
              >
                {currentSpeaker.avatarIcon} {currentSpeaker.name}
              </span>
            )}
            <p className="text-base md:text-lg font-bold text-white tracking-wide leading-snug drop-shadow-md">
              "{activeSubtitle.text}"
            </p>
          </div>
        )}
      </div>

      {/* Bottom Player Controls */}
      <div className="w-full max-w-xl flex items-center justify-center gap-4 py-3 text-white">
        <button
          onClick={() => setCurrentBubbleIndex((prev) => Math.max(0, prev - 1))}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Quadro anterior"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          id="motion-play-pause-btn"
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-3 rounded-full bg-[#7C5CFC] hover:bg-[#6946EB] transition-all shadow-lg shadow-[#7C5CFC]/30"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        <button
          onClick={() => {
            setCurrentBubbleIndex(0);
            setIsPlaying(true);
          }}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Reiniciar do começo"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() =>
            setCurrentBubbleIndex((prev) => Math.min(sortedBubbles.length - 1, prev + 1))
          }
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Próximo quadro"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
