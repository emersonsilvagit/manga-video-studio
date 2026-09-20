import React from 'react';
import {
  Play,
  Pause,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Film,
  Download,
  Upload,
  AlertCircle,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { MangaPage } from '../types';

interface StudioHeaderProps {
  currentPage: MangaPage;
  pages: MangaPage[];
  activeView: 'editor' | 'compare' | 'player';
  setActiveView: (view: 'editor' | 'compare' | 'player') => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  needsYouCount: number;
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onCleanPlate: () => void;
  onAutoDetect: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onResetZoom: () => void;
  onSelectNeedsYouTab: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  currentPage,
  activeView,
  setActiveView,
  isPlaying,
  onTogglePlay,
  needsYouCount,
  onOpenUpload,
  onOpenExport,
  onCleanPlate,
  onAutoDetect,
  zoom,
  onZoomChange,
  onResetZoom,
  onSelectNeedsYouTab,
}) => {
  return (
    <header
      id="studio-header"
      className="h-14 bg-[#111419] border-b border-[rgba(255,255,255,0.08)] px-4 flex items-center justify-between select-none z-30 shrink-0"
    >
      {/* Left: Branding & Chapter Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#7C5CFC] flex items-center justify-center font-black text-white text-sm shadow-md shadow-[#7C5CFC]/20">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#F4F6F8] tracking-tight">
                Manga Voice Studio
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#7C5CFC]/20 text-[#7C5CFC] border border-[#7C5CFC]/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-[#9AA4B2] truncate max-w-[200px]">
              {currentPage.chapterTitle} • Pág {currentPage.pageNumber}
            </p>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-[rgba(255,255,255,0.08)] mx-1" />

        {/* View mode switcher */}
        <div className="bg-[#0B0D10] p-0.5 rounded-lg border border-[rgba(255,255,255,0.08)] flex items-center">
          <button
            id="view-editor-btn"
            onClick={() => setActiveView('editor')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeView === 'editor'
                ? 'bg-[#15191F] text-white shadow-sm font-semibold'
                : 'text-[#9AA4B2] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#7C5CFC]" />
            Editor
          </button>
          <button
            id="view-compare-btn"
            onClick={() => setActiveView('compare')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeView === 'compare'
                ? 'bg-[#15191F] text-white shadow-sm font-semibold'
                : 'text-[#9AA4B2] hover:text-white'
            }`}
            title="Comparador Antes / Depois (Original vs Balões Limpos)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#35C98B]" />
            Antes / Depois
          </button>
          <button
            id="view-player-btn"
            onClick={() => setActiveView('player')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeView === 'player'
                ? 'bg-[#15191F] text-white shadow-sm font-semibold'
                : 'text-[#9AA4B2] hover:text-white'
            }`}
            title="Player de Motion Manga com Câmera e Vozes"
          >
            <Film className="w-3.5 h-3.5 text-[#F2B84B]" />
            Motion Comic
          </button>
        </div>
      </div>

      {/* Center: Playback & Quick Automation */}
      <div className="flex items-center gap-2">
        <button
          id="global-play-btn"
          onClick={onTogglePlay}
          className={`px-4 py-1.5 rounded-lg font-medium text-xs flex items-center gap-2 transition-all shadow-md ${
            isPlaying
              ? 'bg-[#EF6461] hover:bg-[#EF6461]/90 text-white'
              : 'bg-[#7C5CFC] hover:bg-[#6946EB] text-white shadow-[#7C5CFC]/20'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              Pausar Dublagem
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Executar Página
            </>
          )}
        </button>

        <button
          id="auto-detect-btn"
          onClick={onAutoDetect}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#15191F] hover:bg-[#1B2028] text-[#F4F6F8] border border-[rgba(255,255,255,0.08)] flex items-center gap-1.5 transition-colors"
          title="Detectar balões e personagens com IA"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#7C5CFC]" />
          Auto-Detectar OCR
        </button>

        <button
          id="clean-plate-btn"
          onClick={onCleanPlate}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#15191F] hover:bg-[#1B2028] text-[#F4F6F8] border border-[rgba(255,255,255,0.08)] flex items-center gap-1.5 transition-colors"
          title="Remover texto dos balões via Inpainting (Clean Plate)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#35C98B]" />
          Limpar Balões
        </button>
      </div>

      {/* Right: Needs You, Zoom, Import & Export */}
      <div className="flex items-center gap-2">
        {/* Needs You review button */}
        {needsYouCount > 0 && (
          <button
            id="needs-you-btn"
            onClick={onSelectNeedsYouTab}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F2B84B]/15 hover:bg-[#F2B84B]/25 text-[#F2B84B] border border-[#F2B84B]/30 flex items-center gap-1.5 transition-all animate-pulse"
            title="Balões com confiança baixa ou personagem não atribuído"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Needs You</span>
            <span className="w-4 h-4 rounded-full bg-[#F2B84B] text-black text-[10px] font-extrabold flex items-center justify-center">
              {needsYouCount}
            </span>
          </button>
        )}

        {/* Zoom controls */}
        <div className="flex items-center bg-[#0B0D10] rounded-lg border border-[rgba(255,255,255,0.08)] px-1 py-0.5">
          <button
            id="zoom-out-btn"
            onClick={() => onZoomChange(Math.max(0.4, zoom - 0.15))}
            className="p-1 text-[#9AA4B2] hover:text-white rounded hover:bg-[#15191F] transition-colors"
            title="Reduzir zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            id="zoom-reset-btn"
            onClick={onResetZoom}
            className="px-1.5 text-[11px] font-mono text-[#9AA4B2] hover:text-white"
            title="Ajustar à tela"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            id="zoom-in-btn"
            onClick={() => onZoomChange(Math.min(2.5, zoom + 0.15))}
            className="p-1 text-[#9AA4B2] hover:text-white rounded hover:bg-[#15191F] transition-colors"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          id="upload-page-btn"
          onClick={onOpenUpload}
          className="p-1.5 text-[#9AA4B2] hover:text-white bg-[#15191F] hover:bg-[#1B2028] border border-[rgba(255,255,255,0.08)] rounded-lg transition-colors"
          title="Importar imagem ou capítulo de mangá"
        >
          <Upload className="w-4 h-4" />
        </button>

        <button
          id="export-modal-btn"
          onClick={onOpenExport}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#15191F] hover:bg-[#1B2028] text-white border border-[#7C5CFC]/40 flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-[#7C5CFC]" />
          Exportar
        </button>
      </div>
    </header>
  );
};
