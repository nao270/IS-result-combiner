async function exe(obj) {
    const canvaselm = document.querySelector("#canvas");
    const statelm = document.querySelector("#status");
    
    try {
        statelm.innerHTML = "";
        statelm.textContent = "処理中…";

        // 画像のファイル名を昇順にソート
        const files = Array.from(obj.files);
        files.sort((a, b) => {
            const nameA = a.name.toUpperCase();
            const nameB = b.name.toUpperCase();
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0;
        });

        // 初期化
        cv = (cv instanceof Promise) ? await cv : cv;
        let mv = new cv.MatVector();
        let tmpl = false;

        for (const file of files) {
            // 画像読み込み
            const imgelm = new Image();
            const url = URL.createObjectURL(file);
            imgelm.src = url;
            await imgelm.decode();
            const src = cv.imread(imgelm);
            URL.revokeObjectURL(url);
            imgelm.remove();

            // mvに画像を追加
            let dst;
            if (tmpl !== false) {
                // テンプレートマッチング
                const result = new cv.Mat();
                cv.matchTemplate(src, tmpl, result, cv.TM_CCOEFF_NORMED);
                const mY = cv.minMaxLoc(result).maxLoc.y;

                // マッチング位置でトリミング
                const cropHeight = src.rows - mY - tmpl.rows;
                if (cropHeight > 0) {
                    const srcRect = new cv.Rect(0, mY + tmpl.rows, src.cols, cropHeight);
                    dst = src.roi(srcRect).clone();
                } else {
                    dst = src.clone();
                }

                result.delete();
                tmpl.delete();
            } else {
                dst = src.clone();
            }
            mv.push_back(dst);
            dst.delete();

            // テンプレート更新
            const tmplHeight = Math.round(src.rows * 0.1);
            const tmplRect = new cv.Rect(0, src.rows - tmplHeight, src.cols, tmplHeight);
            tmpl = src.roi(tmplRect).clone();
            src.delete(); 
        }
        if (tmpl) {tmpl.delete();}

        // 結合
        const dst = new cv.Mat();
        cv.vconcat(mv, dst);

        // 表示と保存ボタン作成
        cv.imshow(canvaselm, dst);
        const buttonelm = document.createElement("button");
        buttonelm.textContent = "保存";
        buttonelm.addEventListener("click", () => {
            canvaselm.toBlob((blob) => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                const fileName = files[0].name;
                const extension = fileName.slice(fileName.lastIndexOf('.') + 1);            
                const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'));
                a.download = nameWithoutExt + "_combined." + extension;
                a.click();
                URL.revokeObjectURL(a.href);
            });            
        });
        statelm.textContent = "";
        statelm.appendChild(buttonelm);

        mv.delete();
        dst.delete();
        
    } catch (err) {
        statelm.textContent = "エラー発生";
        console.log("error: ", err);
    }
}
