# 機械錶怎麼走：一頁互動圖解

以開源瑞士機芯 OM10 為例，用四張可以操作的 SVG 圖解，說明機械錶的能量路徑：錶冠 → 發條盒 → 輪系 → 擒縱 → 擺輪。

| 章 | 可以做什麼 |
|---|---|
| 1 錶冠三段 | 拉出錶冠切換段位；轉動錶冠上鍊、調日期、調時間，旁邊的小錶盤會跟著變 |
| 2 上鍊與動力儲存 | 按住上鍊，看主發條捲緊、動力儲存增加；反轉被棘爪擋住；上滿後打滑；快轉放鍊 |
| 3 輪系齒數比 | 真實齒數的五個輪依真實轉速比轉動，可切換 1×／60×／3600×；點一組嚙合查看齒數比 |
| 4 擒縱的四個階段 | 按鎖定／解鎖／衝擊／落下，零件以動畫轉到該階段，標出接觸點和能量去向 |

- 線上版：https://sean0331-1.github.io/watch-explainer/
- 網站：單一 [`index.html`](index.html)，不使用任何 JavaScript 函式庫，直接用瀏覽器打開即可
- 規格書：[`SPEC.md`](SPEC.md)
- 修改紀錄：[`CHANGELOG.md`](CHANGELOG.md)
- 驗收檢查與截圖：`node tests/check.mjs`（需要 Playwright 和 Microsoft Edge）

資料來源：[OM10 Technical Information](https://openmovement.org/documents/OM10/OM10_Technical_Information_20210314.pdf)（openmovement，CC BY-SA 3.0）。
