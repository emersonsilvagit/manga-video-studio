import { VisemeCue, VisemeType, SoundEffectItem } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: AudioNode[] = [];

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Generate synthetic sound effects with Web Audio API (zero external network dependency)
  public playSoundEffect(type: SoundEffectItem['soundType'], volume: number = 0.8) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, now);
      masterGain.connect(ctx.destination);

      switch (type) {
        case 'impact': {
          // Deep punch / body blow
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
          gain.gain.setValueAtTime(1.0, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

          // Noise burst
          const bufferSize = ctx.sampleRate * 0.15;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
          }
          const whiteNoise = ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = 'lowpass';
          noiseFilter.frequency.setValueAtTime(800, now);

          osc.connect(gain);
          gain.connect(masterGain);
          whiteNoise.connect(noiseFilter);
          noiseFilter.connect(masterGain);

          osc.start(now);
          osc.stop(now + 0.4);
          whiteNoise.start(now);
          break;
        }

        case 'slice': {
          // Sharp katana sword slash
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(2200, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.28);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(3000, now);
          filter.Q.setValueAtTime(4, now);

          gain.gain.setValueAtTime(0.8, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);

          osc.start(now);
          osc.stop(now + 0.3);
          break;
        }

        case 'dramatic': {
          // Ominous anime cinematic chord (minor tension)
          const freqs = [110, 130.81, 164.81, 220]; // A2, C3, E3, A3
          freqs.forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.4, now + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 1.9);
          });
          break;
        }

        case 'magic': {
          // High-frequency mystical chime
          const notes = [587.33, 739.99, 880.0, 1174.66];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const noteStart = now + idx * 0.08;
            osc.frequency.setValueAtTime(freq, noteStart);
            gain.gain.setValueAtTime(0.25, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.6);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(noteStart);
            osc.stop(noteStart + 0.7);
          });
          break;
        }

        case 'page_turn': {
          // Subtle paper flutter
          const bufferSize = ctx.sampleRate * 0.18;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
          }
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1400, now);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);
          noise.start(now);
          break;
        }

        case 'wind': {
          const bufferSize = ctx.sampleRate * 1.5;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(450, now);
          filter.frequency.linearRampToValueAtTime(650, now + 0.8);
          filter.frequency.linearRampToValueAtTime(400, now + 1.5);
          filter.Q.setValueAtTime(2.5, now);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.25, now + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);
          noise.start(now);
          break;
        }

        case 'heartbeat': {
          // Thump-thump
          const thumps = [0, 0.22];
          thumps.forEach((offset) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(90, now + offset);
            osc.frequency.exponentialRampToValueAtTime(35, now + offset + 0.15);
            gain.gain.setValueAtTime(0.9, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.15);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now + offset);
            osc.stop(now + offset + 0.2);
          });
          break;
        }

        case 'thunder': {
          const bufferSize = ctx.sampleRate * 2.0;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 0.5);
          }
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(300, now);
          filter.frequency.linearRampToValueAtTime(80, now + 1.8);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.9, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);
          noise.start(now);
          break;
        }
      }
    } catch {
      // Audio fallback
    }
  }

  // Request TTS audio from Gemini endpoint
  public async generateGeminiTTS(
    text: string,
    voiceName: string = 'Puck',
    emotion: string = 'dramatic'
  ): Promise<string | null> {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceName, emotion }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success && data.audioBase64) {
        return data.audioBase64;
      }
      return null;
    } catch {
      return null;
    }
  }

  private currentSource: AudioBufferSourceNode | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  // Best-effort selector for natural Portuguese (pt-BR) speech synthesis voices
  public getBestPortugueseVoice(requestedVoice?: string, pitchHint?: number): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const ptBrVoices = voices.filter(
      (v) => v.lang === 'pt-BR' || v.lang === 'pt_BR' || v.lang.toLowerCase().replace('_', '-') === 'pt-br'
    );
    const anyPtVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('pt'));
    const candidates = ptBrVoices.length > 0 ? ptBrVoices : anyPtVoices.length > 0 ? anyPtVoices : voices;

    const isFemale = requestedVoice === 'Kore' || (pitchHint !== undefined && pitchHint > 1.08);
    const isMale = requestedVoice === 'Charon' || requestedVoice === 'Fenrir' || (pitchHint !== undefined && pitchHint < 0.96);

    if (isFemale) {
      const female = candidates.find((v) =>
        /female|mulher|luciana|maria|helena|francisca|vitória|vitoria|zira|fabi|leire|leticia|raquel/i.test(v.name)
      );
      if (female) return female;
    }

    if (isMale) {
      const male = candidates.find((v) =>
        /male|homem|felipe|daniel|ricardo|jorge|antonio|carlos|diego|thiago/i.test(v.name)
      );
      if (male) return male;
    }

    // Default to first Brazilian Portuguese voice, or any PT voice, or browser default
    return candidates[0] || voices.find((v) => v.default) || voices[0] || null;
  }

  // Play WAV/MP3 base64 audio via HTML5 Audio with Web Audio fallback
  public playBase64Audio(
    base64: string,
    options: {
      volume?: number;
      rate?: number;
      onStart?: () => void;
      onEnd?: () => void;
    } = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.stopAllSpeech();

        const clean = base64.replace(/^data:audio\/[a-z0-9]+;base64,/, '').trim();
        const dataUri = `data:audio/wav;base64,${clean}`;
        const audio = new Audio(dataUri);
        this.currentAudioElement = audio;

        audio.volume = Math.max(0, Math.min(1, options.volume ?? 1.0));
        if (options.rate && options.rate >= 0.5 && options.rate <= 2.0) {
          audio.playbackRate = options.rate;
        }

        let finished = false;
        const finalize = () => {
          if (!finished) {
            finished = true;
            if (this.currentAudioElement === audio) {
              this.currentAudioElement = null;
            }
            if (options.onEnd) options.onEnd();
            resolve();
          }
        };

        audio.onplay = () => {
          if (options.onStart) options.onStart();
        };
        audio.onended = finalize;
        audio.onerror = (e) => {
          console.warn('HTMLAudioElement play failed, attempting Web Audio buffer fallback:', e);
          this.playWebAudioPcmFallback(clean, options).then(resolve);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('audio.play() rejected:', err);
            this.playWebAudioPcmFallback(clean, options).then(resolve);
          });
        }
      } catch (err) {
        console.warn('playBase64Audio failed:', err);
        if (options.onEnd) options.onEnd();
        resolve();
      }
    });
  }

  // Secondary Web Audio fallback for decoded audio buffer
  private async playWebAudioPcmFallback(
    base64: string,
    options: { volume?: number; onStart?: () => void; onEnd?: () => void }
  ): Promise<void> {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      let audioBuffer: AudioBuffer;
      try {
        audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
      } catch {
        const sampleCount = Math.floor(len / 2);
        const int16 = new Int16Array(bytes.buffer, 0, sampleCount);
        audioBuffer = ctx.createBuffer(1, sampleCount, 24000);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < sampleCount; i++) {
          channelData[i] = int16[i] / 32768.0;
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      this.currentSource = source;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(options.volume ?? 1.0, ctx.currentTime);
      source.connect(gain);
      gain.connect(ctx.destination);

      if (options.onStart) options.onStart();
      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null;
        }
        if (options.onEnd) options.onEnd();
      };
      source.start(0);
    } catch (err) {
      console.warn('playWebAudioPcmFallback failed:', err);
      if (options.onEnd) options.onEnd();
    }
  }

  // Play speech using pre-rendered audio or browser Web Speech API (Never plays arcade SFX as voice)
  public speakText(
    text: string,
    options: {
      audioBase64?: string;
      voiceName?: string;
      pitch?: number;
      rate?: number;
      volume?: number;
      lang?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onBoundary?: (charIndex: number) => void;
    } = {}
  ): Promise<void> {
    return new Promise(async (resolve) => {
      // 1. If base64 audio already generated, play it with highest fidelity
      if (options.audioBase64 && options.audioBase64.length > 50) {
        await this.playBase64Audio(options.audioBase64, {
          volume: options.volume ?? 1.0,
          rate: options.rate ?? 1.0,
          onStart: options.onStart,
          onEnd: () => {
            if (options.onEnd) options.onEnd();
            resolve();
          },
        });
        return;
      }

      let hasEnded = false;
      const safeEnd = () => {
        if (!hasEnded) {
          hasEnded = true;
          this.activeUtterance = null;
          if (options.onEnd) options.onEnd();
          resolve();
        }
      };

      // 2. Real Web Speech API with natural Portuguese dubbing
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          this.stopAllSpeech();
          window.speechSynthesis.resume();

          const utterance = new SpeechSynthesisUtterance(text);
          this.activeUtterance = utterance; // Prevent garbage collection in Chrome

          utterance.rate = options.rate ?? 1.0;
          utterance.pitch = options.pitch ?? 1.0;
          utterance.volume = options.volume ?? 1.0;
          utterance.lang = options.lang || 'pt-BR';

          const voice = this.getBestPortugueseVoice(options.voiceName, options.pitch);
          if (voice) {
            utterance.voice = voice;
          }

          utterance.onstart = () => {
            if (options.onStart) options.onStart();
          };

          utterance.onend = () => {
            safeEnd();
          };

          utterance.onerror = (e) => {
            console.warn('SpeechSynthesis error:', e);
            safeEnd();
          };

          if (options.onBoundary) {
            utterance.onboundary = (e) => {
              if (options.onBoundary && typeof e.charIndex === 'number') {
                options.onBoundary(e.charIndex);
              }
            };
          }

          window.speechSynthesis.speak(utterance);

          // Generous timeout based on text length to protect against stuck utterances
          const wordCount = Math.max(1, text.split(/\s+/).length);
          const estimatedDurationMs = Math.max(3500, wordCount * 650 + 2500);
          setTimeout(() => {
            if (!hasEnded) {
              safeEnd();
            }
          }, estimatedDurationMs);

          return;
        } catch (err) {
          console.warn('SpeechSynthesis invocation error:', err);
        }
      }

      // If speech synthesis completely unavailable in environment, finish gracefully without sound effects
      if (options.onStart) options.onStart();
      setTimeout(safeEnd, 1600);
    });
  }

  public stopAllSpeech() {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
        this.currentAudioElement.src = '';
      } catch {}
      this.currentAudioElement = null;
    }
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {}
      this.currentSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      this.activeUtterance = null;
    }
  }

  // Fallback acoustic voice for silent or iframe-restricted environments
  public synthesizeAcousticVoice(text: string, pitchMultiplier: number = 1.0, duration: number = 1.5) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const baseFreq = 160 * pitchMultiplier;
      osc.frequency.setValueAtTime(baseFreq, now);

      // Modulate frequency to mimic speech prosody
      const words = text.split(' ');
      words.forEach((_, idx) => {
        const t = now + (idx / words.length) * duration;
        const mod = Math.sin(idx * 1.5) * 25;
        osc.frequency.linearRampToValueAtTime(baseFreq + mod, t);
      });

      // Lowpass formant
      const formant = ctx.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(900, now);
      formant.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(formant);
      formant.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // AudioContext fallback
    }
  }

  // Rhubarb Lip Sync algorithm: transforms phonemes/text into visemes
  public generateVisemes(text: string, duration: number): VisemeCue[] {
    const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const cues: VisemeCue[] = [];
    const step = 0.12; // 120ms per mouth posture
    const totalSteps = Math.max(1, Math.floor(duration / step));

    let charIdx = 0;
    for (let i = 0; i < totalSteps; i++) {
      const timeOffset = Number((i * step).toFixed(2));
      const dur = step;
      const char = cleanText[charIdx % (cleanText.length || 1)] || 'a';
      charIdx++;

      let viseme: VisemeType = 'B';
      if (['m', 'b', 'p'].includes(char)) {
        viseme = 'A'; // Closed lips
      } else if (['s', 't', 'd', 'k', 'g', 'n', 'r', 'l', 'z', 'j'].includes(char)) {
        viseme = 'B'; // Slightly open consonants
      } else if (['e', 'i', 'y'].includes(char)) {
        viseme = 'C'; // Open smile
      } else if (['a', 'h'].includes(char)) {
        viseme = 'D'; // Wide open
      } else if (['o', 'u', 'w'].includes(char)) {
        viseme = 'E'; // Rounded lips
      } else if (['f', 'v'].includes(char)) {
        viseme = 'F'; // Teeth on lower lip
      } else if (char === ' ') {
        viseme = 'X'; // Resting
      }

      cues.push({ timeOffset, duration: dur, viseme });
    }

    // Add resting frame at end
    cues.push({ timeOffset: duration, duration: 0.1, viseme: 'X' });
    return cues;
  }

  // Generate synthetic waveform points for visually rich audio tracks
  public generateWaveform(seedText: string, points: number = 36): number[] {
    let hash = 0;
    for (let i = 0; i < seedText.length; i++) {
      hash = (hash << 5) - hash + seedText.charCodeAt(i);
      hash |= 0;
    }
    const result: number[] = [];
    for (let i = 0; i < points; i++) {
      // Natural speech envelope: attack, sustain with vibrato, decay
      const progress = i / points;
      const envelope = Math.sin(progress * Math.PI);
      const ripple = (Math.sin(i * 0.8 + (hash % 10)) + Math.cos(i * 1.3)) * 0.25;
      const amp = Math.max(0.12, Math.min(1.0, (envelope + ripple) * 0.85));
      result.push(Number(amp.toFixed(2)));
    }
    return result;
  }
}

export const audioEngine = new AudioEngine();
