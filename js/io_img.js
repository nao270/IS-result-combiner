const DEFAULT = 'combined';
const EXTENSION = '.png';
const MIME_TYPE = 'image/png';
let dstName;


async function loadImg(file) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.src = url;
  await img.decode();
  URL.revokeObjectURL(url);
  return img;
}


function updateDstName(fileName) {
  const stem = fileName.slice(0, fileName.lastIndexOf('.'));
  dstName = stem + '_' + DEFAULT + EXTENSION;
}


function saveDst(dst) {
  dst.toBlob(async blob => {
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: dstName,
          types: [{
            description: 'Images',
            accept: { [MIME_TYPE]: [EXTENSION] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      }
      catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      }
    }
    else {
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = dstName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
}


export { loadImg, updateDstName, saveDst };
