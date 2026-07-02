const BASE_STEP = 24 / 1920;
const BG_TH = 70;
const TPL_HEIGHT = 0.125;
const SCAN = Object.freeze({ X: 431 / 1920, Y: 0.2, WIDTH: 0.5 - 431 / 1920 });
let dstW;
let scanW;
let step;


class Part {

  #baseH;
  #ctx;
  #scanH;
  #tgtPixels;

  constructor(src) {
    const srcH = src.naturalHeight;
    const srcW = src.naturalWidth;
    const scale = dstW / srcW;
    const sX = Math.round(srcW * SCAN.X);
    const sY = Math.round(srcH * SCAN.Y);
    const sW = Math.round(srcW * SCAN.WIDTH);
    const sH = srcH - sY;
    this.src = src;
    this.#baseH = Math.round(srcH * scale);
    this.#scanH = Math.round(sH * scale);

    const canvas = document.createElement('canvas');
    canvas.width = scanW;
    canvas.height = this.#scanH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.filter = 'grayscale(100%)';
    ctx.drawImage(src,
      sX, sY, sW, sH,
      0, 0, canvas.width, canvas.height
    );
    this.#ctx = ctx;
  }

  detectMatchedPos(prevPart) {
    if (prevPart === undefined) {
      this.combineY = 0;
    }
    else {
      const tgtPixels = this.#setTgtPixels();
      const tplPixels = prevPart.#tplPixels();
      const tplH = tplPixels.length / scanW;
      const endY = this.#scanH - tplH;
      let offset = endY * scanW;
      let bestY;
      let bestDiff = Infinity;

      for (let y = endY; y > -1; y--, offset -= scanW) {
        let diff = 0;

        for (let i = 0; i < tplPixels.length; i += step) {
          const tgtPixel = tgtPixels[i + offset];
          const tplPixel = tplPixels[i];

          if (!tgtPixel.is_bg || !tplPixel.is_bg) {
            diff += Math.abs(tgtPixel.value - tplPixel.value);
            if (diff > bestDiff) {
              break;
            }
          }
        }

        if (diff < bestDiff) {
          bestY = y;
          bestDiff = diff;
        }
      }

      this.combineY = SCAN.Y + (bestY + tplH) / this.#baseH;
    }
    this.combineH = this.#baseH - Math.round(this.combineY * this.#baseH);
  }

  #pixelData(y) {
    const sY = Math.round(this.#scanH * y);
    const imgData = this.#ctx
      .getImageData(0, sY, scanW, this.#scanH - sY)
      .data
      .filter((_, i) => i % 4 === 0);
    return Array.from(imgData, pixel => ({ value: pixel, is_bg: pixel < BG_TH }));
  }

  #tplPixels() {
    const y = 1 - TPL_HEIGHT;
    return this.#tgtPixels === undefined
      ? this.#pixelData(y)
      : this.#tgtPixels.slice(Math.round(this.#scanH * y) * scanW);
  }

  #setTgtPixels() {
    this.#tgtPixels = this.#pixelData(0);
    return this.#tgtPixels;
  }
}


function drawDst(srcs, dstCanvas) {
  dstW = srcs[0].naturalWidth;
  scanW = Math.round(dstW * SCAN.WIDTH);
  step = Math.max(Math.round(dstW * BASE_STEP), 1);
  const parts = srcs.map(src => new Part(src));

  let prevPart;
  for (const part of parts) {
    part.detectMatchedPos(prevPart);
    prevPart = part;
  }

  const dstH = parts.reduce((total, part) => total + part.combineH, 0);
  const ctx = dstCanvas.getContext('2d');
  dstCanvas.width = dstW;
  dstCanvas.height = dstH;
  let dy = 0;

  for (const part of parts) {
    if (part.combineH > 0) {
      const src = part.src;
      const sY = Math.round(part.combineY * src.naturalHeight);
      ctx.drawImage(src,
        0, sY, src.naturalWidth, src.naturalHeight - sY,
        0, dy, dstW, part.combineH
      );
      dy += part.combineH;
    }
  }
}


export { drawDst };
