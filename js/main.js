const TPL_H_RATE = 0.1;
const canvasElm = document.querySelector('#canvas');
const statusElm = document.querySelector('#status');


async function readImg(file) {
  const imgElm = new Image();
  const url = URL.createObjectURL(file);
  imgElm.src = url;
  await imgElm.decode();
  const img = cv.imread(imgElm);
  URL.revokeObjectURL(url);
  imgElm.remove();
  return img;
}


function gray(img) {
  const dst = new cv.Mat();
  cv.cvtColor(img, dst, cv.COLOR_RGBA2GRAY);
  return dst;
}


function detectMatchY(img, tpl) {
  const mtImg = gray(img);
  const mtTpl = gray(tpl);
  const result = new cv.Mat();

  cv.matchTemplate(mtImg, mtTpl, result, cv.TM_CCOEFF_NORMED);
  const mml = cv.minMaxLoc(result);
  const matchY = mml.maxLoc.y;

  mtImg.delete();
  mtTpl.delete();
  result.delete();
  return matchY;
}


function createTpl(img) {
  const tplH = Math.round(img.rows * TPL_H_RATE);
  const tplRect = new cv.Rect(0, img.rows - tplH, img.cols, tplH);
  const roi = img.roi(tplRect);
  const tpl = roi.clone();
  roi.delete();
  return tpl;
}


async function combineImgs(files) {
  const lastFile = files.at(-1);
  const mv = new cv.MatVector();
  let part, tpl;

  for (const file of files) {
    const src = await readImg(file);
    if (tpl === undefined) {
      part = src.clone();
    } else {
      const matchY = detectMatchY(src, tpl);
      const partH = src.rows - matchY - tpl.rows;
      if (partH > 0) {
        const partRect = new cv.Rect(0, src.rows - partH, src.cols, partH);
        const roi = src.roi(partRect);
        part = roi.clone();
        roi.delete();
      } else {
        part = src.clone();
      }
      tpl.delete();
    }

    mv.push_back(part);
    if (file !== lastFile) {
      tpl = createTpl(src);
    }
    part.delete();
    src.delete();
  }

  const dst = new cv.Mat();
  cv.vconcat(mv, dst);
  mv.delete();
  return dst;
}


function makeFileName(files) {
  const fileName = files[0].name;
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
    statusElm.innerHTML = '';
    statusElm.textContent = '処理中…';

    try {
      files.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
      const dst = await combineImgs(files);

      cv.imshow(canvasElm, dst);
      const fileName = makeFileName(files);
      createSaveButton(fileName);

      dst.delete();
    } catch (err) {
      statusElm.textContent = 'エラー: ' + err;
      console.log('error: ', err);
    }
  }
}
