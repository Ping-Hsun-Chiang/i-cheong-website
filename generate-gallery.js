// 本地執行：node generate-gallery.js
// 掃描 fig/delivery/ 並重建 delivery-data.js

const fs   = require('fs');
const path = require('path');

const dir  = 'fig/delivery';
const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const files = fs.existsSync(dir)
  ? fs.readdirSync(dir)
      .filter(f => exts.has(path.extname(f).toLowerCase()))
      .sort()
  : [];

const lines = files.map(f => `    'fig/delivery/${f}',`).join('\n');

const content =
`// ══════════════════════════════════════════════════════════════════════════════
//  交車照片牆資料檔（由 GitHub Actions 自動產生，請勿手動編輯）
//  新增照片：將圖片放入 fig/delivery/ 後 commit & push，CI 會自動更新此檔
// ══════════════════════════════════════════════════════════════════════════════

const DELIVERY_PHOTOS = [
${lines}
];
`;

fs.writeFileSync('delivery-data.js', content, 'utf8');
console.log(`✓ delivery-data.js 已更新，共 ${files.length} 張照片`);
