import React, { useState } from 'react';
import {
  SpeechBubble,
  CastVoice,
  SoundEffectItem,
  NeedsYouItem,
  BubbleType,
  Emotion
} from '../types';
import { SFX_CATALOG } from '../data/sfxCatalog';
import {
  Volume2,
  AlertCircle,
  Users,
  Sparkles,
  Sliders,
  CheckCircle2,
  Play,
  Download,
  FileText,
  Music,
  Plus,
  ArrowRight,
  Film
} from 'lucide-react';

interface InspectorProps {
  selectedBubble: SpeechBubble | null;
  onUpdateBubble: (updated: Partial<SpeechBubble>) => void;
  cast: CastVoice[];
  onAddCastMember: (newCast: CastVoice) => void;
  needsYouItems: NeedsYouItem[];
  onResolveNeedsYou: (itemId: string, assignedSpeakerId?: string) => void;
  onResolveAllNeedsYou: () => void;
  onPlaySpeech: (bubble: SpeechBubble) => void;
  onGenerateTTS?: (bubble: SpeechBubble, voiceName: string) => Promise<void>;
  onCleanCurrentBubble?: (bubble: SpeechBubble) => void;
  onPlaySfx: (sfx: SoundEffectItem) => void;
  onInsertSfxToTimeline: (sfx: SoundEffectItem) => void;
  activeTab: 'element' | 'needsYou' | 'cast' | 'sfx' | 'export';
  setActiveTab: (tab: 'element' | 'needsYou' | 'cast' | 'sfx' | 'export') => void;
  onExportSrt: () => void;
  onExportJson: () => void;
  onOpenMotionPlayer: () => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  selectedBubble,
  onUpdateBubble,
  cast,
  onAddCastMember,
  needsYouItems,
  onResolveNeedsYou,
  onResolveAllNeedsYou,
  onPlaySpeech,
  onGenerateTTS,
  onCleanCurrentBubble,
  onPlaySfx,
  onInsertSfxToTimeline,
  activeTab,
  setActiveTab,
  onExportSrt,
  onExportJson,
  onOpenMotionPlayer,
}) => {
  const [newCharName, setNewCharName] = useState('');
  const [newCharRole, setNewCharRole] = useState('');
  const [selectedTtsVoice, setSelectedTtsVoice] = useState('Puck');
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);

  const handleGenerateTtsClick = async () => {
    if (!selectedBubble || !onGenerateTTS) return;
    setIsGeneratingTTS(true);
    try {
      await onGenerateTTS(selectedBubble, selectedTtsVoice);
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  const handleCreateCast = () => {
    if (!newCharName.trim()) return;
    const colors = ['#7C5CFC', '#35C98B', '#EF6461', '#F2B84B', '#38BDF8', '#F472B6'];
    const newMember: CastVoice = {
      id: `voice_${Date.now()}`,
      name: newCharName.trim(),
      role: newCharRole.trim() || 'Personagem Coadjuvante',
      color: colors[cast.length % colors.length],
      avatarIcon: '🎭',
      gender: 'male',
      voicePreset: 'Kokoro-pt-hero',
      pitch: 1.0,
      rate: 1.05,
      emotion: 'neutral',
      assignedBubblesCount: 0,
    };
    onAddCastMember(newMember);
    setNewCharName('');
    setNewCharRole('');
  };

  return (
    <aside
      id="inspector-panel"
      className="w-80 bg-[#111419] border-l border-[rgba(255,255,255,0.08)] flex flex-col shrink-0 select-none z-20 h-full overflow-hidden"
    >
      {/* Tab Navigation Header */}
      <div className="bg-[#0B0D10] border-b border-[rgba(255,255,255,0.08)] px-2 pt-2 flex items-center gap-1">
        <button
          id="tab-element-btn"
          onClick={() => setActiveTab('element')}
          className={`flex-1 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'element'
              ? 'border-[#7C5CFC] text-white bg-[#15191F]'
              : 'border-transparent text-[#9AA4B2] hover:text-white'
          }`}
          title="Inspetor do Balão Selecionado"
        >
          <Sliders className="w-3.5 h-3.5 text-[#7C5CFC]" />
          <span>Balão</span>
        </button>

        <button
          id="tab-needs-you-btn"
          onClick={() => setActiveTab('needsYou')}
          className={`flex-1 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center justify-center gap-1.5 border-b-2 relative ${
            activeTab === 'needsYou'
              ? 'border-[#F2B84B] text-white bg-[#15191F]'
              : 'border-transparent text-[#9AA4B2] hover:text-white'
          }`}
          title="Fila de Revisão: Baixa Confiança ou Sem Voz"
        >
          <AlertCircle className="w-3.5 h-3.5 text-[#F2B84B]" />
          <span>Needs You</span>
          {needsYouItems.length > 0 && (
            <span className="px-1 py-0.2 rounded-full bg-[#F2B84B] text-black text-[9px] font-extrabold">
              {needsYouItems.length}
            </span>
          )}
        </button>

        <button
          id="tab-cast-btn"
          onClick={() => setActiveTab('cast')}
          className={`flex-1 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'cast'
              ? 'border-[#35C98B] text-white bg-[#15191F]'
              : 'border-transparent text-[#9AA4B2] hover:text-white'
          }`}
          title="Elenco e Atribuição de Vozes"
        >
          <Users className="w-3.5 h-3.5 text-[#35C98B]" />
          <span>Elenco</span>
        </button>

        <button
          id="tab-sfx-btn"
          onClick={() => setActiveTab('sfx')}
          className={`flex-1 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'sfx'
              ? 'border-[#38BDF8] text-white bg-[#15191F]'
              : 'border-transparent text-[#9AA4B2] hover:text-white'
          }`}
          title="Biblioteca de Efeitos Sonoros"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>SFX</span>
        </button>

        <button
          id="tab-export-btn"
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'export'
              ? 'border-white text-white bg-[#15191F]'
              : 'border-transparent text-[#9AA4B2] hover:text-white'
          }`}
          title="Exportar Vídeo, SRT e Áudio"
        >
          <Download className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* ================= TAB 1: ELEMENT INSPECTOR ================= */}
        {activeTab === 'element' && (
          <div className="space-y-3.5">
            {selectedBubble ? (
              <>
                {/* Header: Reading Order & Confidence */}
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#7C5CFC] text-white font-mono text-xs font-bold flex items-center justify-center">
                      #{selectedBubble.readingOrder}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Balão de Diálogo</h4>
                      <p className="text-[10px] text-[#9AA4B2] capitalize">
                        Tipo: {selectedBubble.bubbleType}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        selectedBubble.confidence >= 85
                          ? 'bg-[#35C98B]/20 text-[#35C98B] border border-[#35C98B]/30'
                          : 'bg-[#F2B84B]/20 text-[#F2B84B] border border-[#F2B84B]/30'
                      }`}
                    >
                      OCR {selectedBubble.confidence}%
                    </span>
                  </div>
                </div>

                {/* Speaker Selector */}
                <div>
                  <label className="text-[11px] font-semibold text-[#9AA4B2] block mb-1">
                    Voz do Personagem (Ator)
                  </label>
                  <select
                    id="select-speaker-dropdown"
                    value={selectedBubble.speakerId}
                    onChange={(e) => onUpdateBubble({ speakerId: e.target.value })}
                    className="w-full bg-[#0B0D10] text-[#F4F6F8] text-xs rounded-md border border-[rgba(255,255,255,0.12)] p-2 focus:border-[#7C5CFC] focus:outline-none"
                  >
                    <option value="">-- Selecione a voz do personagem --</option>
                    {cast.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.avatarIcon} {c.name} ({c.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Portuguese Dubbing Text */}
                <div>
                  <label className="text-[11px] font-semibold text-[#9AA4B2] block mb-1">
                    Texto Dublado (Português)
                  </label>
                  <textarea
                    id="bubble-pt-text-input"
                    rows={3}
                    value={selectedBubble.translatedText}
                    onChange={(e) => onUpdateBubble({ translatedText: e.target.value })}
                    className="w-full bg-[#0B0D10] text-white text-xs rounded-md border border-[rgba(255,255,255,0.12)] p-2 focus:border-[#7C5CFC] focus:outline-none resize-none leading-relaxed"
                    placeholder="Digite a fala adaptada..."
                  />
                </div>

                {/* Original Japanese OCR */}
                <div>
                  <label className="text-[11px] font-semibold text-[#697386] block mb-1">
                    Transcrição Original (Japonês OCR)
                  </label>
                  <input
                    type="text"
                    value={selectedBubble.japaneseText}
                    onChange={(e) => onUpdateBubble({ japaneseText: e.target.value })}
                    className="w-full bg-[#0B0D10]/60 text-[#9AA4B2] text-xs font-mono rounded-md border border-[rgba(255,255,255,0.08)] p-2 focus:border-[#7C5CFC] focus:outline-none"
                  />
                </div>

                {/* Bubble Type & Emotion */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-[#9AA4B2] block mb-1">
                      Estilo do Balão
                    </label>
                    <select
                      value={selectedBubble.bubbleType}
                      onChange={(e) => onUpdateBubble({ bubbleType: e.target.value as BubbleType })}
                      className="w-full bg-[#0B0D10] text-xs rounded border border-[rgba(255,255,255,0.12)] p-1.5 focus:border-[#7C5CFC]"
                    >
                      <option value="speech">Fala Normal</option>
                      <option value="shout">Grito / Shonen</option>
                      <option value="thought">Pensamento</option>
                      <option value="narration">Narração</option>
                      <option value="whisper">Sussurro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-[#9AA4B2] block mb-1">
                      Entonação / Emoção
                    </label>
                    <select
                      value={selectedBubble.emotion}
                      onChange={(e) => onUpdateBubble({ emotion: e.target.value as Emotion })}
                      className="w-full bg-[#0B0D10] text-xs rounded border border-[rgba(255,255,255,0.12)] p-1.5 focus:border-[#7C5CFC]"
                    >
                      <option value="neutral">Neutro</option>
                      <option value="dramatic">Dramático</option>
                      <option value="angry">Fúria / Agressivo</option>
                      <option value="surprised">Surpreso</option>
                      <option value="sad">Triste / Melancólico</option>
                    </select>
                  </div>
                </div>

                {/* Voice Modulation Sliders */}
                <div className="p-2.5 rounded-lg bg-[#0B0D10] border border-[rgba(255,255,255,0.08)] space-y-2">
                  <span className="text-[10px] font-bold text-[#F4F6F8] block">
                    Modulação Sonora (Kokoro / TTS)
                  </span>

                  <div className="flex items-center justify-between text-[11px] text-[#9AA4B2]">
                    <span>Tom (Pitch):</span>
                    <span className="font-mono text-white">{selectedBubble.pitch.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.5"
                    step="0.05"
                    value={selectedBubble.pitch}
                    onChange={(e) => onUpdateBubble({ pitch: parseFloat(e.target.value) })}
                    className="w-full accent-[#7C5CFC] h-1.5 bg-[#1B2028] rounded cursor-pointer"
                  />

                  <div className="flex items-center justify-between text-[11px] text-[#9AA4B2]">
                    <span>Velocidade (Rate):</span>
                    <span className="font-mono text-white">{selectedBubble.rate.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.4"
                    step="0.05"
                    value={selectedBubble.rate}
                    onChange={(e) => onUpdateBubble({ rate: parseFloat(e.target.value) })}
                    className="w-full accent-[#7C5CFC] h-1.5 bg-[#1B2028] rounded cursor-pointer"
                  />
                </div>

                {/* Gemini AI TTS Voice Generator */}
                <div className="p-2.5 rounded-lg bg-[#0B0D10] border border-[rgba(255,255,255,0.08)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#F4F6F8] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#7C5CFC]" />
                      <span>Dublagem com Gemini TTS</span>
                    </span>
                    {selectedBubble.audioBase64 ? (
                      <span className="text-[9px] font-semibold text-[#35C98B] bg-[#35C98B]/15 px-1.5 py-0.5 rounded border border-[#35C98B]/30 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Áudio Gerado
                      </span>
                    ) : (
                      <span className="text-[9px] text-[#9AA4B2] font-mono">Web Audio / Síntese</span>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] text-[#9AA4B2] block mb-1">
                      Voz de IA (Estilo):
                    </label>
                    <select
                      value={selectedTtsVoice}
                      onChange={(e) => setSelectedTtsVoice(e.target.value)}
                      className="w-full bg-[#15191F] text-xs rounded border border-[rgba(255,255,255,0.12)] p-1.5 focus:border-[#7C5CFC]"
                    >
                      <option value="Puck">Puck (Jovem / Protagonista Shonen)</option>
                      <option value="Charon">Charon (Grave / Vilão / Rival)</option>
                      <option value="Kore">Kore (Feminina / Doce / Heroína)</option>
                      <option value="Fenrir">Fenrir (Agressivo / Fera / Shonen Intenso)</option>
                      <option value="Zephyr">Zephyr (Calmo / Narrador / Sensei)</option>
                    </select>
                  </div>

                  <button
                    id="generate-bubble-tts-btn"
                    disabled={isGeneratingTTS || !selectedBubble.translatedText}
                    onClick={handleGenerateTtsClick}
                    className="w-full py-1.5 px-2.5 rounded bg-[#1B2028] hover:bg-[#7C5CFC]/30 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[rgba(255,255,255,0.12)] disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#7C5CFC]" />
                    <span>{isGeneratingTTS ? 'Sintetizando com Gemini TTS...' : 'Gerar Áudio com Gemini TTS'}</span>
                  </button>
                </div>

                {/* Test Speech Button */}
                <button
                  id="test-speech-btn"
                  onClick={() => onPlaySpeech(selectedBubble)}
                  className="w-full py-2.5 px-3 rounded-lg bg-[#7C5CFC] hover:bg-[#6946EB] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#7C5CFC]/20"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Ouvir Dublagem & Lip Sync</span>
                </button>

                {/* Clean Single Bubble Plate Button */}
                {onCleanCurrentBubble && (
                  <button
                    id="clean-single-bubble-btn"
                    onClick={() => onCleanCurrentBubble(selectedBubble)}
                    className="w-full py-2 px-3 rounded-lg bg-[#15191F] hover:bg-[#1C222B] text-[#35C98B] border border-[#35C98B]/30 hover:border-[#35C98B] text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Limpar Texto Deste Balão</span>
                  </button>
                )}
              </>
            ) : (
              <div className="py-12 px-4 text-center">
                <span className="w-10 h-10 rounded-full bg-[#15191F] flex items-center justify-center text-[#9AA4B2] mx-auto mb-2 border border-[rgba(255,255,255,0.08)]">
                  <Sliders className="w-5 h-5 text-[#7C5CFC]" />
                </span>
                <h4 className="text-xs font-bold text-white">Nenhum balão selecionado</h4>
                <p className="text-[11px] text-[#9AA4B2] mt-1">
                  Clique em qualquer balão no mangá ou na timeline para editar texto, atribuir dublador e ajustar a voz.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: NEEDS YOU (REVIEW QUEUE) ================= */}
        {activeTab === 'needsYou' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
              <div>
                <h4 className="text-xs font-bold text-[#F2B84B] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Fila de Revisão</span>
                </h4>
                <p className="text-[10px] text-[#9AA4B2]">
                  {needsYouItems.length} itens requerem sua confirmação
                </p>
              </div>

              {needsYouItems.length > 0 && (
                <button
                  id="approve-all-btn"
                  onClick={onResolveAllNeedsYou}
                  className="px-2 py-1 rounded text-[10px] font-semibold bg-[#35C98B]/20 text-[#35C98B] border border-[#35C98B]/30 hover:bg-[#35C98B]/30 transition-colors"
                >
                  Aprovar Todos
                </button>
              )}
            </div>

            {needsYouItems.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <span className="w-10 h-10 rounded-full bg-[#35C98B]/20 flex items-center justify-center text-[#35C98B] mx-auto mb-2 border border-[#35C98B]/30">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <h4 className="text-xs font-bold text-white">Tudo Revisado!</h4>
                <p className="text-[11px] text-[#9AA4B2] mt-1">
                  Todos os balões possuem transcrição confiável e vozes atribuídas.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {needsYouItems.map((item) => (
                  <div
                    key={item.id}
                    id={`needs-item-${item.id}`}
                    className="p-2.5 rounded-lg bg-[#0B0D10] border border-[#F2B84B]/30 space-y-2 hover:border-[#F2B84B]/60 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-[#F4F6F8]">
                        {item.title}
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F2B84B]/20 text-[#F2B84B]">
                        {item.confidence}%
                      </span>
                    </div>

                    <p className="text-[11px] text-[#9AA4B2] leading-snug">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => onResolveNeedsYou(item.id)}
                        className="px-2.5 py-1 rounded text-[10px] font-semibold bg-[#35C98B] hover:bg-[#35C98B]/90 text-black transition-colors"
                      >
                        Aprovar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: CAST & VOICES ================= */}
        {activeTab === 'cast' && (
          <div className="space-y-3.5">
            <div className="pb-2 border-b border-[rgba(255,255,255,0.08)]">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#35C98B]" />
                <span>Elenco de Dublagem</span>
              </h4>
              <p className="text-[10px] text-[#9AA4B2]">
                Modelos de voz e configurações de personalidade
              </p>
            </div>

            {/* Cast Members List */}
            <div className="space-y-2">
              {cast.map((member) => (
                <div
                  key={member.id}
                  id={`cast-card-${member.id}`}
                  className="p-2.5 rounded-lg bg-[#0B0D10] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)] transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shadow"
                      style={{ backgroundColor: `${member.color}33`, borderColor: member.color }}
                    >
                      {member.avatarIcon}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{member.name}</span>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: member.color }}
                        />
                      </h5>
                      <p className="text-[10px] text-[#9AA4B2]">{member.role}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const bubble = {
                        id: `test_${member.id}`,
                        box: { x: 0, y: 0, width: 0, height: 0 },
                        japaneseText: '',
                        translatedText: member.sampleText || `Olá, eu sou a voz de ${member.name}. Muito prazer!`,
                        speakerId: member.id,
                        confidence: 100,
                        readingOrder: 1,
                        bubbleType: 'speech' as BubbleType,
                        cleaned: true,
                        emotion: member.emotion,
                        pitch: member.pitch,
                        rate: member.rate,
                        volume: 1.0,
                        startTime: 0,
                        duration: 2.5,
                        waveform: [],
                        visemes: [],
                        audioBase64: member.sampleAudioBase64,
                      };
                      onPlaySpeech(bubble);
                    }}
                    className="p-1.5 rounded-md bg-[#15191F] hover:bg-[#1B2028] text-[#9AA4B2] hover:text-white border border-[rgba(255,255,255,0.08)] transition-colors"
                    title="Testar voz do ator"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#35C98B]" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Actor Form */}
            <div className="p-2.5 rounded-lg bg-[#0B0D10] border border-[rgba(255,255,255,0.08)] space-y-2">
              <span className="text-[10px] font-bold text-white block">
                + Adicionar Ator / Personagem
              </span>
              <input
                type="text"
                placeholder="Nome (ex: Shinigami Rei)"
                value={newCharName}
                onChange={(e) => setNewCharName(e.target.value)}
                className="w-full bg-[#15191F] text-xs text-white p-1.5 rounded border border-white/10"
              />
              <input
                type="text"
                placeholder="Papel (ex: Mestre de Dojo)"
                value={newCharRole}
                onChange={(e) => setNewCharRole(e.target.value)}
                className="w-full bg-[#15191F] text-xs text-white p-1.5 rounded border border-white/10"
              />
              <button
                onClick={handleCreateCast}
                className="w-full py-1.5 rounded bg-[#35C98B] hover:bg-[#35C98B]/90 text-black text-xs font-bold transition-colors"
              >
                Cadastrar Personagem
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SFX LIBRARY ================= */}
        {activeTab === 'sfx' && (
          <div className="space-y-3">
            <div className="pb-2 border-b border-[rgba(255,255,255,0.08)]">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#F2B84B]" />
                <span>Biblioteca de SFX</span>
              </h4>
              <p className="text-[10px] text-[#9AA4B2]">
                Efeitos sonoros CC0 para impacto, cortes e ambientação
              </p>
            </div>

            <div className="space-y-2">
              {SFX_CATALOG.map((sfx) => (
                <div
                  key={sfx.id}
                  id={`sfx-card-${sfx.id}`}
                  className="p-2.5 rounded-lg bg-[#0B0D10] border border-[rgba(255,255,255,0.08)] hover:border-[#F2B84B]/40 transition-all flex items-center justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-[#F4F6F8] flex items-center gap-1.5">
                      <span>{sfx.name}</span>
                      <span className="text-[9px] font-mono text-[#F2B84B]">
                        {sfx.duration}s
                      </span>
                    </h5>
                    <p className="text-[10px] text-[#9AA4B2] leading-snug">
                      {sfx.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onPlaySfx(sfx)}
                      className="p-1.5 rounded bg-[#15191F] hover:bg-[#1B2028] text-white border border-[rgba(255,255,255,0.08)] transition-colors"
                      title="Ouvir som"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#F2B84B]" />
                    </button>
                    <button
                      onClick={() => onInsertSfxToTimeline(sfx)}
                      className="px-2 py-1 rounded bg-[#F2B84B] hover:bg-[#F2B84B]/90 text-black text-[10px] font-extrabold transition-colors"
                      title="Inserir na timeline"
                    >
                      + Track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: EXPORT & PLAYER ================= */}
        {activeTab === 'export' && (
          <div className="space-y-3.5">
            <div className="pb-2 border-b border-[rgba(255,255,255,0.08)]">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-[#7C5CFC]" />
                <span>Exportar Projeto</span>
              </h4>
              <p className="text-[10px] text-[#9AA4B2]">
                Vídeo Motion Comic, legendas sincronizadas e áudio
              </p>
            </div>

            {/* Motion Comic Launch Card */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-[#7C5CFC]/20 to-[#15191F] border border-[#7C5CFC]/40 space-y-2">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#7C5CFC]" />
                <h5 className="text-xs font-bold text-white">Motion Comic 1080p</h5>
              </div>
              <p className="text-[11px] text-[#9AA4B2]">
                Player cinematográfico com câmera panorâmica, zoom nos quadros, sincronia labial e áudio multicanal.
              </p>
              <button
                id="open-motion-modal-btn"
                onClick={onOpenMotionPlayer}
                className="w-full py-2 px-3 rounded-md bg-[#7C5CFC] hover:bg-[#6946EB] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#7C5CFC]/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Assistir Motion Comic</span>
              </button>
            </div>

            {/* Subtitles SRT Export */}
            <div className="p-2.5 rounded-lg bg-[#0B0D10] border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#35C98B]" />
                  <span>Legendas (.SRT)</span>
                </h5>
                <p className="text-[10px] text-[#9AA4B2]">
                  Timestamps precisos para Premiere, DaVinci e YouTube
                </p>
              </div>
              <button
                id="export-srt-btn"
                onClick={onExportSrt}
                className="px-2.5 py-1.5 rounded bg-[#15191F] hover:bg-[#1B2028] text-white text-xs font-semibold border border-[rgba(255,255,255,0.12)] transition-colors"
              >
                Baixar SRT
              </button>
            </div>

            {/* JSON Project Backup */}
            <div className="p-2.5 rounded-lg bg-[#0B0D10] border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Backup do Projeto (.JSON)</span>
                </h5>
                <p className="text-[10px] text-[#9AA4B2]">
                  Salva balões, caixas, elenco e timeline
                </p>
              </div>
              <button
                id="export-json-btn"
                onClick={onExportJson}
                className="px-2.5 py-1.5 rounded bg-[#15191F] hover:bg-[#1B2028] text-white text-xs font-semibold border border-[rgba(255,255,255,0.12)] transition-colors"
              >
                Salvar JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
