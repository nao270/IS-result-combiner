const TPL_H_RATE = 0.1;
const MT_SCALE = 0.5;
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


function grayResize(img) {
  const dst = new cv.Mat();
  const gray = new cv.Mat();
  cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY);
  cv.resize(gray, dst, new cv.Size(0, 0), MT_SCALE, MT_SCALE);
  gray.delete();
  return dst;
}


function detectMatchY(img, tpl) {
  const mtImg = grayResize(img);
  const mtTpl = grayResize(tpl);
  const result = new cv.Mat();

  cv.matchTemplate(mtImg, mtTpl, result, cv.TM_CCOEFF_NORMED);
  const mml = cv.minMaxLoc(result);
  const matchY = Math.round(mml.maxLoc.y / MT_SCALE);

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
      const cropH = src.rows - matchY - tpl.rows;
      if (cropH > 0) {
        const partRect = new cv.Rect(0, matchY + tpl.rows, src.cols, cropH);
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
  const extension = fileName.slice(dotPos + 1);
  const stem = fileName.slice(0, dotPos);
  return stem + '_combined.' + extension;
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
