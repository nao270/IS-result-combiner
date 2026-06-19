const SCAN_STEP = 6;
let baseW, scanX, scanW, bgTh;


class Part {

  #ctx;
  #scanY;
  #tplH;
  #tgtPixels;

  constructor(src, CONF) {
    this.src = src;
    this.srcH = Math.round(
      this.src.naturalHeight * baseW / this.src.naturalWidth
    );
    this.#scanY = Math.round(this.srcH * CONF.SCAN_Y);
    this.#tplH = Math.round(this.srcH * CONF.TPL_HEIGHT);

    if (this.#scanY + this.#tplH >= this.srcH) {
      throw new Error('scanY + tplH is equal or larger than srcH.')
    }

    const canvas = document.createElement('canvas');
    canvas.width = baseW;
    canvas.height = this.srcH;
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    ctx.filter = 'grayscale(100%)';
    ctx.drawImage(this.src, 0, 0, canvas.width, canvas.height);
    this.#ctx = ctx;
  }

  detectHeight(prevPart) {
    if (prevPart === undefined) {
      this.height = this.srcH;
    }
    else {
      const tgtPixels = this.#makeTgtPixels();
      const tplPixels = prevPart.#getTplPixels();
      const endY = this.srcH - this.#scanY - prevPart.#tplH;
      let offset = endY * scanW;
      let bestY;
      let bestDiff = Infinity;

      for (let y = endY; y > -1; y--, offset -= scanW) {
        let diff = 0;

        for (let i = 0; i < tplPixels.length; i += SCAN_STEP) {
          const tgtPixel = tgtPixels[i + offset];
          const tplPixel = tplPixels[i];

          if (!tgtPixel.is_bg || !tplPixel.is_bg) {
            diff += Math.abs(tgtPixel.val - tplPixel.val);
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

      this.height = endY - bestY;
    }
  }

  #getPixelData(y, height) {
    const imgData = this.#ctx
      .getImageData(scanX, y, scanW, height)
      .data
      .filter((_, index) => index % 4 === 0);
    return Array.from(imgData, pixel => ({ val: pixel, is_bg: pixel < bgTh }));
  }

  #getTplPixels() {
    if (this.#tgtPixels === undefined) {
      return this.#getPixelData(this.srcH - this.#tplH, this.#tplH);
    }
    else {
      return this.#tgtPixels.slice(
        (this.srcH - this.#tplH - this.#scanY) * scanW
      );
    }
  }

  #makeTgtPixels() {
    this.#tgtPixels = this.#getPixelData(this.#scanY, this.srcH - this.#scanY);
    return this.#tgtPixels;
  }
}


function initParams(baseSrc, CONF) {
  baseW = baseSrc.naturalWidth;
  scanX = Math.round(baseW * CONF.SCAN_X);
  scanW = Math.round(baseW * CONF.SCAN_WIDTH);
  bgTh = CONF.BG_TH;

  if (scanX + scanW >= baseW) {
    throw new Error('scanX + scanW is equal or larger than baseW.');
  }
}


function detectHeights(parts) {
  let prevPart;
  for (const part of parts) {
    part.detectHeight(prevPart);
    prevPart = part;
  }
}


export function drawDst(srcs, dstCanvas, CONF) {
  initParams(srcs[0], CONF);
  const parts = srcs.map(src => new Part(src, CONF));

  detectHeights(parts);

  const height = parts.reduce((total, part) => total + part.height, 0);
  const ctx = dstCanvas.getContext('2d');
  dstCanvas.width = baseW;
  dstCanvas.height = height;
  let dy = height;

  for (const part of parts.reverse()) {
    dy -= part.srcH;
    if (part.height > 0) {
      ctx.drawImage(part.src, 0, dy, baseW, part.srcH);
    }
    dy += part.srcH - part.height;
  }
}
