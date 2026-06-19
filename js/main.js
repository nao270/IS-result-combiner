import { drawDst } from './combiner.js';
import { loadImg, updateDstName, saveDst } from './io_img.js';


const CONF = {
  BG_TH: 70,
  TPL_HEIGHT: 0.1,
  SCAN_X: 0.228,
  SCAN_Y: 0.2,
  SCAN_WIDTH: 0.2
}


const dstCanvas = document.createElement('canvas');
const dstWrapper = document.querySelector('#dst-wrapper');
const imgInput = document.querySelector('#img-input');
const saveButton = document.querySelector('#save-button');


async function onChangeImgInput() {
  const files = Array.from(imgInput.files);

  if (files.length) {
    try {
      saveButton.disabled = true;
      saveButton.textContent = '処理中…';

      files.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
      const srcs = await Promise.all(files.map(async file => await loadImg(file)));

      drawDst(srcs, dstCanvas, CONF);
      dstWrapper.appendChild(dstCanvas);

      updateDstName(files[0]);
      saveButton.disabled = false;
      saveButton.textContent = '保存';
    }
    catch (err) {
      dstCanvas.remove();
      saveButton.textContent = 'エラー発生';
      console.error(err);
    }
  }
}


imgInput.addEventListener('change', onChangeImgInput);
saveButton.addEventListener('click', () => saveDst(dstCanvas));
