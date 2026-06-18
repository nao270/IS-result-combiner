import { Part } from './part.js';

const TPL_HEIGHT = 0.1;
const SCAN_Y = 0.2;
const SCAN_X = 0.228;
const SCAN_WIDTH = 0.1;

const canvas = document.createElement('canvas');
const imgInput = document.querySelector('#img-input');
const saveButton = document.querySelector('#save-button');
const dstWrapper = document.querySelector('#dst-wrapper');
let fileName;


function scanParts(parts) {
  let prevPart;

  for (const part of parts) {
    part.initParams(SCAN_Y, TPL_HEIGHT);
    part.initCtx();
    part.detectHeight(prevPart);
    prevPart = part;
  }
}


function drawDst(parts) {
  const height = parts.reduce((total, part) => total + part.height, 0);
  const ctx = canvas.getContext('2d');
  canvas.width = Part.baseW;
  canvas.height = height;

  let startY = height;

  for (const part of parts.reverse()) {
    startY -= part.srcH;
    if (part.height > 0) {
      ctx.drawImage(part.src, 0, startY, Part.baseW, part.srcH);
    }
    startY += part.srcH - part.height;
  }
}


function makeFileName(file) {
  const fileName = file.name;
  const dotPos = fileName.lastIndexOf('.');
  const extension = fileName.slice(dotPos);
  const stem = fileName.slice(0, dotPos);
  return stem + '_combined' + extension;
}


function saveDst() {
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
}


async function onChangeImgInput(obj) {
  const files = Array.from(obj.files);

  if (files.length) {
    try {
      saveButton.disabled = true;
      saveButton.textContent = '処理中…';

      files.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
      const parts = await Promise.all(files.map(async file => await new Part(file)));

      const baseW = parts[0].src.naturalWidth;
      Part.initStaticParams(baseW, SCAN_X, SCAN_WIDTH);

      scanParts(parts);
      drawDst(parts);
      dstWrapper.appendChild(canvas);

      fileName = makeFileName(files[0]);
      saveButton.disabled = false;
      saveButton.textContent = '保存';
    }
    catch (err) {
      canvas.remove();
      saveButton.textContent = 'エラー発生';
      console.error(err);
    }
  }
}


imgInput.addEventListener('change', (e) => onChangeImgInput(e.target));
saveButton.addEventListener('click', saveDst);
