export interface BoundingBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

export type BubbleType = 'speech' | 'thought' | 'shout' | 'whisper' | 'narration' | 'sfx';

export type Emotion = 'neutral' | 'angry' | 'surprised' | 'sad' | 'excited' | 'dramatic' | 'joyful' | 'shy';

export type VisemeType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'X';

export interface VisemeCue {
  timeOffset: number; // seconds from clip start
  duration: number;
  viseme: VisemeType;
}

export interface SpeechBubble {
  id: string;
  box: BoundingBox;
  japaneseText: string;
  translatedText: string;
  speakerId: string;
  suggestedSpeaker?: string;
  confidence: number; // 0-100
  readingOrder: number;
  bubbleType: BubbleType;
  cleaned: boolean;
  emotion: Emotion;
  pitch: number;
  rate: number;
  volume: number;
  startTime: number; // seconds
  duration: number; // seconds
  waveform: number[];
  visemes: VisemeCue[];
  audioBase64?: string;
  geminiVoiceName?: string;
}

export interface CharacterFace {
  id: string;
  name: string;
  box: BoundingBox;
  castVoiceId: string;
  confidence: number;
  avatarColor: string;
}

export interface CastVoice {
  id: string;
  name: string;
  role: string;
  color: string;
  avatarIcon: string;
  gender: 'male' | 'female' | 'deep' | 'elder';
  voicePreset: string;
  pitch: number;
  rate: number;
  emotion: Emotion;
  assignedBubblesCount?: number;
  sampleAudioBase64?: string;
  sampleText?: string;
}

export type TrackType = 'dialogue' | 'sfx' | 'music';

export interface TimelineClip {
  id: string;
  trackId: TrackType;
  bubbleId?: string;
  sfxId?: string;
  title: string;
  startTime: number; // seconds
  duration: number; // seconds
  color: string;
  volume: number;
  speakerName?: string;
  waveform?: number[];
  textPreview?: string;
}

export interface SoundEffectItem {
  id: string;
  name: string;
  category: 'impact' | 'action' | 'ambient' | 'magic' | 'interface';
  duration: number;
  description: string;
  soundType: 'impact' | 'slice' | 'dramatic' | 'magic' | 'page_turn' | 'wind' | 'heartbeat' | 'thunder';
}

export interface PanelBoundary {
  id: string;
  box: BoundingBox;
  readingOrder: number;
}

export interface MangaPage {
  id: string;
  pageNumber: number;
  chapterTitle: string;
  title: string;
  imageUrl: string;
  cleanImageUrl?: string;
  width: number;
  height: number;
  panels: PanelBoundary[];
  bubbles: SpeechBubble[];
  faces: CharacterFace[];
  status: 'ready' | 'needs_review' | 'processed';
}

export interface NeedsYouItem {
  id: string;
  bubbleId: string;
  pageId: string;
  type: 'low_confidence_ocr' | 'unassigned_speaker' | 'reading_order' | 'clean_plate';
  title: string;
  description: string;
  confidence: number;
  resolved: boolean;
}

export interface SubtitleCue {
  id: string;
  startTime: number;
  endTime: number;
  speakerName: string;
  text: string;
}
