import React from 'react';
import { Plus, BookOpen, CheckCircle2, AlertCircle, Sparkles, FileImage, Trash2 } from 'lucide-react';
import { MangaPage } from '../types';

interface PageRailProps {
  pages: MangaPage[];
  selectedPageId: string;
  onSelectPage: (id: string) => void;
  onAddNewPage: () => void;
  onDeletePage: (id: string) => void;
}

export const PageRail: React.FC<PageRailProps> = ({
  pages,
  selectedPageId,
  onSelectPage,
  onAddNewPage,
  onDeletePage,
}) => {
  return (
    <aside
      id="page-rail"
      className="w-56 bg-[#111419] border-r border-[rgba(255,255,255,0.08)] flex flex-col shrink-0 select-none z-20 h-full overflow-hidden"
    >
      {/* Rail Header */}
      <div className="p-3 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#F4F6F8]">
          <BookOpen className="w-3.5 h-3.5 text-[#7C5CFC]" />
          <span>Páginas do Mangá</span>
          <span className="text-[10px] text-[#9AA4B2] font-mono">({pages.length})</span>
        </div>
        <button
          id="add-page-rail-btn"
          onClick={onAddNewPage}
          className="p-1 rounded bg-[#15191F] hover:bg-[#1B2028] text-[#9AA4B2] hover:text-white border border-[rgba(255,255,255,0.08)] transition-colors"
          title="Nova página"
        >
          <Plus className="w-3.5 h-3.5 text-[#7C5CFC]" />
        </button>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        {pages.map((page) => {
          const isSelected = page.id === selectedPageId;
          const hasLowConfidence = page.bubbles.some((b) => b.confidence < 85 || !b.speakerId);

          return (
            <div
              key={page.id}
              id={`page-thumbnail-${page.id}`}
              onClick={() => onSelectPage(page.id)}
              className={`group relative rounded-lg p-1.5 transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[#15191F] border-[#7C5CFC] ring-1 ring-[#7C5CFC]/50 shadow-md'
                  : 'bg-[#0B0D10]/60 border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)] hover:bg-[#15191F]/50'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="aspect-[1/1.4] w-full rounded overflow-hidden bg-black relative border border-[rgba(255,255,255,0.05)]">
                <img
                  src={page.imageUrl}
                  alt={page.title}
                  className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />

                {/* Page Number Badge */}
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[10px] font-mono font-bold text-white border border-white/10">
                  #{page.pageNumber}
                </div>

                {/* Status Indicator Badge */}
                <div className="absolute top-1 right-1">
                  {hasLowConfidence ? (
                    <span
                      title="Requer revisão no Needs You"
                      className="w-4 h-4 rounded-full bg-[#F2B84B] text-black flex items-center justify-center font-bold text-[10px] shadow"
                    >
                      !
                    </span>
                  ) : (
                    <span
                      title="Balões e vozes prontos"
                      className="w-4 h-4 rounded-full bg-[#35C98B] text-black flex items-center justify-center font-bold text-[10px] shadow"
                    >
                      ✓
                    </span>
                  )}
                </div>

                {/* Bubble Count Overlay */}
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[9px] font-medium text-[#9AA4B2] flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#7C5CFC]" />
                  {page.bubbles.length} balões
                </div>
              </div>

              {/* Page Title & Meta */}
              <div className="mt-1.5 px-0.5 flex items-center justify-between">
                <p className="text-[11px] font-medium text-[#F4F6F8] truncate max-w-[140px]">
                  {page.title}
                </p>
                {pages.length > 1 && (
                  <button
                    id={`delete-page-${page.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePage(page.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-[#9AA4B2] hover:text-[#EF6461] transition-opacity"
                    title="Excluir página"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Drop / Add Page Action Tile */}
        <button
          id="page-rail-dropzone-btn"
          onClick={onAddNewPage}
          className="w-full py-4 px-2 rounded-lg border-2 border-dashed border-[rgba(255,255,255,0.08)] hover:border-[#7C5CFC]/50 hover:bg-[#7C5CFC]/5 flex flex-col items-center justify-center gap-1 text-[#9AA4B2] hover:text-white transition-all text-xs"
        >
          <FileImage className="w-4 h-4 text-[#7C5CFC]" />
          <span className="font-semibold text-[11px]">+ Adicionar Página</span>
          <span className="text-[9px] text-[#697386]">PNG, JPG ou WebP</span>
        </button>
      </div>

      {/* Rail Footer Information */}
      <div className="p-2.5 border-t border-[rgba(255,255,255,0.08)] bg-[#0B0D10]/50 text-[10px] text-[#697386] flex items-center justify-between font-mono">
        <span>Leitura: RTL (Mangá)</span>
        <span className="text-[#35C98B]">● Auto-Sync</span>
      </div>
    </aside>
  );
};
