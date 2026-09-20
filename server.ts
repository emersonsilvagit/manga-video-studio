import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Support large image payloads (base64 manga scans)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to wrap raw 24kHz 16-bit mono PCM into standard 44-byte RIFF WAV
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20); // AudioFormat 1 = PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 2. Multimodal Manga OCR & Speech Bubble Detection endpoint
app.post('/api/transcribe-manga', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required.' });
    }

    // Strip data url prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const ai = getGeminiClient();

    const systemPrompt = `You are a world-class manga director, OCR transcription specialist, and anime dubbing director.
Analyze this manga page image with extreme precision and locate ALL text and characters.

CRITICAL INSTRUCTIONS:
1. Locate EVERY speech bubble, thought bubble, shout/scream bubble, and narrative caption box.
   - Look at ALL panels from top to bottom, right to left (manga order).
   - In modern scanlations, text might already be in Portuguese (pt-BR) or English. If the text is already in Portuguese, transcribe the EXACT text as written!
   - Do NOT miss any rectangular narration boxes (e.g. caption boxes with story context or character thoughts).
   - Do NOT miss short dialogues like "...VALEU.", "SIM", "NÃO", etc.
2. For each bubble/caption box:
   - "box": bounding box { "x": number, "y": number, "width": number, "height": number } as percentages (0 to 100) of the full page width and height. Ensure it tightly frames the bubble and its text.
   - "japaneseText": original text as written on the page. If written in Portuguese or English, write the exact text found.
   - "translatedText": clean, expressive Portuguese (pt-BR) text ready for voice dubbing and subtitles.
   - "readingOrder": 1, 2, 3... in chronological reading order.
   - "bubbleType": "speech" | "scream" | "thought" | "narration"
   - "emotion": "neutral" | "dramatic" | "angry" | "sad" | "joyful" | "whisper" | "shy"
   - "suggestedSpeaker": character title or role (e.g. "Yamada", "Atendente", "Cliente", "Narrador", "Protagonista").
   - "confidence": number between 90 and 99.
3. Detect ALL character faces/heads visible across all panels:
   - "box": { "x": number, "y": number, "width": number, "height": number } in percentages (0 to 100) tightly framing the face/head.
   - "name": character name or description (e.g. "Yamada", "Cliente", "Garota do Balcão").
   - "gender": "female" | "male" | "narrator"
   - "confidence": confidence percentage (90-99).

Output MUST strictly be valid JSON adhering to this schema:
{
  "title": "Page title or description",
  "bubbles": [
    {
      "box": { "x": 65, "y": 10, "width": 25, "height": 18 },
      "japaneseText": "AQUI SEU TROCO!",
      "translatedText": "Aqui seu troco!",
      "readingOrder": 1,
      "bubbleType": "speech",
      "emotion": "joyful",
      "suggestedSpeaker": "Yamada",
      "confidence": 98
    }
  ],
  "faces": [
    {
      "box": { "x": 30, "y": 8, "width": 38, "height": 30 },
      "name": "Yamada",
      "gender": "female",
      "confidence": 97
    }
  ]
}`;

    // Try primary models with fallback
    const candidateModels = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let lastError: any = null;
    let responseText = '';

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: mimeType,
                  },
                },
                {
                  text: 'Perform complete manga speech bubble OCR detection, narration transcription, character face detection, and dubbing script generation. Return JSON only.',
                },
              ],
            },
          ],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        responseText = response.text || '';
        if (responseText) break;
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed for OCR, trying next model:`, err);
      }
    }

    if (!responseText) {
      throw lastError || new Error('No response from AI models.');
    }

    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Manga OCR error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Falha ao processar OCR da página de mangá.',
    });
  }
});

// Helper for Gemini TTS call
async function synthesizeTtsAudio(ai: GoogleGenAI, text: string, voiceName: string, emotion: string): Promise<string> {
  const allowedVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
  const selectedVoice = allowedVoices.includes(voiceName) ? voiceName : 'Puck';

  const prompt = `Diga com boa entonação de dublador de anime em português brasileiro (${emotion}): ${text}`;

  const ttsCandidateModels = [
    'gemini-2.5-flash-preview-tts',
    'gemini-2.5-pro-preview-tts',
    'gemini-3.1-flash-tts-preview',
  ];

  let lastErr: any = null;
  for (const modelName of ttsCandidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        // Convert raw 24kHz 16-bit mono PCM into standard WAV
        const pcmBuf = Buffer.from(base64Audio, 'base64');
        const wavBuf = pcmToWav(pcmBuf, 24000, 1, 16);
        return wavBuf.toString('base64');
      }
    } catch (err: any) {
      lastErr = err;
      console.warn(`TTS attempt with ${modelName} failed:`, err?.message || err);
    }
  }

  throw lastErr || new Error('No audio returned by any TTS model.');
}

// 3. Text-to-Speech (TTS) endpoint using Gemini TTS
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Puck', emotion = 'dramatic' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS.' });
    }

    const ai = getGeminiClient();
    const wavBase64 = await synthesizeTtsAudio(ai, text, voiceName, emotion);

    return res.json({
      success: true,
      audioBase64: wavBase64,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Falha ao sintetizar áudio via Gemini TTS.',
    });
  }
});

// 4. Batch TTS for an entire page of speech bubbles
app.post('/api/batch-tts', async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, text, voiceName, emotion }
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required.' });
    }

    const ai = getGeminiClient();
    const results: Record<string, string> = {};

    for (const item of items) {
      if (!item.text) continue;
      try {
        const audio = await synthesizeTtsAudio(ai, item.text, item.voiceName || 'Puck', item.emotion || 'neutral');
        results[item.id] = audio;
      } catch (e) {
        console.warn(`Failed TTS for item ${item.id}:`, e);
      }
    }

    return res.json({
      success: true,
      audioMap: results,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Falha no batch TTS.',
    });
  }
});

// Vite middleware or static serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Manga Voice Studio server running on http://0.0.0.0:${PORT}`);
  });
}

start();
