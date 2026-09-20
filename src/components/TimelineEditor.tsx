import React, { useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Repeat,
  Volume2,
  VolumeX,
  Plus,
  Music,
  Mic,
  Subtitles,
  Sparkles
} from 'lucide-react';
import { TimelineClip, SpeechBubble, CastVoice, TrackType } from '../types';

interface TimelineEditorProps {
  clips: TimelineClip[];
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  selectedBubbleId: string | null;
  onSelectBubble: (id: string) => void;
  cast: CastVoice[];
  zoomLevel: number; // pixels per second
  onZoomChange: (newZoom: number) => void;
  onOpenSfxTab: () => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  clips,
  currentTime,
  totalDuration,
  isPlaying,
  onTogglePlay,
  onStop,
  onSeek,
  selectedBubbleId,
  onSelectBubble,
  cast,
  zoomLevel,
  onZoomChange,
  onOpenSfxTab,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const pxPerSec = zoomLevel; // e.g., 60px per second

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}.${ms}`;
  };

  // Handle click on timeline to scrub playhead
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(totalDuration, clickX / pxPerSec));
    onSeek(newTime);
  };

  // Group clips by track
  const dialogueClips = clips.filter((c) => c.trackId === 'dialogue');
  const sfxClips = clips.filter((c) => c.trackId === 'sfx');
  const subtitleClips = clips.filter((c) => c.trackId === 'music');

  const totalWidthPx = Math.max(800, totalDuration * pxPerSec + 150);

  // Time ticks array
  const ticksCount = Math.ceil(totalDuration) + 2;
  const ticks = Array.from({ length: ticksCount }, (_, i) => i);

  return (
    <div
      id="timeline-editor"
      className="h-52 bg-[#111419] border-t border-[rgba(255,255,255,0.08)] flex flex-col select-none shrink-0 z-20"
    >
      {/* Timeline Controls Bar */}
      <div className="h-10 bg-[#0B0D10] border-b border-[rgba(255,255,255,0.08)] px-3 flex items-center justify-between">
        {/* Left transport controls */}
        <div className="flex items-center gap-2">
          <button
            id="timeline-play-btn"
            onClick={onTogglePlay}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-[#EF6461] text-white shadow-sm'
                : 'bg-[#7C5CFC] hover:bg-[#6946EB] text-white shadow-sm shadow-[#7C5CFC]/30'
            }`}
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>

          <button
            id="timeline-stop-btn"
            onClick={onStop}
            className="w-7 h-7 rounded-md bg-[#15191F] hover:bg-[#1B2028] text-[#9AA4B2] hover:text-white border border-[rgba(255,255,255,0.08)] flex items-center justify-center transition-colors"
            title="Parar e voltar ao início"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>

          <div className="h-4 w-[1px] bg-[rgba(255,255,255,0.1)] mx-1" />

          {/* Timecode display */}
          <div className="font-mono text-xs text-[#F4F6F8] bg-[#15191F] px-2 py-1 rounded border border-[rgba(255,255,255,0.08)]">
            <span className="text-[#35C98B] font-bold">{formatTime(currentTime)}</span>
            <span className="text-[#697386] mx-1">/</span>
            <span className="text-[#9AA4B2]">{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Right timeline controls (Zoom + Add SFX) */}
        <div className="flex items-center gap-3">
          <button
            id="timeline-add-sfx-btn"
            onClick={onOpenSfxTab}
            className="px-2.5 py-1 rounded text-xs font-medium bg-[#15191F] hover:bg-[#1B2028] text-[#F4F6F8] border border-[rgba(255,255,255,0.08)] flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-[#F2B84B]" />
            <span>Biblioteca SFX</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-[#9AA4B2]">
            <span className="text-[11px]">Zoom:</span>
            <input
              type="range"
              min={30}
              max={120}
              value={zoomLevel}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="w-20 accent-[#7C5CFC] h-1.5 bg-[#1B2028] rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Multi-track Workspace (Tracks Labels + Timeline Tracks Scrollable Area) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers (Left Column) */}
        <div className="w-36 bg-[#111419] border-r border-[rgba(255,255,255,0.08)] flex flex-col shrink-0 text-xs">
          {/* Empty ruler header */}
          <div className="h-6 border-b border-[rgba(255,255,255,0.08)] bg-[#0B0D10]/80 px-2 flex items-center text-[10px] text-[#697386] font-mono">
            TRACKS
          </div>

          {/* Track 1: Dialogue */}
          <div className="h-12 border-b border-[rgba(255,255,255,0.08)] px-2.5 flex items-center justify-between bg-[#15191F]/40">
            <div className="flex items-center gap-1.5 text-[#F4F6F8] font-medium">
              <Mic className="w-3.5 h-3.5 text-[#7C5CFC]" />
              <span className="truncate">Voz / Falas</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#7C5CFC]" />
          </div>

          {/* Track 2: SFX */}
          <div className="h-12 border-b border-[rgba(255,255,255,0.08)] px-2.5 flex items-center justify-between bg-[#15191F]/40">
            <div className="flex items-center gap-1.5 text-[#F4F6F8] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#F2B84B]" />
              <span className="truncate">Efeitos (SFX)</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#F2B84B]" />
          </div>

          {/* Track 3: Subtitles */}
          <div className="h-10 px-2.5 flex items-center justify-between bg-[#15191F]/40">
            <div className="flex items-center gap-1.5 text-[#F4F6F8] font-medium">
              <Subtitles className="w-3.5 h-3.5 text-[#35C98B]" />
              <span className="truncate">Legendas</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#35C98B]" />
          </div>
        </div>

        {/* Scrollable Tracks Canvas */}
        <div
          ref={rulerRef}
          onClick={handleTimelineClick}
          className="flex-1 overflow-x-auto relative bg-[#0B0D10]/50"
        >
          <div style={{ width: `${totalWidthPx}px` }} className="relative h-full">
            {/* Time Ruler (Seconds and milliseconds ticks) */}
            <div className="h-6 border-b border-[rgba(255,255,255,0.08)] relative bg-[#0B0D10] text-[10px] font-mono text-[#697386]">
              {ticks.map((t) => (
                <div
                  key={`tick-${t}`}
                  style={{ left: `${t * pxPerSec}px` }}
                  className="absolute top-0 bottom-0 border-l border-[rgba(255,255,255,0.08)] pl-1 flex items-center"
                >
                  {t}s
                </div>
              ))}
            </div>

            {/* Vertical grid lines extending through tracks */}
            <div className="absolute top-6 bottom-0 left-0 right-0 pointer-events-none">
              {ticks.map((t) => (
                <div
                  key={`grid-${t}`}
                  style={{ left: `${t * pxPerSec}px` }}
                  className="absolute top-0 bottom-0 border-l border-[rgba(255,255,255,0.04)]"
                />
              ))}
            </div>

            {/* TRACK 1: Dialogue & Voice Clips with Visual Waveform */}
            <div className="h-12 border-b border-[rgba(255,255,255,0.08)] relative py-1 px-0.5">
              {dialogueClips.map((clip) => {
                const isSelected = clip.bubbleId === selectedBubbleId;
                const left = clip.startTime * pxPerSec;
                const width = Math.max(30, clip.duration * pxPerSec);

                return (
                  <div
                    key={clip.id}
                    id={`clip-${clip.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (clip.bubbleId) onSelectBubble(clip.bubbleId);
                    }}
                    style={{
                      left: `${left}px`,
                      width: `${width}px`,
                      backgroundColor: isSelected ? '#7C5CFC' : 'rgba(124, 92, 252, 0.35)',
                      borderColor: isSelected ? '#FFFFFF' : '#7C5CFC',
                    }}
                    className={`absolute top-1 bottom-1 rounded border shadow-sm transition-all cursor-pointer flex flex-col justify-between px-2 py-1 overflow-hidden group ${
                      isSelected ? 'ring-2 ring-white/40' : 'hover:bg-[#7C5CFC]/50'
                    }`}
                  >
                    {/* Clip Title & Speaker */}
                    <div className="flex items-center justify-between text-[10px] font-semibold text-white truncate">
                      <span className="truncate">{clip.speakerName || clip.title}</span>
                      <span className="text-[9px] font-mono opacity-80">{clip.duration.toFixed(1)}s</span>
                    </div>

                    {/* Waveform Visualization Bars */}
                    <div className="h-3 flex items-end gap-[1px] overflow-hidden opacity-90">
                      {(clip.waveform || [0.4, 0.7, 0.9, 0.5, 0.8, 0.3]).map((amp, idx) => (
                        <div
                          key={idx}
                          style={{ height: `${Math.max(15, amp * 100)}%` }}
                          className="w-1 bg-white/90 rounded-xs"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TRACK 2: SFX Clips */}
            <div className="h-12 border-b border-[rgba(255,255,255,0.08)] relative py-1 px-0.5">
              {sfxClips.map((clip) => {
                const left = clip.startTime * pxPerSec;
                const width = Math.max(35, clip.duration * pxPerSec);

                return (
                  <div
                    key={clip.id}
                    id={`clip-sfx-${clip.id}`}
                    style={{
                      left: `${left}px`,
                      width: `${width}px`,
                      backgroundColor: 'rgba(242, 184, 75, 0.35)',
                      borderColor: '#F2B84B',
                    }}
                    className="absolute top-1 bottom-1 rounded border shadow-sm transition-all cursor-pointer flex flex-col justify-center px-2 overflow-hidden hover:bg-[#F2B84B]/50"
                  >
                    <div className="text-[10px] font-bold text-white truncate flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-[#F2B84B]" />
                      <span className="truncate">{clip.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TRACK 3: Subtitles */}
            <div className="h-10 relative py-1 px-0.5">
              {dialogueClips.map((clip) => {
                const left = clip.startTime * pxPerSec;
                const width = Math.max(30, clip.duration * pxPerSec);

                return (
                  <div
                    key={`sub-${clip.id}`}
                    style={{
                      left: `${left}px`,
                      width: `${width}px`,
                      backgroundColor: 'rgba(53, 201, 139, 0.25)',
                      borderColor: '#35C98B',
                    }}
                    className="absolute top-1 bottom-1 rounded border border-dashed px-1.5 flex items-center overflow-hidden"
                  >
                    <span className="text-[9px] text-[#35C98B] truncate font-medium">
                      {clip.textPreview || clip.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Scrubbing Playhead (Red Vertical Line) */}
            <div
              id="timeline-playhead"
              style={{ left: `${currentTime * pxPerSec}px` }}
              className="absolute top-0 bottom-0 w-[2px] bg-[#EF6461] pointer-events-none z-30 shadow-[0_0_8px_rgba(239,100,97,0.8)]"
            >
              {/* Playhead Handle Badge */}
              <div className="w-3 h-3 bg-[#EF6461] rotate-45 -translate-x-[5px] -translate-y-0.5 shadow-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
