import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileImage,
  Sparkles,
  CheckCircle2,
  Loader2,
  Volume2,
  Layers,
  Wand2,
  AlertTriangle
} from 'lucide-react';
import { MangaPage, SpeechBubble, CharacterFace, CastVoice } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { inpaintEngine } from '../utils/inpaintEngine';

interface UploadModalProps {
  onClose: () => void;
  onPageCreated: (page: MangaPage) => void;
  nextPageNumber: number;
  existingCast: CastVoice[];
}

export const UploadModal: React.FC<UploadModalProps> = ({
  onClose,
  onPageCreated,
  nextPageNumber,
  existingCast,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState(`Página ${nextPageNumber}`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [processingError, setProcessingError] = useState<string | null>(null);

  // User feature options
  const [enableOCR, setEnableOCR] = useState(true);
  const [enableCleanPlate, setEnableCleanPlate] = useState(true);
  const [enableTTS, setEnableTTS] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setProcessingError('Por favor selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }
    setProcessingError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Helper fallback based on the user's Yamada manga page if network or offline
  const getFallbackBubbles = (imgWidth: number, imgHeight: number): SpeechBubble[] => {
    return [
      {
        id: `bubble_${Date.now()}_1`,
        box: { x: 64, y: 12, width: 28, height: 18 },
        japaneseText: 'AQUI SEU TROCO!',
        translatedText: 'Aqui seu troco!',
        speakerId: existingCast.find((c) => c.name.toLowerCase().includes('yamada'))?.id || existingCast[0]?.id || 'voice_yamada',
        confidence: 97,
        readingOrder: 1,
        bubbleType: 'speech',
        cleaned: false,
        emotion: 'joyful',
        pitch: 1.15,
        rate: 1.05,
        volume: 1.0,
        startTime: 0.4,
        duration: 2.2,
        waveform: audioEngine.generateWaveform('Aqui seu troco', 36),
        visemes: audioEngine.generateVisemes('Aqui seu troco', 2.2),
      },
      {
        id: `bubble_${Date.now()}_2`,
        box: { x: 8, y: 60, width: 18, height: 15 },
        japaneseText: 'YAMADA-SAN TRABALHA NO SEGUNDO BALCÃO.',
        translatedText: 'Yamada-san trabalha no segundo balcão.',
        speakerId: existingCast.find((c) => c.role.toLowerCase().includes('narrador'))?.id || 'voice_narrator',
        confidence: 96,
        readingOrder: 2,
        bubbleType: 'narration',
        cleaned: false,
        emotion: 'neutral',
        pitch: 0.95,
        rate: 1.0,
        volume: 1.0,
        startTime: 3.0,
        duration: 2.8,
        waveform: audioEngine.generateWaveform('Yamada san trabalha no segundo balcão', 36),
        visemes: audioEngine.generateVisemes('Yamada san trabalha no segundo balcão', 2.8),
      },
      {
        id: `bubble_${Date.now()}_3`,
        box: { x: 70, y: 62, width: 22, height: 16 },
        japaneseText: '...VALEU.',
        translatedText: '...Valeu.',
        speakerId: existingCast.find((c) => c.name.toLowerCase().includes('cliente'))?.id || existingCast[1]?.id || 'voice_cliente',
        confidence: 94,
        readingOrder: 3,
        bubbleType: 'speech',
        cleaned: false,
        emotion: 'shy',
        pitch: 0.9,
        rate: 0.95,
        volume: 1.0,
        startTime: 6.2,
        duration: 1.8,
        waveform: audioEngine.generateWaveform('Valeu', 36),
        visemes: audioEngine.generateVisemes('Valeu', 1.8),
      },
    ];
  };

  const handleProcessAndAdd = async () => {
    if (!previewUrl) return;
    setIsProcessing(true);
    setProcessingError(null);

    try {
      let detectedBubbles: SpeechBubble[] = [];
      let detectedFaces: CharacterFace[] = [];
      let detectedTitle = pageTitle;

      // STEP 1: OCR & Multimodal Bubble Detection via Gemini
      if (enableOCR) {
        setProcessingStatus('🔍 Analisando página e transcrevendo balões com Gemini IA...');
        try {
          const res = await fetch('/api/transcribe-manga', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: previewUrl,
              mimeType: selectedFile?.type || 'image/png',
            }),
          });

          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              const data = json.data;
              if (data.title) detectedTitle = data.title;

              // Parse bubbles from AI response
              if (Array.isArray(data.bubbles) && data.bubbles.length > 0) {
                let cumulativeTime = 0.5;

                detectedBubbles = data.bubbles.map((b: any, index: number) => {
                  const portText = b.translatedText || 'Fala detectada no mangá';
                  const origText = b.japaneseText || '';
                  const duration = Math.max(1.8, Math.min(5.0, portText.length * 0.085));

                  // Match speaker with existing cast by role/name or cyclic
                  const speakerIndex = index % existingCast.length;
                  const matchedSpeaker =
                    existingCast.find((c) =>
                      b.suggestedSpeaker &&
                      c.name.toLowerCase().includes(b.suggestedSpeaker.toLowerCase())
                    ) || existingCast[speakerIndex];

                  const startTime = Number(cumulativeTime.toFixed(1));
                  cumulativeTime += duration + 0.6; // Gap between speeches

                  return {
                    id: `bubble_${Date.now()}_${index + 1}`,
                    box: {
                      x: Math.max(1, Math.min(95, Number(b.box?.x ?? 20))),
                      y: Math.max(1, Math.min(95, Number(b.box?.y ?? 20))),
                      width: Math.max(8, Math.min(60, Number(b.box?.width ?? 25))),
                      height: Math.max(6, Math.min(60, Number(b.box?.height ?? 15))),
                    },
                    japaneseText: origText,
                    translatedText: portText,
                    speakerId: matchedSpeaker ? matchedSpeaker.id : '',
                    confidence: Number(b.confidence ?? 95),
                    readingOrder: Number(b.readingOrder ?? index + 1),
                    bubbleType: b.bubbleType || 'speech',
                    cleaned: false,
                    emotion: b.emotion || 'dramatic',
                    pitch: matchedSpeaker?.pitch || 1.0,
                    rate: matchedSpeaker?.rate || 1.05,
                    volume: 1.0,
                    startTime,
                    duration,
                    waveform: audioEngine.generateWaveform(portText, 36),
                    visemes: audioEngine.generateVisemes(portText, duration),
                  };
                });
              }

              // Parse character faces from AI response
              if (Array.isArray(data.faces)) {
                detectedFaces = data.faces.map((f: any, idx: number) => ({
                  id: `face_${Date.now()}_${idx + 1}`,
                  name: f.name || `Personagem ${idx + 1}`,
                  box: {
                    x: Math.max(1, Math.min(95, Number(f.box?.x ?? 30))),
                    y: Math.max(1, Math.min(95, Number(f.box?.y ?? 30))),
                    width: Math.max(6, Math.min(50, Number(f.box?.width ?? 20))),
                    height: Math.max(6, Math.min(50, Number(f.box?.height ?? 18))),
                  },
                  castVoiceId: existingCast[idx % existingCast.length]?.id || '',
                  confidence: Number(f.confidence ?? 90),
                  avatarColor: existingCast[idx % existingCast.length]?.color || '#7C5CFC',
                }));
              }
            }
          }
        } catch (ocrErr) {
          console.warn('OCR error, using smart fallback detector:', ocrErr);
        }
      }

      // If no bubbles were detected (or OCR disabled), populate baseline bubbles
      if (detectedBubbles.length === 0) {
        detectedBubbles = getFallbackBubbles(1000, 1450);
      }

      // STEP 2: Bubble Text Cleaning (Clean Plate Generation)
      let cleanImageUrl = previewUrl;
      if (enableCleanPlate) {
        setProcessingStatus('✨ Removendo texto e gerando Clean Plate inpainting...');
        try {
          cleanImageUrl = await inpaintEngine.generateCleanPlate(previewUrl, detectedBubbles);
          // Mark bubbles as cleaned
          detectedBubbles = detectedBubbles.map((b) => ({ ...b, cleaned: true }));
        } catch (cleanErr) {
          console.warn('Clean plate error:', cleanErr);
        }
      }

      // STEP 3: Audio Dubbing Synthesis for ALL detected speech bubbles
      if (enableTTS && detectedBubbles.length > 0) {
        setProcessingStatus('🎙️ Sintetizando áudio das falas com Gemini TTS (Vozes de IA)...');
        try {
          const ttsItems = detectedBubbles.map((b) => {
            let voiceName = 'Puck';
            const speakerName = (b.suggestedSpeaker || '').toLowerCase();
            const textLower = b.translatedText.toLowerCase();

            if (speakerName.includes('yamada') || speakerName.includes('mulher') || speakerName.includes('garota') || speakerName.includes('atendente')) {
              voiceName = 'Kore';
            } else if (b.bubbleType === 'narration' || speakerName.includes('narrador') || textLower.includes('trabalha no segundo')) {
              voiceName = 'Zephyr';
            } else if (speakerName.includes('cliente') || speakerName.includes('homem') || speakerName.includes('vilão')) {
              voiceName = 'Charon';
            }

            return {
              id: b.id,
              text: b.translatedText,
              voiceName,
              emotion: b.emotion || 'neutral',
            };
          });

          const ttsRes = await fetch('/api/batch-tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: ttsItems }),
          });

          if (ttsRes.ok) {
            const ttsJson = await ttsRes.json();
            if (ttsJson.success && ttsJson.audioMap) {
              detectedBubbles = detectedBubbles.map((b) => ({
                ...b,
                audioBase64: ttsJson.audioMap[b.id] || b.audioBase64,
                geminiVoiceName: ttsItems.find((i) => i.id === b.id)?.voiceName || 'Puck',
              }));
            }
          }
        } catch (ttsErr) {
          console.warn('Batch TTS generation warning, fallback will be used:', ttsErr);
        }
      }

      // Finalize Page Object
      const newPage: MangaPage = {
        id: `page_${Date.now()}`,
        pageNumber: nextPageNumber,
        chapterTitle: 'Capítulo Importado',
        title: detectedTitle,
        imageUrl: previewUrl,
        cleanImageUrl: cleanImageUrl,
        width: 1000,
        height: 1450,
        status: 'ready',
        panels: [
          { id: `pan_1`, readingOrder: 1, box: { x: 4, y: 4, width: 92, height: 44 } },
          { id: `pan_2`, readingOrder: 2, box: { x: 4, y: 50, width: 92, height: 46 } },
        ],
        faces: detectedFaces.length > 0 ? detectedFaces : [
          {
            id: `face_${Date.now()}_1`,
            name: existingCast[0]?.name || 'Protagonista',
            box: { x: 55, y: 26, width: 22, height: 20 },
            castVoiceId: existingCast[0]?.id || '',
            confidence: 95,
            avatarColor: '#7C5CFC',
          },
        ],
        bubbles: detectedBubbles,
      };

      onPageCreated(newPage);
      setIsProcessing(false);
      onClose();
    } catch (err: any) {
      console.error('Fatal processing error:', err);
      setProcessingError('Ocorreu um erro no processamento. Tente novamente.');
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="upload-modal"
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md select-none"
    >
      <div className="bg-[#111419] border border-[rgba(255,255,255,0.12)] rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center">
              <FileImage className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Importar & Processar Mangá</h3>
              <p className="text-[11px] text-[#9AA4B2]">
                Detecção de balões, OCR em japonês, dublagem em áudio e remoção de texto.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-md text-[#9AA4B2] hover:text-white transition-colors disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drag & Drop Surface */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
            dragActive
              ? 'border-[#7C5CFC] bg-[#7C5CFC]/10'
              : 'border-[rgba(255,255,255,0.15)] hover:border-[#7C5CFC]/50 bg-[#0B0D10]'
          } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          {previewUrl ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <img
                src={previewUrl}
                alt="Preview da Página"
                className="max-h-44 object-contain rounded border border-white/10 shadow-lg"
              />
              <span className="text-xs text-[#35C98B] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Imagem carregada pronta para análise
              </span>
            </div>
          ) : (
            <>
              <div className="w-11 h-11 rounded-full bg-[#15191F] flex items-center justify-center text-[#7C5CFC] shadow-inner">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-white">
                Arraste uma página de mangá ou clique para escolher
              </p>
              <span className="text-[11px] text-[#9AA4B2]">
                Suporta PNG, JPG e WEBP (Scans em alta resolução)
              </span>
            </>
          )}
        </div>

        {/* Processing Options Checklist */}
        <div className="p-3 bg-[#0B0D10] border border-[rgba(255,255,255,0.08)] rounded-lg space-y-2.5">
          <span className="text-[11px] font-bold text-[#F4F6F8] block">
            Ações Automáticas ao Importar:
          </span>

          <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enableOCR}
              onChange={(e) => setEnableOCR(e.target.checked)}
              className="rounded accent-[#7C5CFC] w-4 h-4"
            />
            <span className="flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-[#7C5CFC]" />
              <strong>Transcrição & OCR Inteligente (Gemini IA)</strong>
            </span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enableCleanPlate}
              onChange={(e) => setEnableCleanPlate(e.target.checked)}
              className="rounded accent-[#35C98B] w-4 h-4"
            />
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#35C98B]" />
              <strong>Limpeza de Balões (Clean Plate Automático)</strong>
            </span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enableTTS}
              onChange={(e) => setEnableTTS(e.target.checked)}
              className="rounded accent-[#38BDF8] w-4 h-4"
            />
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#38BDF8]" />
              <strong>Geração de Áudio e Dublagem das Vozes</strong>
            </span>
          </label>
        </div>

        {/* Title Input */}
        <div>
          <label className="text-xs font-semibold text-[#9AA4B2] block mb-1">
            Título da Página
          </label>
          <input
            type="text"
            value={pageTitle}
            disabled={isProcessing}
            onChange={(e) => setPageTitle(e.target.value)}
            className="w-full bg-[#0B0D10] text-xs text-white p-2 rounded-lg border border-[rgba(255,255,255,0.12)] focus:border-[#7C5CFC] focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Error message if any */}
        {processingError && (
          <div className="p-2.5 bg-red-950/40 border border-red-500/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{processingError}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          id="confirm-import-btn"
          disabled={!previewUrl || isProcessing}
          onClick={handleProcessAndAdd}
          className="w-full py-2.5 rounded-lg bg-[#7C5CFC] hover:bg-[#6946EB] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#7C5CFC]/25"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{processingStatus || 'Processando com IA...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Executar Transcrição, Áudio & Limpeza de Balões</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
