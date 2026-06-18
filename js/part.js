export class Part {

  static baseW;
  static #scanX;
  static #scanW;
  #scanY;
  #tplH;
  #ctx;
  #tgtPixels;

  constructor(file) {
    return new Promise(async (resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;
      await img.decode();
      this.src = img;
      URL.revokeObjectURL(url);
      resolve(this);
    });
  }

  initParams(SCAN_Y, TPL_HEIGHT) {
    this.srcH = Math.round(
      this.src.naturalHeight * Part.baseW / this.src.naturalWidth
    );
    this.#scanY = Math.round(this.srcH * SCAN_Y);
    this.#tplH = Math.round(this.srcH * TPL_HEIGHT);

    if (this.#scanY + this.#tplH >= this.srcH) {
      throw new Error('scanY + tplH is equal or larger than srcH.')
    } 
  }

  initCtx() {
    const canvas = document.createElement('canvas');
    canvas.width = Part.baseW;
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
      const tgtPixels = this.#createTgtPixels();
      const tplPixels = prevPart.#getTplPixels();

      const endY = this.srcH - this.#scanY - prevPart.#tplH;
      const endI = tplPixels.length;
      const scanW = Part.#scanW;
      let offset = 0;
      let bestY = 0;
      let bestDiff = Infinity;

      for (let y = 0; y < endY; y++, offset += scanW) {
        let diff = 0;

        for (let i = 0; i < endI; i += 4) {
          diff += Math.abs(tgtPixels[i + offset] - tplPixels[i]);
          if (diff > bestDiff) {
            break;
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

  static initStaticParams(baseW, SCAN_X, SCAN_WIDTH) {
    Part.baseW = baseW;
    Part.#scanX = Math.round(baseW * SCAN_X);
    Part.#scanW = Math.round(baseW * SCAN_WIDTH);

    if (Part.#scanX + Part.#scanW >= Part.baseW) {
      throw new Error('scanX + scanW is equal or larger than baseW.');
    }
  }

  #getTplPixels() {
    if (this.#tgtPixels === undefined) {
      return this.#ctx
        .getImageData(Part.#scanX, this.srcH - this.#tplH, Part.#scanW, this.#tplH)
        .data
        .filter((_, index) => index % 4 === 0);
    }
    else {
      return this.#tgtPixels.slice(
        (this.srcH - this.#tplH - this.#scanY) * Part.#scanW
      );
    }
  }

  #createTgtPixels() {
    this.#tgtPixels = this.#ctx
      .getImageData(Part.#scanX, this.#scanY, Part.#scanW, this.srcH - this.#scanY)
      .data
      .filter((_, index) => index % 4 ===0);
    return this.#tgtPixels;
  }
}
