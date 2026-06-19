let dstName;


export async function loadImg(file) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.src = url;
  await img.decode();
  URL.revokeObjectURL(url);
  return img;
}


export function updateDstName(file) {
  const fileName = file.name;
  const dotPos = fileName.lastIndexOf('.');
  const extension = fileName.slice(dotPos);
  const stem = fileName.slice(0, dotPos);
  dstName = stem + '_combined' + extension;
}


export function saveDst(dstCanvas) {
  dstCanvas.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = dstName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
}
