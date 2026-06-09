const TPL_ROWS = 0.1;
const PAD_T = 0.2;
const PAD_L = 0.2;
const PAD_R = 0.1;

const canvasElm = document.createElement('canvas');
const statusElm = document.querySelector('#status');
const dstElm = document.querySelector('#dst')


async function loadImg(file) {
  const imgElm = new Image();
  const url = URL.createObjectURL(file);
  imgElm.src = url;
  await imgElm.decode();
  const img = cv.imread(imgElm);
  URL.revokeObjectURL(url);
  imgElm.remove();
  return img;
}


function normalize(img, baseCols) {
  const src = img.clone();
  const scale = baseCols / src.cols;
  cv.resize(src, img, new cv.Size(0, 0), scale, scale, cv.INTER_LINEAR);
  src.delete();
}


function preprocess(img, dst, rect) {
  const roi = img.roi(rect);
  cv.cvtColor(roi, dst, cv.COLOR_RGBA2GRAY);
  roi.delete();
}


function updateTpl(img, tpl, padL, scanCols) {
  const tplRows = Math.round(img.rows * TPL_ROWS);
  const rect = new cv.Rect(padL, img.rows - tplRows, scanCols, tplRows);
  preprocess(img, tpl, rect);
}


function updateTgt(img, tgt, padT, padL, scanCols) {
  const rect = new cv.Rect(padL, padT, scanCols, img.rows - padT);
  preprocess(img, tgt, rect);
}


function detectPartRows(tgt, tpl) {
  const result = new cv.Mat();
  cv.matchTemplate(tgt, tpl, result, cv.TM_CCOEFF_NORMED);
  const mml = cv.minMaxLoc(result);
  const matchY = mml.maxLoc.y;
  result.delete();
  return tgt.rows - matchY - tpl.rows;
}


function combineImgs(imgs) {
  const baseCols = imgs[0].cols;
  const padL = Math.round(baseCols * PAD_L);
  const scanCols = Math.round(baseCols * (1 - PAD_L - PAD_R));
  const lastIndex = imgs.length - 1;

  const mv = new cv.MatVector();
  const tgt = new cv.Mat();
  const tpl = new cv.Mat();

  for (const [i, img] of imgs.entries()) {
    if (i === 0) {
      mv.push_back(img);
    } else {
      if (img.cols !== baseCols) {
        normalize(img, baseCols);
      }
      const padT = Math.round(img.rows * PAD_T);
      updateTgt(img, tgt, padT, padL, scanCols);
      const partRows = detectPartRows(tgt, tpl);

      if (partRows > 0) {
        const rect = new cv.Rect(0, img.rows - partRows, img.cols, partRows);
        const part = img.roi(rect);
        mv.push_back(part);
        part.delete();
      }
    }

    if (i !== lastIndex) {
      updateTpl(img, tpl, padL, scanCols);
    }
    img.delete();
  }

  tgt.delete();
  tpl.delete();
  const dst = new cv.Mat();
  cv.vconcat(mv, dst);
  mv.delete();
  return dst;
}


function makeFileName(file) {
  const fileName = file.name;
  const dotPos = fileName.lastIndexOf('.');
  const extension = fileName.slice(dotPos);
  const stem = fileName.slice(0, dotPos);
  return stem + '_combined' + extension;
}


function createSaveButton(fileName) {
  const buttonElm = document.createElement('button');
  buttonElm.textContent = '保存';
  buttonElm.addEventListener('click', () => {
    canvasElm.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  });
  statusElm.textContent = '';
  statusElm.appendChild(buttonElm);
}


async function main(obj) {
  const files = Array.from(obj.files);

  if (files.length) {
    statusElm.replaceChildren();
    statusElm.textContent = '処理中…';

    try {
      files.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
      const imgs = await Promise.all(files.map(async file => await loadImg(file)));
      const dst = combineImgs(imgs);

      cv.imshow(canvasElm, dst);
      dstElm.appendChild(canvasElm);
      const fileName = makeFileName(files[0]);
      createSaveButton(fileName);
      dst.delete();
    } catch (err) {
      canvasElm.remove();
      statusElm.textContent = `エラーが発生しました。`;
      console.error(err);
    }
  }
}
