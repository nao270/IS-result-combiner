import { drawDst } from './combiner.js';
import { getTrimConf } from './conf.js';
import { loadImg, updateDstName, saveDst } from './io_img.js';
import { trimSrcs } from './trimmer.js';


const dstCanvas = document.createElement('canvas');
const dstWrapper = document.querySelector('#dst-wrapper');
const imgInput = document.querySelector('#img-input');
const saveButton = document.querySelector('#save-button');
const status = document.querySelector('#status');


async function main() {
  const files = Array.from(imgInput.files);
  status.textContent = '';

  if (files.length) {
    try {
      dstCanvas.remove();
      saveButton.disabled = true;
      status.classList.add('in-progress');

      files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      let srcs = await Promise.all(files.map(async file => await loadImg(file)));

      const trimConf = getTrimConf();
      const trimmedSrcs = await trimSrcs(srcs, trimConf);
      srcs = null;

      drawDst(trimmedSrcs, dstCanvas);
      dstWrapper.appendChild(dstCanvas);

      updateDstName(files[0].name);
      saveButton.disabled = false;
    }
    catch (err) {
      status.textContent = 'エラー発生';
      dstCanvas.remove();
      console.error(err);
    }
    finally {
      status.classList.remove('in-progress');
    }
  }
}


imgInput.addEventListener('change', main);
saveButton.addEventListener('click', () => saveDst(dstCanvas));
