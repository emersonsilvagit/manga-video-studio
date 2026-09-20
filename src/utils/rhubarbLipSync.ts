import { VisemeType } from '../types';

/**
 * Returns SVG path or elements for 2D anime mouth viseme rendering.
 * Center is (50, 50), width 100, height 100.
 */
export function getAnimeMouthSvgPath(viseme: VisemeType): string {
  switch (viseme) {
    case 'A':
      // Closed mouth / M, B, P line
      return 'M 32 50 Q 50 51 68 50';
    case 'B':
      // Slightly parted mouth showing teeth
      return 'M 35 48 Q 50 45 65 48 Q 50 55 35 48 Z';
    case 'C':
      // Open smile / EH sound
      return 'M 32 46 Q 50 43 68 46 Q 50 62 32 46 Z';
    case 'D':
      // Wide open / shouting / AA sound
      return 'M 32 42 Q 50 38 68 42 Q 72 68 50 72 Q 28 68 32 42 Z';
    case 'E':
      // Rounded lips / O sound
      return 'M 40 44 Q 50 38 60 44 Q 65 62 50 64 Q 35 62 40 44 Z';
    case 'F':
      // Teeth over lower lip / F, V
      return 'M 34 47 Q 50 44 66 47 Q 50 56 34 47 Z';
    case 'X':
    default:
      // Neutral resting line with slight curve
      return 'M 36 50 Q 50 52 64 50';
  }
}
