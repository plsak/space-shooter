import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const DEST = '/home/ubuntu/workspace/app/src/frontend/public/assets/generated';

const ZIPS = [
  { name: 'c1.zip', url: 'https://blob.caffeine.ai/v1/blob/?blob_hash=sha256%3A4a3aa7c437d729a7649415852982d7cb436d7604e0d2208e81c3a0030c7df08a&owner_id=r64yl-sqaaa-aaaaa-qdfsa-cai&project_id=019ae98f-6bb9-75ea-9ce9-6da93bf98ed1' },
  { name: 'c2.zip', url: 'https://blob.caffeine.ai/v1/blob/?blob_hash=sha256%3A0e866dbe47749a5ae31c79ad13981894868fabf3919979d95e7d6616924fb5a7&owner_id=r64yl-sqaaa-aaaaa-qdfsa-cai&project_id=019ae98f-6bb9-75ea-9ce9-6da93bf98ed1' },
  { name: 'c3.zip', url: 'https://blob.caffeine.ai/v1/blob/?blob_hash=sha256%3A9ad30066342069d775a398ca6dd7873e87e5dbdd5d243c482d9d8663a918d5d6&owner_id=r64yl-sqaaa-aaaaa-qdfsa-cai&project_id=019ae98f-6bb9-75ea-9ce9-6da93bf98ed1' },
  { name: 'c4.zip', url: 'https://blob.caffeine.ai/v1/blob/?blob_hash=sha256%3A9ab570bc91978de966848503c4cd8e79a222c554441cf305a8ae563135604ab7&owner_id=r64yl-sqaaa-aaaaa-qdfsa-cai&project_id=019ae98f-6bb9-75ea-9ce9-6da93bf98ed1' },
  { name: 'c5.zip', url: 'https://blob.caffeine.ai/v1/blob/?blob_hash=sha256%3A0d40947c96e775573f50bbbffc145b7ec5e09315f51c0dac3a7a8e5ef4f7adc8&owner_id=r64yl-sqaaa-aaaaa-qdfsa-cai&project_id=019ae98f-6bb9-75ea-9ce9-6da93bf98ed1' },
  { name: 'c6.zip', url: 'https://blob.caffeine.ai/v1/blob/?blob_hash=sha256%3Abb0230118f8bda60243a77f813dff5d3129c019ca823d68afd507727015596cb&owner_id=r64yl-sqaaa-aaaaa-qdfsa-cai&project_id=019ae98f-6bb9-75ea-9ce9-6da93bf98ed1' },
];

function download(url, redirects = 10) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        resolve(download(res.headers.location, redirects - 1));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

// Minimal ZIP parser - no zlib needed for stored files, inflate for deflated
function parseZip(buf) {
  const entries = [];
  let i = 0;
  while (i < buf.length - 4) {
    const sig = buf.readUInt32LE(i);
    if (sig === 0x04034b50) { // Local file header
      const compression = buf.readUInt16LE(i + 8);
      const compressedSize = buf.readUInt32LE(i + 18);
      const uncompressedSize = buf.readUInt32LE(i + 22);
      const fnLen = buf.readUInt16LE(i + 26);
      const extraLen = buf.readUInt16LE(i + 28);
      const filename = buf.slice(i + 30, i + 30 + fnLen).toString('utf8');
      const dataStart = i + 30 + fnLen + extraLen;
      const compressedData = buf.slice(dataStart, dataStart + compressedSize);
      entries.push({ filename, compression, compressedData, uncompressedSize });
      i = dataStart + compressedSize;
    } else if (sig === 0x02014b50 || sig === 0x06054b50) {
      break; // Central directory or EOCD
    } else {
      i++;
    }
  }
  return entries;
}

async function extractEntry(entry) {
  if (entry.compression === 0) {
    return entry.compressedData;
  } else if (entry.compression === 8) {
    return new Promise((resolve, reject) => {
      zlib.inflateRaw(entry.compressedData, (err, data) => {
        if (err) reject(err); else resolve(data);
      });
    });
  } else {
    throw new Error('Unsupported compression method: ' + entry.compression);
  }
}

const existingFiles = new Set(fs.readdirSync(DEST));
console.log('Existing files in dest: ' + existingFiles.size);

let totalExtracted = 0;
let totalSkipped = 0;

for (const { name, url } of ZIPS) {
  console.log('\nDownloading ' + name + '...');
  const buf = await download(url);
  console.log('  Downloaded ' + buf.length + ' bytes');
  const entries = parseZip(buf);
  console.log('  Found ' + entries.length + ' entries');
  for (const entry of entries) {
    if (!entry.filename || entry.filename.endsWith('/')) continue;
    const basename = path.basename(entry.filename);
    if (!basename) continue;
    const destPath = path.join(DEST, basename);
    if (existingFiles.has(basename)) {
      console.log('  SKIP (exists): ' + basename);
      totalSkipped++;
      continue;
    }
    const data = await extractEntry(entry);
    fs.writeFileSync(destPath, data);
    existingFiles.add(basename);
    console.log('  EXTRACTED: ' + basename + ' (' + data.length + ' bytes)');
    totalExtracted++;
  }
}

console.log('\n=== DONE ===');
console.log('Extracted: ' + totalExtracted + ', Skipped: ' + totalSkipped);

const finalFiles = fs.readdirSync(DEST).filter(f => f.endsWith('.png'));
console.log('Total PNG files in dest: ' + finalFiles.length);
finalFiles.sort().forEach(f => console.log('  ' + f));
