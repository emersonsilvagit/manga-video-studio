import { MangaPage } from '../types';
import { audioEngine } from '../utils/audioEngine';
import precomputedYamadaAudio from './precomputedYamadaAudio.json';

// Generate authentic manga artwork for Yamada Convenience Store scene
function generateYamadaStorePageSvg(clean: boolean): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1450" width="1000" height="1450">
  <defs>
    <pattern id="yamada-screentone" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1.1" fill="#888888" />
    </pattern>
    <pattern id="yamada-screentone-dark" width="4" height="4" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.3" fill="#555555" />
    </pattern>
    <pattern id="yamada-screentone-apron" width="5" height="5" patternUnits="userSpaceOnUse">
      <rect width="2.5" height="5" fill="#333333" />
      <rect x="2.5" width="2.5" height="5" fill="#555555" />
    </pattern>
  </defs>

  <!-- Manga Paper -->
  <rect width="1000" height="1450" fill="#FCFCFD" />
  <rect x="40" y="40" width="920" height="1370" fill="none" stroke="#111" stroke-width="5" />

  <!-- ================= TOP PANEL: YAMADA AT COUNTER ================= -->
  <g id="panel-yamada-top">
    <rect x="50" y="50" width="900" height="640" fill="#FFFFFF" stroke="#111" stroke-width="4" />
    
    <!-- Store Background Shelves & Register -->
    <rect x="50" y="50" width="220" height="640" fill="#F0F2F5" />
    <line x1="270" y1="50" x2="270" y2="690" stroke="#BBB" stroke-width="2" />
    <rect x="70" y="100" width="160" height="25" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="1.5" />
    <rect x="70" y="150" width="160" height="25" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="1.5" />
    <rect x="70" y="200" width="160" height="25" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="1.5" />
    <text x="80" y="118" font-family="monospace" font-size="12" fill="#64748B">BEVERAGES</text>
    <text x="80" y="168" font-family="monospace" font-size="12" fill="#64748B">SNACKS & CANDY</text>
    
    <!-- Cash Register POS Terminal -->
    <rect x="180" y="380" width="150" height="140" rx="8" fill="#334155" stroke="#1E293B" stroke-width="3" />
    <rect x="195" y="400" width="120" height="60" rx="4" fill="#0F172A" />
    <text x="210" y="440" font-family="monospace" font-weight="bold" font-size="20" fill="#38BDF8">¥ 1,280</text>
    <rect x="200" y="475" width="110" height="30" fill="#475569" rx="3" />

    <!-- Counter Top Surface -->
    <polygon points="50,560 950,540 950,690 50,690" fill="#E2E8F0" stroke="#1E293B" stroke-width="4" />

    <!-- Yamada Character Illustration -->
    <!-- Apron Body -->
    <path d="M 360 480 Q 480 430 600 480 L 630 690 L 330 690 Z" fill="url(#yamada-screentone-apron)" stroke="#111" stroke-width="4" />
    <!-- White Inner Blouse -->
    <path d="M 440 380 Q 480 440 520 380 L 530 460 L 430 460 Z" fill="#FFFFFF" stroke="#111" stroke-width="3" />
    <!-- Apron Straps -->
    <path d="M 410 430 L 370 540" stroke="#111" stroke-width="5" />
    <path d="M 550 430 L 590 540" stroke="#111" stroke-width="5" />
    <!-- Name Badge: YAMADA -->
    <rect x="540" y="490" width="70" height="30" rx="4" fill="#FFFFFF" stroke="#111" stroke-width="2.5" />
    <text x="548" y="511" font-family="sans-serif" font-weight="900" font-size="13" fill="#111">山田 YAMADA</text>

    <!-- Head / Face -->
    <!-- Soft Tied Hair (Dark tone with screentone) -->
    <ellipse cx="480" cy="270" rx="140" ry="150" fill="url(#yamada-screentone-dark)" />
    <circle cx="590" cy="220" r="45" fill="url(#yamada-screentone-dark)" /> <!-- Hair Bun -->
    <!-- Front Face Base -->
    <path d="M 390 260 Q 400 370 480 395 Q 560 370 570 260 Z" fill="#FFFFFF" stroke="#111" stroke-width="4" />
    <!-- Bangs Hair Strands -->
    <path d="M 380 230 Q 420 300 440 270 Q 460 310 490 265 Q 520 310 540 270 Q 560 300 580 230 Z" fill="url(#yamada-screentone-dark)" stroke="#111" stroke-width="3" />
    
    <!-- Gentle Smiling Crescent Eyes -->
    <path d="M 425 295 Q 445 282 462 298" fill="none" stroke="#111" stroke-width="4.5" stroke-linecap="round" />
    <path d="M 498 298 Q 515 282 535 295" fill="none" stroke="#111" stroke-width="4.5" stroke-linecap="round" />
    <!-- Anime Eyelashes -->
    <line x1="462" y1="298" x2="470" y2="294" stroke="#111" stroke-width="3.5" stroke-linecap="round" />
    <line x1="498" y1="298" x2="490" y2="294" stroke="#111" stroke-width="3.5" stroke-linecap="round" />

    <!-- Cute Blush Marks -->
    <g stroke="#EF4444" stroke-width="2.5" opacity="0.8">
      <line x1="418" y1="315" x2="428" y2="325" />
      <line x1="426" y1="315" x2="436" y2="325" />
      <line x1="524" y1="315" x2="534" y2="325" />
      <line x1="532" y1="315" x2="542" y2="325" />
    </g>

    <!-- Nose & Warm Open Smile -->
    <path d="M 480 318 L 482 328" stroke="#111" stroke-width="2.5" />
    <path d="M 458 348 Q 480 375 502 348 Z" fill="#EF4444" stroke="#111" stroke-width="3" />

    <!-- Hands Offering Change with Coins -->
    <!-- Arms reaching forward -->
    <path d="M 370 530 Q 420 540 450 520 L 460 550 Q 410 575 360 555 Z" fill="#FFFFFF" stroke="#111" stroke-width="3.5" />
    <path d="M 590 530 Q 540 540 510 520 L 500 550 Q 550 575 600 555 Z" fill="#FFFFFF" stroke="#111" stroke-width="3.5" />
    <!-- Hands & Coins Tray -->
    <ellipse cx="480" cy="535" rx="55" ry="20" fill="#3B82F6" opacity="0.25" stroke="#2563EB" stroke-width="2" />
    <ellipse cx="465" cy="533" rx="14" ry="10" fill="#F59E0B" stroke="#B45309" stroke-width="2" />
    <text x="460" y="537" font-size="9" font-weight="bold" fill="#78350F">100</text>
    <ellipse cx="492" cy="535" rx="16" ry="12" fill="#94A3B8" stroke="#475569" stroke-width="2" />
    <text x="486" y="540" font-size="10" font-weight="bold" fill="#1E293B">500</text>
    
    <!-- Manga SFX: "SORRI" (Smile) -->
    <text x="600" y="320" font-family="'Impact', 'Arial Black', sans-serif" font-size="34" fill="#F43F5E" stroke="#FFFFFF" stroke-width="2" transform="rotate(8 600 320)">ニコッ SORRI</text>
    <text x="540" y="555" font-family="'Arial Black', sans-serif" font-size="20" fill="#0EA5E9">ジャラッ (Tap!)</text>

    <!-- Speech Bubble: "AQUI SEU TROCO!" (RTL primary - Right side) -->
    <g id="bubble-yamada-1">
      <path d="M 640 100 Q 880 70 890 220 Q 900 360 740 370 Q 700 375 660 410 Q 675 370 650 360 Q 610 330 610 230 Q 610 110 640 100 Z" fill="#FFFFFF" stroke="#111" stroke-width="4.5" />
      ${
        clean
          ? ''
          : `
        <text x="750" y="195" font-family="'Plus Jakarta Sans', 'Arial Black', sans-serif" font-weight="900" font-size="30" text-anchor="middle" fill="#0F172A">AQUI SEU</text>
        <text x="750" y="240" font-family="'Plus Jakarta Sans', 'Arial Black', sans-serif" font-weight="900" font-size="32" text-anchor="middle" fill="#0F172A">TROCO!</text>
        <text x="750" y="280" font-family="'Plus Jakarta Sans', sans-serif" font-weight="bold" font-size="14" text-anchor="middle" fill="#64748B">お釣りになります！</text>
      `
      }
    </g>
  </g>

  <!-- ================= BOTTOM PANEL: CUSTOMER (SALARYMAN) & NARRATION ================= -->
  <g id="panel-customer-bottom">
    <rect x="50" y="720" width="900" height="670" fill="#FFFFFF" stroke="#111" stroke-width="4" />

    <!-- Narration Box (Top Left of bottom panel) -->
    <g id="narration-box">
      <rect x="80" y="750" width="280" height="110" rx="4" fill="#FFFFFF" stroke="#111" stroke-width="3" />
      ${
        clean
          ? ''
          : `
        <text x="220" y="785" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="14" text-anchor="middle" fill="#0F172A">YAMADA-SAN TRABALHA</text>
        <text x="220" y="810" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="14" text-anchor="middle" fill="#0F172A">NO SEGUNDO BALCÃO.</text>
        <text x="220" y="835" font-family="'Plus Jakarta Sans', sans-serif" font-weight="600" font-size="11" text-anchor="middle" fill="#64748B">山田さんは2番レジ担当。</text>
      `
      }
    </g>

    <!-- Speedlines / Emotion backdrop -->
    <line x1="80" y1="920" x2="350" y2="1050" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4 4" />
    <line x1="80" y1="960" x2="350" y2="1070" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4 4" />

    <!-- Customer (Salaryman in suit taking the coins) -->
    <!-- Suit Jacket -->
    <path d="M 330 1150 L 250 1390 L 680 1390 L 610 1150 Z" fill="#1E293B" stroke="#0F172A" stroke-width="4" />
    <!-- White Shirt Collar & Blue Tie -->
    <polygon points="440,1150 480,1230 520,1150 490,1130 470,1130" fill="#FFFFFF" stroke="#111" stroke-width="2.5" />
    <polygon points="475,1165 485,1165 490,1280 480,1310 470,1280" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2" />

    <!-- Salaryman Head -->
    <ellipse cx="480" cy="980" rx="110" ry="130" fill="#FFFFFF" stroke="#111" stroke-width="4" />
    <!-- Messy Dark Hair -->
    <path d="M 370 960 Q 400 840 480 840 Q 560 840 590 960 Q 560 910 520 940 Q 480 890 440 940 Q 410 900 370 960 Z" fill="#0F172A" />

    <!-- Tired/Surprised Salaryman Eyes -->
    <ellipse cx="435" cy="970" rx="14" ry="18" fill="#111" />
    <ellipse cx="515" cy="970" rx="14" ry="18" fill="#111" />
    <circle cx="439" cy="966" r="4" fill="#FFFFFF" />
    <circle cx="519" cy="966" r="4" fill="#FFFFFF" />

    <!-- Slight Embarrassed Cheek Lines -->
    <line x1="410" y1="1000" x2="422" y2="1008" stroke="#EF4444" stroke-width="2" />
    <line x1="418" y1="1000" x2="430" y2="1008" stroke="#EF4444" stroke-width="2" />
    <line x1="520" y1="1000" x2="532" y2="1008" stroke="#EF4444" stroke-width="2" />
    <line x1="528" y1="1000" x2="540" y2="1008" stroke="#EF4444" stroke-width="2" />

    <!-- Shy Speaking Mouth -->
    <ellipse cx="478" cy="1035" rx="12" ry="7" fill="#111" />

    <!-- Hand Receiving Coins -->
    <path d="M 540 1200 Q 580 1140 640 1120 L 670 1150 Q 600 1210 560 1250 Z" fill="#F8FAFC" stroke="#111" stroke-width="3.5" />

    <!-- Customer Speech Bubble: "...VALEU." (Right side) -->
    <g id="bubble-customer-valeu">
      <path d="M 660 820 Q 860 800 880 920 Q 890 1020 780 1040 Q 740 1050 710 1100 Q 715 1050 670 1030 Q 630 1000 640 900 Q 650 820 660 820 Z" fill="#FFFFFF" stroke="#111" stroke-width="4.5" />
      ${
        clean
          ? ''
          : `
        <text x="760" y="930" font-family="'Plus Jakarta Sans', 'Arial Black', sans-serif" font-weight="900" font-size="34" text-anchor="middle" fill="#0F172A">...VALEU.</text>
        <text x="760" y="970" font-family="'Plus Jakarta Sans', sans-serif" font-weight="bold" font-size="14" text-anchor="middle" fill="#64748B">…どうも。</text>
      `
      }
    </g>
  </g>

  <!-- Page footer -->
  <text x="500" y="1435" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="#94A3B8">MANGA VOICE STUDIO — CAPÍTULO 2 • PÁGINA 2 (NO BALCÃO COM YAMADA-SAN)</text>
</svg>
`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export function getSampleMangaPages(): MangaPage[] {
  return [
    {
      id: 'page_yamada',
      pageNumber: 1,
      chapterTitle: 'Capítulo 2: No Balcão com Yamada-san',
      title: 'Página 2: Atendimento no Balcão',
      imageUrl: generateYamadaStorePageSvg(false),
      cleanImageUrl: generateYamadaStorePageSvg(true),
      width: 1000,
      height: 1450,
      status: 'ready',
      panels: [
        { id: 'pan_top', readingOrder: 1, box: { x: 5, y: 3.5, width: 90, height: 44 } },
        { id: 'pan_bottom', readingOrder: 2, box: { x: 5, y: 50, width: 90, height: 46 } },
      ],
      faces: [
        {
          id: 'face_yamada_1',
          name: 'Yamada',
          box: { x: 38, y: 16, width: 22, height: 16 },
          castVoiceId: 'voice_yamada',
          confidence: 99,
          avatarColor: '#FF7849',
        },
        {
          id: 'face_cliente_1',
          name: 'Cliente',
          box: { x: 37, y: 58, width: 22, height: 18 },
          castVoiceId: 'voice_cliente',
          confidence: 96,
          avatarColor: '#4E89FF',
        },
      ],
      bubbles: [
        {
          id: 'bubble_yamada_troco',
          box: { x: 61, y: 7, width: 29, height: 21 },
          japaneseText: 'お釣りになります！',
          translatedText: 'Aqui seu troco!',
          speakerId: 'voice_yamada',
          suggestedSpeaker: 'Yamada',
          confidence: 99,
          readingOrder: 1,
          bubbleType: 'speech',
          cleaned: true,
          emotion: 'joyful',
          pitch: 1.15,
          rate: 1.05,
          volume: 1.0,
          startTime: 0.4,
          duration: 2.2,
          audioBase64: precomputedYamadaAudio.yamada,
          geminiVoiceName: 'Kore',
          waveform: audioEngine.generateWaveform('Aqui seu troco!', 36),
          visemes: audioEngine.generateVisemes('Aqui seu troco!', 2.2),
        },
        {
          id: 'bubble_yamada_narration',
          box: { x: 8, y: 52, width: 28, height: 8 },
          japaneseText: '山田さんは2番レジ担当。',
          translatedText: 'Yamada-san trabalha no segundo balcão.',
          speakerId: 'voice_narrator',
          suggestedSpeaker: 'Narrador',
          confidence: 98,
          readingOrder: 2,
          bubbleType: 'narration',
          cleaned: true,
          emotion: 'neutral',
          pitch: 1.0,
          rate: 1.0,
          volume: 0.95,
          startTime: 3.0,
          duration: 2.8,
          audioBase64: precomputedYamadaAudio.narration,
          geminiVoiceName: 'Zephyr',
          waveform: audioEngine.generateWaveform('Yamada-san trabalha no segundo balcão.', 36),
          visemes: audioEngine.generateVisemes('Yamada-san trabalha no segundo balcão.', 2.8),
        },
        {
          id: 'bubble_yamada_valeu',
          box: { x: 64, y: 57, width: 25, height: 18 },
          japaneseText: '…どうも。',
          translatedText: '...Valeu.',
          speakerId: 'voice_cliente',
          suggestedSpeaker: 'Cliente',
          confidence: 97,
          readingOrder: 3,
          bubbleType: 'speech',
          cleaned: true,
          emotion: 'shy',
          pitch: 0.9,
          rate: 0.95,
          volume: 1.0,
          startTime: 6.2,
          duration: 1.8,
          audioBase64: precomputedYamadaAudio.valeu,
          geminiVoiceName: 'Charon',
          waveform: audioEngine.generateWaveform('...Valeu.', 36),
          visemes: audioEngine.generateVisemes('...Valeu.', 1.8),
        },
      ],
    },
  ];
}
