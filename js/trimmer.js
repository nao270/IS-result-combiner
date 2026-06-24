async function trimSrc(src, conf, applyTrimT, applyTrimB) {
  const srcW = src.naturalWidth;
  const srcH = src.naturalHeight;
  const sX = Math.round(srcW * conf.trimL / 100);
  const sY = Math.round(srcH * conf.trimT / 100) * applyTrimT;
  const sW = srcW - sX - Math.round(srcW * conf.trimR / 100);
  const sH = srcH - sY - Math.round(srcH * conf.trimB / 100) * applyTrimB;

  if (sW <= 0 || sH <= 0) {
    throw Error('trimConf is invalid value.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = sW;
  canvas.height = sH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(src, sX, sY, sW, sH, 0, 0, sW, sH);

  const blob = await new Promise(resolve => canvas.toBlob(resolve));
  const url = URL.createObjectURL(blob);
  const dst = new Image();
  dst.src = url;
  await dst.decode();
  URL.revokeObjectURL(url);
  return dst;
}


async function trimSrcs(srcs, conf) {
  if (conf.trimT || conf.trimB || conf.trimL || conf.trimR) {
    const lastI = srcs.length - 1;

    return await Promise.all(srcs.map(async (src, i) => {
      const applyTrimT = i !== 0 || conf.applyTrimTtoFirst;
      const applyTrimB = i !== lastI || conf.applyTrimBtoLast;
      return await trimSrc(src, conf, applyTrimT, applyTrimB);
    }));
  }
  else {
    return srcs;
  }
}


export { trimSrcs };
