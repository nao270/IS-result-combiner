import { drawDst } from './combiner.js';
import { trimForm } from './conf.js';
import { loadImg, updateDstName, saveDst } from './io_img.js';
import { trimSrcs } from './trimmer.js';


const dstCanvas = document.getElementById('dst-canvas');
const imgInput = document.getElementById('img-input');
const saveButton = document.getElementById('save-button');
const status = document.getElementById('status');
const hiddenClass = 'hidden';
const inProgressClass = 'in-progress';


async function main() {
  const files = Array.from(imgInput.files);
  status.textContent = '';

  if (files.length) {
    try {
      dstCanvas.classList.add(hiddenClass);
      saveButton.disabled = true;
      status.classList.add(inProgressClass);

      files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      let srcs = await Promise.all(files.map(async file => await loadImg(file)));

      const trimConf = trimForm.getConf();
      const trimmedSrcs = await trimSrcs(srcs, trimConf);
      srcs = null;

      drawDst(trimmedSrcs, dstCanvas);
      updateDstName(files[0].name);

      dstCanvas.classList.remove(hiddenClass);
      saveButton.disabled = false;
    }
    catch (err) {
      status.textContent = 'エラー発生';
      console.error(err);
    }
    finally {
      status.classList.remove(inProgressClass);
    }
  }
}


imgInput.addEventListener('change', main);
saveButton.addEventListener('click', () => saveDst(dstCanvas));
