import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Download,
  Film,
  Sparkles,
  Video,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { MangaPage, CastVoice, SpeechBubble, VisemeType, CharacterFace } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { getAnimeMouthSvgPath } from '../utils/rhubarbLipSync';

interface MotionComicStageProps {
  page: MangaPage;
  cast: CastVoice[];
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  activeViseme: VisemeType;
  activePlayingBubbleId: string | null;
  onBubbleSelect?: (id: string) => void;
}

export const MotionComicStage: React.FC<MotionComicStageProps> = ({
  page,
  cast,
  currentTime,
  isPlaying,
  onTogglePlay,
  onSeek,
  activeViseme,
  activePlayingBubbleId,
  onBubbleSelect,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sorted bubbles in reading order
  const sortedBubbles = useMemo(() => {
    return page.bubbles.slice().sort((a, b) => a.readingOrder - b.readingOrder);
  }, [page.bubbles]);

  // Find the bubble currently active at currentTime
  const activeBubble = useMemo(() => {
    if (activePlayingBubbleId) {
      return page.bubbles.find((b) => b.id === activePlayingBubbleId) || null;
    }
    return (
      sortedBubbles.find(
        (b) => currentTime >= b.startTime && currentTime <= b.startTime + b.duration
      ) || null
    );
  }, [activePlayingBubbleId, page.bubbles, sortedBubbles, currentTime]);

  // Find speaker for active bubble
  const activeSpeaker = useMemo(() => {
    if (!activeBubble) return null;
    return cast.find((c) => c.id === activeBubble.speakerId) || {
      id: 'speaker_auto',
      name: activeBubble.suggestedSpeaker || 'Personagem',
      role: 'Voz',
      color: '#7C5CFC',
      avatarIcon: '💬',
      gender: 'male' as const,
      voicePreset: 'Gemini',
      pitch: 1.0,
      rate: 1.0,
      emotion: activeBubble.emotion || 'neutral',
      assignedBubblesCount: 1,
    };
  }, [activeBubble, cast]);

  // Find the face corresponding to active bubble / speaker
  const activeFace = useMemo<CharacterFace | null>(() => {
    if (!activeBubble || page.faces.length === 0) return null;

    // 1. Direct ID match
    const byId = page.faces.find((f) => f.castVoiceId === activeBubble.speakerId);
    if (byId) return byId;

    // 2. Name similarity
    const speakerName = (activeSpeaker?.name || activeBubble.suggestedSpeaker || '').toLowerCase();
    const byName = page.faces.find((f) =>
      speakerName && f.name.toLowerCase().includes(speakerName)
    );
    if (byName) return byName;

    // 3. Panel vertical proximity (top vs bottom)
    const bubbleCenterY = activeBubble.box.y + activeBubble.box.height / 2;
    const isTopPanel = bubbleCenterY < 50;

    const byPanel = page.faces.find((f) => {
      const faceCenterY = f.box.y + f.box.height / 2;
      return isTopPanel ? faceCenterY < 50 : faceCenterY >= 50;
    });

    return byPanel || page.faces[0] || null;
  }, [activeBubble, activeSpeaker, page.faces]);

  // Calculate dynamic camera pan & zoom transform
  const cameraTransform = useMemo(() => {
    if (!activeBubble) {
      // Resting overview camera: slight subtle zoom-out
      return {
        scale: 1.02,
        originX: 50,
        originY: 50,
      };
    }

    // Zoom in on the active character & bubble!
    let targetX = activeBubble.box.x + activeBubble.box.width / 2;
    let targetY = activeBubble.box.y + activeBubble.box.height / 2;

    // If we have an active face, pan camera slightly towards the character's face for cinematic balance
    if (activeFace) {
      const faceCenterX = activeFace.box.x + activeFace.box.width / 2;
      const faceCenterY = activeFace.box.y + activeFace.box.height / 2;
      targetX = (targetX + faceCenterX) / 2;
      targetY = (targetY + faceCenterY) / 2;
    }

    // Keep within boundaries to avoid extreme empty margins
    const clampedX = Math.max(22, Math.min(78, targetX));
    const clampedY = Math.max(20, Math.min(80, targetY));

    return {
      scale: 1.62, // Zoom in
      originX: clampedX,
      originY: clampedY,
    };
  }, [activeBubble, activeFace]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Jump to bubble
  const handleJumpToBubble = (bubble: SpeechBubble) => {
    onSeek(bubble.startTime);
    if (!isPlaying) onTogglePlay();
    if (onBubbleSelect) onBubbleSelect(bubble.id);
  };

  // Video recording function
  const handleRecordVideo = async () => {
    if (isRecording) return;
    setIsRecording(true);
    setRecordingProgress(0);
    setExportNotice('Iniciando gravação cinematográfica...');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not available');

      // Load clean manga image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = page.cleanImageUrl || page.imageUrl;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      // Stream canvas
      const stream = canvas.captureStream(30);

      // Web Audio stream for audio capture
      const audioCtx = audioEngine.getContext();
      const dest = audioCtx.createMediaStreamDestination();

      const combinedTracks = [
        ...stream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ];
      const combinedStream = new MediaStream(combinedTracks);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.start();

      // Animate timeline through all bubbles
      const totalDur = Math.max(8, ...sortedBubbles.map((b) => b.startTime + b.duration + 1.0));
      const fps = 30;
      const totalFrames = Math.floor(totalDur * fps);

      for (let f = 0; f < totalFrames; f++) {
        const t = f / fps;
        setRecordingProgress(Math.round((f / totalFrames) * 100));

        // Find active bubble at time t
        const curB = sortedBubbles.find((b) => t >= b.startTime && t <= b.startTime + b.duration);

        // Draw background
        ctx.fillStyle = '#080A0E';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Camera calculations
        let scale = 1.0;
        let originX = 50;
        let originY = 50;

        if (curB) {
          scale = 1.55;
          originX = Math.max(25, Math.min(75, curB.box.x + curB.box.width / 2));
          originY = Math.max(20, Math.min(80, curB.box.y + curB.box.height / 2));
        }

        ctx.save();
        // Camera translation & zoom
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, scale);
        ctx.translate(
          -(originX / 100) * (img.width * (canvas.height / img.height)),
          -(originY / 100) * canvas.height
        );

        // Draw manga image
        const imgH = canvas.height;
        const imgW = img.width * (imgH / img.height);
        ctx.drawImage(img, 0, 0, imgW, imgH);

        // If mouth is speaking and face is visible
        if (curB) {
          const curFace = page.faces.find((fc) => {
            const fcCenterY = fc.box.y + fc.box.height / 2;
            const bCenterY = curB.box.y + curB.box.height / 2;
            return bCenterY < 50 ? fcCenterY < 50 : fcCenterY >= 50;
          });

          if (curFace) {
            const faceX = (curFace.box.x / 100) * imgW;
            const faceY = (curFace.box.y / 100) * imgH;
            const faceW = (curFace.box.width / 100) * imgW;
            const faceH = (curFace.box.height / 100) * imgH;

            // Mouth animation
            const mouthCycle = Math.sin(f * 0.4);
            const mouthOpen = mouthCycle > 0 ? 8 : 2;

            ctx.fillStyle = '#C53030';
            ctx.beginPath();
            ctx.ellipse(
              faceX + faceW * 0.5,
              faceY + faceH * 0.75,
              6,
              mouthOpen,
              0,
              0,
              Math.PI * 2
            );
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        ctx.restore();

        // Draw Subtitle Bar
        if (curB) {
          const spk = cast.find((c) => c.id === curB.speakerId) || {
            name: curB.suggestedSpeaker || 'Personagem',
            color: '#7C5CFC',
          };

          // Subtitle box
          const subW = 860;
          const subH = 80;
          const subX = (canvas.width - subW) / 2;
          const subY = canvas.height - subH - 24;

          ctx.fillStyle = 'rgba(10, 12, 16, 0.88)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(subX, subY, subW, subH, 12);
          ctx.fill();
          ctx.stroke();

          // Speaker label
          ctx.font = 'bold 13px system-ui, sans-serif';
          ctx.fillStyle = spk.color || '#7C5CFC';
          ctx.fillText(spk.name.toUpperCase(), subX + 24, subY + 28);

          // Subtitle text
          ctx.font = 'bold 20px system-ui, sans-serif';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(`"${curB.translatedText}"`, subX + 24, subY + 58);
        }

        // Wait small tick between frames
        await new Promise((r) => setTimeout(r, 10));
      }

      recorder.stop();
      await new Promise((r) => {
        recorder.onstop = r;
      });

      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `motion_manga_${page.title.toLowerCase().replace(/\s+/g, '_')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setExportNotice('Vídeo gerado e baixado com sucesso!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error('Video recording error:', err);
      setExportNotice('Erro ao gerar gravação de vídeo.');
      setTimeout(() => setExportNotice(null), 4000);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div
      ref={containerRef}
      id="motion-comic-stage"
      className={`relative w-full h-full bg-[#05070A] flex flex-col items-center justify-between overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 p-4' : 'rounded-xl border border-[rgba(255,255,255,0.08)]'
      }`}
    >
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-black/60 backdrop-blur-md border-b border-white/10 z-30">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded bg-[#7C5CFC] text-white text-[11px] font-bold tracking-wider flex items-center gap-1 shadow-sm">
            <Film className="w-3 h-3" />
            MOTION MANGA 1080p
          </span>
          <span className="text-xs font-semibold text-white/90 truncate max-w-xs md:max-w-md">
            {page.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {exportNotice && (
            <span className="text-xs font-medium text-[#35C98B] flex items-center gap-1 bg-[#35C98B]/10 px-2 py-1 rounded border border-[#35C98B]/30 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {exportNotice}
            </span>
          )}

          <button
            id="record-video-btn"
            onClick={handleRecordVideo}
            disabled={isRecording}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              isRecording
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-[#15191F] hover:bg-[#1E232B] text-white border border-[#7C5CFC]/40'
            }`}
            title="Gravar vídeo animado com zoom, legendas e áudio dublado"
          >
            {isRecording ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Gravando ({recordingProgress}%)</span>
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5 text-[#7C5CFC]" />
                <span>Exportar Vídeo</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isMuted ? 'Ativar som' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Cinematic Viewport Stage with Camera Pan & Zoom */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
        {/* Dynamic Camera Container */}
        <div
          id="motion-stage-camera"
          style={{
            transform: `scale(${cameraTransform.scale})`,
            transformOrigin: `${cameraTransform.originX}% ${cameraTransform.originY}%`,
            transition: 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="relative max-h-full max-w-full flex items-center justify-center will-change-transform"
        >
          {/* Manga Artwork: Clean Plate without original text */}
          <img
            src={page.cleanImageUrl || page.imageUrl}
            alt="Manga Motion Comic"
            className="max-h-[75vh] w-auto object-contain block shadow-2xl rounded-sm select-none"
          />

          {/* Active Bubble Glow Highlight in Manga Art */}
          {activeBubble && (
            <div
              id={`motion-bubble-glow-${activeBubble.id}`}
              style={{
                left: `${activeBubble.box.x}%`,
                top: `${activeBubble.box.y}%`,
                width: `${activeBubble.box.width}%`,
                height: `${activeBubble.box.height}%`,
              }}
              className="absolute border-2 border-[#7C5CFC] rounded-lg shadow-[0_0_25px_rgba(124,92,252,0.45)] pointer-events-none animate-pulse transition-all duration-300"
            />
          )}

          {/* Real-Time Animated 2D Anime Mouth Lip-Sync Overlay on Speaker's Face */}
          {activeFace && activeBubble && (
            <div
              id={`motion-mouth-overlay-${activeFace.id}`}
              style={{
                left: `${activeFace.box.x}%`,
                top: `${activeFace.box.y}%`,
                width: `${activeFace.box.width}%`,
                height: `${activeFace.box.height}%`,
              }}
              className="absolute pointer-events-none z-30 transition-all duration-300"
            >
              {/* Speaker Indicator Badge */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 text-[10px] font-bold text-white border border-[#7C5CFC]/60 shadow-lg whitespace-nowrap flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#35C98B] animate-ping" />
                <span>{activeFace.name}</span>
              </div>

              {/* Dynamic Lip Sync Mouth Shape */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-11 h-8 bg-black/85 rounded-md p-1 border-2 border-[#7C5CFC] shadow-2xl flex items-center justify-center">
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

        {/* Subtitles Overlay Bar (Legendas) */}
        {activeBubble && (
          <div
            id="motion-comic-subtitles"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-2xl w-11/12 bg-black/90 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20 text-center shadow-2xl z-40 transition-all"
          >
            {activeSpeaker && (
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span
                  className="text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                  style={{ color: activeSpeaker.color || '#7C5CFC' }}
                >
                  <span>{activeSpeaker.avatarIcon || '💬'}</span>
                  <span>{activeSpeaker.name}</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/70 font-mono">
                  {activeBubble.bubbleType === 'narration' ? 'NARRAÇÃO' : 'DUBLAGEM GEMINI TTS'}
                </span>
              </div>
            )}
            <p className="text-base md:text-xl font-extrabold text-white tracking-wide leading-snug drop-shadow-md">
              "{activeBubble.translatedText}"
            </p>
          </div>
        )}
      </div>

      {/* Bottom Scene Timeline & Playback Controller */}
      <div className="w-full bg-[#0B0D10]/95 backdrop-blur-md px-4 py-3 border-t border-white/10 z-30 flex flex-col gap-2">
        {/* Dialogue Scene Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {sortedBubbles.map((bubble, idx) => {
            const isCur = activeBubble?.id === bubble.id;
            const speaker = cast.find((c) => c.id === bubble.speakerId);

            return (
              <button
                key={bubble.id}
                onClick={() => handleJumpToBubble(bubble)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isCur
                    ? 'bg-[#7C5CFC] text-white shadow-md shadow-[#7C5CFC]/30 scale-105 ring-2 ring-white/20'
                    : 'bg-[#15191F] text-[#9AA4B2] hover:text-white hover:bg-[#1E232B] border border-white/5'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: speaker?.color || '#7C5CFC' }}
                />
                <span className="font-bold">#{bubble.readingOrder}</span>
                <span className="truncate max-w-[140px]">{bubble.translatedText}</span>
              </button>
            );
          })}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between text-white pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#9AA4B2]">
              {currentTime.toFixed(1)}s
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const prev = [...sortedBubbles].reverse().find((b: SpeechBubble) => b.startTime < currentTime - 0.5);
                if (prev) handleJumpToBubble(prev);
                else onSeek(0);
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Cena anterior"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              id="motion-stage-play-btn"
              onClick={onTogglePlay}
              className="p-3 rounded-full bg-[#7C5CFC] hover:bg-[#6946EB] text-white transition-all shadow-lg shadow-[#7C5CFC]/30"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => {
                onSeek(0);
                if (!isPlaying) onTogglePlay();
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Reiniciar do começo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const next = sortedBubbles.find((b) => b.startTime > currentTime + 0.2);
                if (next) handleJumpToBubble(next);
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Próxima cena"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-[#9AA4B2]">
            {activeBubble ? (
              <span className="text-[#35C98B] font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Câmera em Cena #{activeBubble.readingOrder}
              </span>
            ) : (
              <span>Visão Panorâmica</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
