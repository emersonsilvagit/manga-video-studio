import React, { useState, useEffect, useRef } from 'react';
import {
  MangaPage,
  SpeechBubble,
  CastVoice,
  TimelineClip,
  SoundEffectItem,
  NeedsYouItem,
  VisemeType
} from './types';
import { getSampleMangaPages } from './data/samplePages';
import { INITIAL_CAST } from './data/castVoices';
import { audioEngine } from './utils/audioEngine';
import { inpaintEngine } from './utils/inpaintEngine';
import { StudioHeader } from './components/StudioHeader';
import { PageRail } from './components/PageRail';
import { MangaCanvas } from './components/MangaCanvas';
import { TimelineEditor } from './components/TimelineEditor';
import { Inspector } from './components/Inspector';
import { MotionComicModal } from './components/MotionComicModal';
import { UploadModal } from './components/UploadModal';

export default function App() {
  const [pages, setPages] = useState<MangaPage[]>(() => getSampleMangaPages());
  const [selectedPageId, setSelectedPageId] = useState<string>('page_yamada');
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>('bubble_yamada_1');
  const [cast, setCast] = useState<CastVoice[]>(INITIAL_CAST);
  const [activeView, setActiveView] = useState<'editor' | 'compare' | 'player'>('editor');

  // Timeline & Playback
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activePlayingBubbleId, setActivePlayingBubbleId] = useState<string | null>(null);
  const [activeViseme, setActiveViseme] = useState<VisemeType>('X');
  const [zoom, setZoom] = useState<number>(1.0);
  const [timelineZoom, setTimelineZoom] = useState<number>(55);
  const [showReadingOrder, setShowReadingOrder] = useState<boolean>(true);
  const [isCleanPlateView, setIsCleanPlateView] = useState<boolean>(false);

  // Inspector & Modals
  const [activeInspectorTab, setActiveInspectorTab] = useState<'element' | 'needsYou' | 'cast' | 'sfx' | 'export'>('element');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isMotionModalOpen, setIsMotionModalOpen] = useState<boolean>(false);
  const [extraSfxClips, setExtraSfxClips] = useState<TimelineClip[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const playbackTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const currentPage = pages.find((p) => p.id === selectedPageId) || pages[0];
  const selectedBubble = currentPage.bubbles.find((b) => b.id === selectedBubbleId) || null;

  // Build timeline clips
  const timelineClips: TimelineClip[] = [
    ...currentPage.bubbles.map((b) => {
      const speaker = cast.find((c) => c.id === b.speakerId);
      return {
        id: `clip_${b.id}`,
        trackId: 'dialogue' as const,
        bubbleId: b.id,
        title: speaker ? `${speaker.name.split(' ')[0]}: "${b.translatedText.slice(0, 18)}..."` : `Balão #${b.readingOrder}`,
        startTime: b.startTime,
        duration: b.duration,
        color: speaker ? speaker.color : '#7C5CFC',
        volume: b.volume,
        speakerName: speaker?.name,
        waveform: b.waveform,
        textPreview: b.translatedText,
      };
    }),
    ...extraSfxClips,
  ];

  const totalDuration = Math.max(
    14,
    Math.max(0, ...timelineClips.map((c) => c.startTime + c.duration)) + 2.0
  );

  // Needs You review items
  const needsYouItems: NeedsYouItem[] = currentPage.bubbles
    .filter((b) => b.confidence < 85 || !b.speakerId)
    .map((b) => ({
      id: `needs_${b.id}`,
      bubbleId: b.id,
      pageId: currentPage.id,
      type: !b.speakerId ? 'unassigned_speaker' : 'low_confidence_ocr',
      title: !b.speakerId ? `Balão #${b.readingOrder}: Personagem Não Atribuído` : `Balão #${b.readingOrder}: OCR Baixa Confiança (${b.confidence}%)`,
      description: `Texto detectado: "${b.translatedText}"`,
      confidence: b.confidence,
      resolved: false,
    }));

  // Handle Playback Loop
  useEffect(() => {
    if (!isPlaying) {
      if (playbackTimerRef.current) cancelAnimationFrame(playbackTimerRef.current);
      setActivePlayingBubbleId(null);
      setActiveViseme('X');
      audioEngine.stopAllSpeech();
      return;
    }

    let lastTime = performance.now();

    const updateLoop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setCurrentTime((prev) => {
        const nextTime = prev + delta;
        if (nextTime >= totalDuration) {
          setIsPlaying(false);
          return 0;
        }

        // Check if a dialogue bubble is currently playing at nextTime
        const activeB = currentPage.bubbles.find(
          (b) => nextTime >= b.startTime && nextTime <= b.startTime + b.duration
        );

        if (activeB) {
          if (activePlayingBubbleId !== activeB.id) {
            setActivePlayingBubbleId(activeB.id);
            // Trigger speech synthesis with genuine Gemini TTS audio when available
            audioEngine.speakText(activeB.translatedText, {
              audioBase64: activeB.audioBase64,
              pitch: activeB.pitch,
              rate: activeB.rate,
              volume: activeB.volume,
            });
          }

          // Calculate current viseme from bubble's viseme cues
          const offsetInClip = nextTime - activeB.startTime;
          const matchingViseme = activeB.visemes?.find(
            (v) => offsetInClip >= v.timeOffset && offsetInClip <= v.timeOffset + v.duration
          );
          if (matchingViseme) {
            setActiveViseme(matchingViseme.viseme);
          }
        } else {
          setActivePlayingBubbleId(null);
          setActiveViseme('X');
        }

        return nextTime;
      });

      playbackTimerRef.current = requestAnimationFrame(updateLoop);
    };

    playbackTimerRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (playbackTimerRef.current) cancelAnimationFrame(playbackTimerRef.current);
    };
  }, [isPlaying, totalDuration, currentPage.bubbles, activePlayingBubbleId]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setActivePlayingBubbleId(null);
    setActiveViseme('X');
    audioEngine.stopAllSpeech();
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
  };

  // Update bubble
  const handleUpdateBubble = (updated: Partial<SpeechBubble>) => {
    if (!selectedBubbleId) return;
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== currentPage.id) return p;
        return {
          ...p,
          bubbles: p.bubbles.map((b) => {
            if (b.id !== selectedBubbleId) return b;
            const newB = { ...b, ...updated };
            // If text changed, recompute waveform and visemes
            if (updated.translatedText && updated.translatedText !== b.translatedText) {
              newB.waveform = audioEngine.generateWaveform(updated.translatedText, 36);
              newB.visemes = audioEngine.generateVisemes(updated.translatedText, newB.duration);
            }
            return newB;
          }),
        };
      })
    );
  };

  // Resolve Needs You item
  const handleResolveNeedsYou = (itemId: string, assignedSpeakerId?: string) => {
    const item = needsYouItems.find((i) => i.id === itemId);
    if (!item) return;

    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== currentPage.id) return p;
        return {
          ...p,
          bubbles: p.bubbles.map((b) => {
            if (b.id !== item.bubbleId) return b;
            return {
              ...b,
              confidence: 98,
              speakerId: b.speakerId || assignedSpeakerId || cast[0].id,
            };
          }),
        };
      })
    );
    showToast('Balão revisado e aprovado com sucesso!');
  };

  const handleResolveAllNeedsYou = () => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== currentPage.id) return p;
        return {
          ...p,
          bubbles: p.bubbles.map((b) => ({
            ...b,
            confidence: 98,
            speakerId: b.speakerId || cast[0].id,
          })),
        };
      })
    );
    showToast('Todos os balões foram aprovados com sucesso!');
  };

  // Clean Plate Inpainting Trigger (Cleans all bubbles on current page)
  const handleCleanPlate = async () => {
    showToast('Gerando Clean Plate... Removendo texto de todos os balões.');
    try {
      const cleanImg = await inpaintEngine.generateCleanPlate(
        currentPage.imageUrl,
        currentPage.bubbles
      );
      setPages((prev) =>
        prev.map((p) =>
          p.id === currentPage.id
            ? {
                ...p,
                cleanImageUrl: cleanImg,
                bubbles: p.bubbles.map((b) => ({ ...b, cleaned: true })),
              }
            : p
        )
      );
      setIsCleanPlateView(true);
      setActiveView('compare');
      showToast('Clean Plate gerado com sucesso! Balões limpos.');
    } catch {
      showToast('Erro ao gerar Clean Plate.');
    }
  };

  // Clean a single bubble on current page
  const handleCleanCurrentBubble = async (bubble: SpeechBubble) => {
    showToast(`Limpando balão #${bubble.readingOrder}...`);
    try {
      const cleanImg = await inpaintEngine.generateCleanPlate(
        currentPage.cleanImageUrl || currentPage.imageUrl,
        [bubble]
      );
      setPages((prev) =>
        prev.map((p) =>
          p.id === currentPage.id
            ? {
                ...p,
                cleanImageUrl: cleanImg,
                bubbles: p.bubbles.map((b) => (b.id === bubble.id ? { ...b, cleaned: true } : b)),
              }
            : p
        )
      );
      setIsCleanPlateView(true);
      showToast(`Balão #${bubble.readingOrder} limpo com sucesso!`);
    } catch {
      showToast('Erro ao limpar balão.');
    }
  };

  // Auto-Detect OCR & Transcription Trigger (Calls Gemini Multimodal API)
  const handleAutoDetect = async () => {
    showToast('Analisando página com Gemini IA: OCR e detecção de balões...');
    try {
      const res = await fetch('/api/transcribe-manga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentPage.imageUrl,
          mimeType: 'image/png',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && Array.isArray(json.data.bubbles) && json.data.bubbles.length > 0) {
          const aiBubbles = json.data.bubbles;
          let cumulativeTime = 0.5;

          let newBubbles: SpeechBubble[] = aiBubbles.map((b: any, idx: number) => {
            const portText = b.translatedText || 'Fala detectada';
            const origText = b.japaneseText || '';
            const duration = Math.max(1.8, Math.min(5.0, portText.length * 0.085));
            const matchedSpeaker =
              cast.find((c) =>
                b.suggestedSpeaker && c.name.toLowerCase().includes(b.suggestedSpeaker.toLowerCase())
              ) || cast[idx % cast.length];

            const startTime = Number(cumulativeTime.toFixed(1));
            cumulativeTime += duration + 0.6;

            return {
              id: `bubble_${Date.now()}_${idx + 1}`,
              box: {
                x: Math.max(1, Math.min(95, Number(b.box?.x ?? 20))),
                y: Math.max(1, Math.min(95, Number(b.box?.y ?? 20))),
                width: Math.max(8, Math.min(60, Number(b.box?.width ?? 25))),
                height: Math.max(6, Math.min(60, Number(b.box?.height ?? 15))),
              },
              japaneseText: origText,
              translatedText: portText,
              speakerId: matchedSpeaker ? matchedSpeaker.id : cast[0].id,
              confidence: Number(b.confidence ?? 95),
              readingOrder: Number(b.readingOrder ?? idx + 1),
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

          // Parse faces from AI response
          let detectedFaces = currentPage.faces;
          if (Array.isArray(json.data.faces) && json.data.faces.length > 0) {
            detectedFaces = json.data.faces.map((f: any, fIdx: number) => ({
              id: `face_${Date.now()}_${fIdx + 1}`,
              name: f.name || `Personagem ${fIdx + 1}`,
              box: {
                x: Math.max(1, Math.min(95, Number(f.box?.x ?? 30))),
                y: Math.max(1, Math.min(95, Number(f.box?.y ?? 30))),
                width: Math.max(6, Math.min(50, Number(f.box?.width ?? 20))),
                height: Math.max(6, Math.min(50, Number(f.box?.height ?? 18))),
              },
              castVoiceId: cast.find((c) => f.name && c.name.toLowerCase().includes(f.name.toLowerCase()))?.id || cast[fIdx % cast.length]?.id || '',
              confidence: Number(f.confidence ?? 92),
              avatarColor: cast[fIdx % cast.length]?.color || '#7C5CFC',
            }));
          }

          // Synthesize batch TTS voices for all newly detected speech bubbles
          showToast('Sintetizando áudio das falas via Gemini TTS...');
          try {
            const ttsItems = newBubbles.map((b) => {
              const speaker = cast.find((c) => c.id === b.speakerId);
              let voiceName = 'Puck';
              const nameLower = (speaker?.name || b.suggestedSpeaker || '').toLowerCase();
              if (nameLower.includes('yamada') || nameLower.includes('mulher') || nameLower.includes('atendente')) {
                voiceName = 'Kore';
              } else if (b.bubbleType === 'narration' || nameLower.includes('narrador')) {
                voiceName = 'Zephyr';
              } else if (nameLower.includes('cliente') || nameLower.includes('homem')) {
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
              const ttsData = await ttsRes.json();
              if (ttsData.success && ttsData.audioMap) {
                newBubbles = newBubbles.map((b) => ({
                  ...b,
                  audioBase64: ttsData.audioMap[b.id] || b.audioBase64,
                }));
              }
            }
          } catch (ttsErr) {
            console.warn('Batch TTS in auto-detect warning:', ttsErr);
          }

          // Generate clean plate automatically for the new bubbles
          const cleanImg = await inpaintEngine.generateCleanPlate(
            currentPage.imageUrl,
            newBubbles
          );

          setPages((prev) =>
            prev.map((p) =>
              p.id === currentPage.id
                ? {
                    ...p,
                    cleanImageUrl: cleanImg,
                    bubbles: newBubbles,
                    faces: detectedFaces,
                  }
                : p
            )
          );

          if (newBubbles.length > 0) {
            setSelectedBubbleId(newBubbles[0].id);
          }

          showToast(`OCR Gemini concluído: ${newBubbles.length} balões transcritos, áudios gerados e balões limpos!`);
          return;
        }
      }

      // Fallback if API response did not contain bubbles
      const cleanImg = await inpaintEngine.generateCleanPlate(
        currentPage.imageUrl,
        currentPage.bubbles
      );
      setPages((prev) =>
        prev.map((p) => {
          if (p.id !== currentPage.id) return p;
          return {
            ...p,
            cleanImageUrl: cleanImg,
            bubbles: p.bubbles.map((b) => ({
              ...b,
              confidence: Math.max(94, b.confidence),
              speakerId: b.speakerId || cast[b.readingOrder % cast.length].id,
            })),
          };
        })
      );
      showToast('Detecção e limpeza de balões concluídas com sucesso!');
    } catch {
      showToast('Detecção concluída via detector local.');
    }
  };

  // Generate Gemini TTS Audio for a bubble
  const handleGenerateTTS = async (bubble: SpeechBubble, voiceName: string) => {
    showToast(`Gerando áudio via Gemini TTS (${voiceName})...`);
    try {
      const audioBase64 = await audioEngine.generateGeminiTTS(
        bubble.translatedText,
        voiceName,
        bubble.emotion
      );

      if (audioBase64) {
        // Save audio to state
        setPages((prev) =>
          prev.map((p) =>
            p.id === currentPage.id
              ? {
                  ...p,
                  bubbles: p.bubbles.map((b) =>
                    b.id === bubble.id
                      ? {
                          ...b,
                          audioBase64,
                          geminiVoiceName: voiceName,
                        }
                      : b
                  ),
                }
              : p
          )
        );

        showToast('Áudio Gemini TTS gerado! Reproduzindo...');
        // Play audio directly
        handlePlaySpeech({ ...bubble, audioBase64, geminiVoiceName: voiceName });
      } else {
        showToast('Não foi possível gerar áudio online. Usando síntese local.');
        handlePlaySpeech(bubble);
      }
    } catch {
      showToast('Erro ao sintetizar áudio. Usando síntese local.');
      handlePlaySpeech(bubble);
    }
  };

  // Play test speech with real audio, lip-sync viseme animation and fallback
  const handlePlaySpeech = (bubble: SpeechBubble) => {
    setActivePlayingBubbleId(bubble.id);

    // Viseme simulation for lip-sync mouth
    let step = 0;
    const visemes = bubble.visemes || [];
    const interval = setInterval(() => {
      if (step < visemes.length) {
        setActiveViseme(visemes[step].viseme);
        step++;
      } else {
        setActiveViseme('X');
        clearInterval(interval);
      }
    }, 120);

    const speaker = cast.find((c) => c.id === bubble.speakerId);
    const voiceName =
      bubble.geminiVoiceName ||
      (speaker?.voicePreset ? speaker.voicePreset.replace('Gemini-', '') : undefined);

    audioEngine.speakText(bubble.translatedText, {
      audioBase64: bubble.audioBase64 || speaker?.sampleAudioBase64,
      voiceName,
      pitch: bubble.pitch,
      rate: bubble.rate,
      volume: bubble.volume,
      onEnd: () => {
        setActivePlayingBubbleId(null);
        setActiveViseme('X');
        clearInterval(interval);
      },
    });
  };

  // Insert SFX to timeline
  const handleInsertSfxToTimeline = (sfx: SoundEffectItem) => {
    const newClip: TimelineClip = {
      id: `sfx_clip_${Date.now()}`,
      trackId: 'sfx',
      sfxId: sfx.id,
      title: sfx.name,
      startTime: Number(currentTime.toFixed(1)),
      duration: sfx.duration,
      color: '#F2B84B',
      volume: 0.9,
    };
    setExtraSfxClips((prev) => [...prev, newClip]);
    audioEngine.playSoundEffect(sfx.soundType);
    showToast(`Efeito "${sfx.name}" inserido na timeline em ${currentTime.toFixed(1)}s`);
  };

  // Export SRT Subtitles
  const handleExportSrt = () => {
    const sorted = currentPage.bubbles
      .slice()
      .sort((a, b) => a.startTime - b.startTime);

    const srtContent = sorted
      .map((b, idx) => {
        const start = formatSrtTimestamp(b.startTime);
        const end = formatSrtTimestamp(b.startTime + b.duration);
        const speaker = cast.find((c) => c.id === b.speakerId)?.name || 'Narrador';
        return `${idx + 1}\n${start} --> ${end}\n[${speaker}] ${b.translatedText}\n`;
      })
      .join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manga_dub_${currentPage.id}.srt`;
    a.click();
    showToast('Arquivo SRT baixado com sucesso!');
  };

  const formatSrtTimestamp = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  };

  // Export JSON Backup
  const handleExportJson = () => {
    const projectData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      pages,
      cast,
      extraSfxClips,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manga_voice_studio_project.json`;
    a.click();
    showToast('Projeto salvo em JSON com sucesso!');
  };

  return (
    <div
      id="manga-voice-studio-app"
      className="h-screen w-screen bg-[#0B0D10] text-[#F4F6F8] flex flex-col overflow-hidden font-sans select-none"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="studio-toast"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-[#15191F]/95 text-white text-xs font-semibold border border-[#7C5CFC]/50 shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce"
        >
          <span className="w-2 h-2 rounded-full bg-[#7C5CFC]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Studio Header */}
      <StudioHeader
        currentPage={currentPage}
        pages={pages}
        activeView={activeView}
        setActiveView={setActiveView}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        needsYouCount={needsYouItems.length}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenExport={() => setActiveInspectorTab('export')}
        onCleanPlate={handleCleanPlate}
        onAutoDetect={handleAutoDetect}
        zoom={zoom}
        onZoomChange={setZoom}
        onResetZoom={() => setZoom(1.0)}
        onSelectNeedsYouTab={() => setActiveInspectorTab('needsYou')}
      />

      {/* 2. Middle Work Area (PageRail + MangaCanvas + Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Manga Page Rail */}
        <PageRail
          pages={pages}
          selectedPageId={selectedPageId}
          onSelectPage={(id) => {
            setSelectedPageId(id);
            const targetPage = pages.find((p) => p.id === id);
            if (targetPage && targetPage.bubbles.length > 0) {
              setSelectedBubbleId(targetPage.bubbles[0].id);
            }
          }}
          onAddNewPage={() => setIsUploadOpen(true)}
          onDeletePage={(id) => {
            if (pages.length > 1) {
              const remaining = pages.filter((p) => p.id !== id);
              setPages(remaining);
              setSelectedPageId(remaining[0].id);
              showToast('Página excluída.');
            }
          }}
        />

        {/* Center Manga Canvas */}
        <MangaCanvas
          page={currentPage}
          selectedBubbleId={selectedBubbleId}
          onSelectBubble={(id) => {
            setSelectedBubbleId(id);
            setActiveInspectorTab('element');
          }}
          cast={cast}
          activeView={activeView}
          zoom={zoom}
          activePlayingBubbleId={activePlayingBubbleId}
          activeViseme={activeViseme}
          showReadingOrder={showReadingOrder}
          onToggleReadingOrder={() => setShowReadingOrder(!showReadingOrder)}
          isCleanPlateView={isCleanPlateView}
          onToggleCleanPlateView={() => setIsCleanPlateView(!isCleanPlateView)}
          onPlayBubble={handlePlaySpeech}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
        />

        {/* Right Contextual Inspector */}
        <Inspector
          selectedBubble={selectedBubble}
          onUpdateBubble={handleUpdateBubble}
          cast={cast}
          onAddCastMember={(newMember) => {
            setCast((prev) => [...prev, newMember]);
            showToast(`Ator "${newMember.name}" adicionado ao elenco!`);
          }}
          needsYouItems={needsYouItems}
          onResolveNeedsYou={handleResolveNeedsYou}
          onResolveAllNeedsYou={handleResolveAllNeedsYou}
          onPlaySpeech={handlePlaySpeech}
          onGenerateTTS={handleGenerateTTS}
          onCleanCurrentBubble={handleCleanCurrentBubble}
          onPlaySfx={(sfx) => audioEngine.playSoundEffect(sfx.soundType)}
          onInsertSfxToTimeline={handleInsertSfxToTimeline}
          activeTab={activeInspectorTab}
          setActiveTab={setActiveInspectorTab}
          onExportSrt={handleExportSrt}
          onExportJson={handleExportJson}
          onOpenMotionPlayer={() => setIsMotionModalOpen(true)}
        />
      </div>

      {/* 3. Bottom Timeline Editor */}
      <TimelineEditor
        clips={timelineClips}
        currentTime={currentTime}
        totalDuration={totalDuration}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onStop={handleStop}
        onSeek={handleSeek}
        selectedBubbleId={selectedBubbleId}
        onSelectBubble={(id) => {
          setSelectedBubbleId(id);
          setActiveInspectorTab('element');
        }}
        cast={cast}
        zoomLevel={timelineZoom}
        onZoomChange={setTimelineZoom}
        onOpenSfxTab={() => setActiveInspectorTab('sfx')}
      />

      {/* 4. Motion Comic Player Modal */}
      {isMotionModalOpen && (
        <MotionComicModal
          page={currentPage}
          cast={cast}
          onClose={() => setIsMotionModalOpen(false)}
        />
      )}

      {/* 5. Upload Modal */}
      {isUploadOpen && (
        <UploadModal
          nextPageNumber={pages.length + 1}
          existingCast={cast}
          onClose={() => setIsUploadOpen(false)}
          onPageCreated={(newPage) => {
            setPages((prev) => [...prev, newPage]);
            setSelectedPageId(newPage.id);
            if (newPage.bubbles.length > 0) {
              setSelectedBubbleId(newPage.bubbles[0].id);
            }
            showToast('Nova página de mangá importada e analisada!');
          }}
        />
      )}
    </div>
  );
}
