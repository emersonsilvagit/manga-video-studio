import { CastVoice } from '../types';
import precomputedAudio from './precomputedYamadaAudio.json';

export const INITIAL_CAST: CastVoice[] = [
  {
    id: 'voice_yamada',
    name: 'Yamada (Atendente)',
    role: 'Garota do Balcão / Sorriso Caloroso',
    color: '#FF7849', // Coral warmth
    avatarIcon: '🌸',
    gender: 'female',
    voicePreset: 'Gemini-Kore',
    pitch: 1.15,
    rate: 1.05,
    emotion: 'joyful',
    assignedBubblesCount: 1,
    sampleText: 'Aqui seu troco! Muito obrigada pela preferência.',
    sampleAudioBase64: precomputedAudio.yamada,
  },
  {
    id: 'voice_cliente',
    name: 'Cliente (Assalariado)',
    role: 'Cliente de Terno / Cansado & Tímido',
    color: '#4E89FF', // Cool blue
    avatarIcon: '💼',
    gender: 'male',
    voicePreset: 'Gemini-Charon',
    pitch: 0.9,
    rate: 0.95,
    emotion: 'shy',
    assignedBubblesCount: 1,
    sampleText: '...Valeu. Obrigado.',
    sampleAudioBase64: precomputedAudio.valeu,
  },
  {
    id: 'voice_narrator',
    name: 'Narrador',
    role: 'Voz Onisciente / Descrição',
    color: '#F2B84B', // Warning amber
    avatarIcon: '📜',
    gender: 'elder',
    voicePreset: 'Gemini-Zephyr',
    pitch: 0.92,
    rate: 1.0,
    emotion: 'neutral',
    assignedBubblesCount: 1,
    sampleText: 'Yamada-san trabalha no segundo balcão da loja de conveniência.',
    sampleAudioBase64: precomputedAudio.narration,
  },
  {
    id: 'voice_kenji',
    name: 'Kenji (Protagonista)',
    role: 'Herói Impulsivo / Espadachim',
    color: '#7C5CFC', // Studio accent purple
    avatarIcon: '⚔️',
    gender: 'male',
    voicePreset: 'Gemini-Puck',
    pitch: 1.05,
    rate: 1.1,
    emotion: 'dramatic',
    assignedBubblesCount: 0,
    sampleText: 'Queime até as cinzas, Lâmina de Chamas!',
    sampleAudioBase64: (precomputedAudio as any).kenji,
  },
  {
    id: 'voice_aoi',
    name: 'Aoi (Maga / Arqueira)',
    role: 'Coprotagonista Estrategista',
    color: '#35C98B', // Studio green
    avatarIcon: '🏹',
    gender: 'female',
    voicePreset: 'Gemini-Kore',
    pitch: 1.25,
    rate: 1.05,
    emotion: 'neutral',
    assignedBubblesCount: 0,
    sampleText: 'Kenji, cuidado! Esse poder é perigoso!',
  },
];
