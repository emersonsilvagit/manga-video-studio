import { SpeechBubble } from '../types';

export class InpaintEngine {
  /**
   * Generates a clean plate image from a base image by inpainting/clearing
   * text inside detected speech bubbles while preserving bubble contour and tone.
   */
  public async generateCleanPlate(
    imageSrc: string,
    bubbles: SpeechBubble[]
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1000;
        canvas.height = img.naturalHeight || 1450;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        // Draw original page
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // If no bubbles detected, attempt heuristic center clean or return original
        if (!bubbles || bubbles.length === 0) {
          resolve(canvas.toDataURL('image/png'));
          return;
        }

        // For each speech bubble, clean the text interior
        bubbles.forEach((bubble) => {
          const bx = Math.round((bubble.box.x / 100) * canvas.width);
          const by = Math.round((bubble.box.y / 100) * canvas.height);
          const bw = Math.round((bubble.box.width / 100) * canvas.width);
          const bh = Math.round((bubble.box.height / 100) * canvas.height);

          if (bw <= 4 || bh <= 4) return;

          // Inset to avoid wiping out the black border of the bubble
          const insetX = Math.max(3, bw * 0.12);
          const insetY = Math.max(3, bh * 0.14);
          const innerX = bx + insetX;
          const innerY = by + insetY;
          const innerW = Math.max(2, bw - insetX * 2);
          const innerH = Math.max(2, bh - insetY * 2);

          // Sample paper/background color inside the bubble (from top corner where text is rare)
          let bgColor = '#FFFFFF';
          try {
            const sampleX = Math.min(canvas.width - 1, Math.max(0, Math.round(innerX + 4)));
            const sampleY = Math.min(canvas.height - 1, Math.max(0, Math.round(innerY + 4)));
            const p = ctx.getImageData(sampleX, sampleY, 1, 1).data;
            // Only use sampled tone if it's light enough to be a bubble background (> 180)
            const lum = 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
            if (lum > 180) {
              bgColor = `rgb(${p[0]}, ${p[1]}, ${p[2]})`;
            }
          } catch {
            bgColor = '#FFFFFF';
          }

          ctx.save();

          if (bubble.bubbleType === 'narration') {
            // Rectangular narration box
            ctx.fillStyle = bgColor;
            ctx.fillRect(innerX, innerY, innerW, innerH);
          } else {
            // Elliptical speech, scream or thought bubble
            ctx.beginPath();
            ctx.ellipse(
              bx + bw / 2,
              by + bh / 2,
              innerW / 2,
              innerH / 2,
              0,
              0,
              2 * Math.PI
            );
            ctx.fillStyle = bgColor;
            ctx.fill();

            // Smooth feathered edge pass to blend seamlessly
            ctx.beginPath();
            ctx.ellipse(
              bx + bw / 2,
              by + bh / 2,
              Math.max(1, innerW / 2 - 2),
              Math.max(1, innerH / 2 - 2),
              0,
              0,
              2 * Math.PI
            );
            ctx.fillStyle = bgColor;
            ctx.shadowColor = bgColor;
            ctx.shadowBlur = 4;
            ctx.fill();
          }

          ctx.restore();
        });

        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => {
        resolve(imageSrc);
      };

      img.src = imageSrc;
    });
  }
}

export const inpaintEngine = new InpaintEngine();
