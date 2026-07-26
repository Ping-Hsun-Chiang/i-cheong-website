// 由 GitHub Actions 每日排程執行：從 Google Drive 資料夾同步「活動花絮」照片清單
// 本地手動測試：GDRIVE_API_KEY=xxx node scripts/sync-event-photos.js

const fs = require('fs');
const path = require('path');

const FOLDER_ID = '1H-3dUYeDhSUW8HhiuWrDXoaTVleNBF2x';
const API_KEY = process.env.GDRIVE_API_KEY;
const OUTPUT_FILE = path.join(__dirname, '..', 'event-photos-data.js');

if (!API_KEY) {
    console.error('缺少環境變數 GDRIVE_API_KEY');
    process.exit(1);
}

async function fetchAllFiles() {
    const files = [];
    let pageToken = '';
    const q = encodeURIComponent(
        `'${FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`
    );
    const fields = encodeURIComponent('nextPageToken, files(id,name,thumbnailLink,modifiedTime)');

    do {
        const url =
            `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}` +
            `&pageSize=1000&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Google Drive API 錯誤 ${res.status}: ${await res.text()}`);
        }
        const data = await res.json();
        files.push(...(data.files || []));
        pageToken = data.nextPageToken || '';
    } while (pageToken);

    return files;
}

function toSizedUrl(thumbnailLink, size) {
    return thumbnailLink.replace(/=s\d+$/, `=s${size}`);
}

(async () => {
    const files = await fetchAllFiles();
    files.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));

    const photos = files
        .filter(f => f.thumbnailLink)
        .map(f => ({
            id: f.id,
            name: f.name,
            thumb: toSizedUrl(f.thumbnailLink, 640),
            full: toSizedUrl(f.thumbnailLink, 1920),
        }));

    const content =
`// ══════════════════════════════════════════════════════════════════════════════
//  活動花絮照片資料檔（由 GitHub Actions 每日自動從 Google Drive 資料夾同步，請勿手動編輯）
//  新增照片：把照片加進共用的 Google Drive 資料夾即可，網站每天凌晨會自動同步更新
// ══════════════════════════════════════════════════════════════════════════════

const EVENT_PHOTOS = ${JSON.stringify(photos, null, 4)};
`;

    fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
    console.log(`已更新 event-photos-data.js — 共 ${photos.length} 張照片`);
})().catch(err => {
    console.error(err);
    process.exit(1);
});
