/**
 * Minimal lossless PNG read/write (8-bit RGB/RGBA, non-interlaced) for asset tooling.
 * Pixels are returned and accepted as RGBA.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';

export function readPng(file) {
  const b = readFileSync(file);
  const w = b.readUInt32BE(16);
  const h = b.readUInt32BE(20);
  const ct = b[25];
  if (b[24] !== 8 || (ct !== 6 && ct !== 2) || b[28] !== 0) throw new Error(`${file}: unsupported PNG`);
  const idat = [];
  for (let p = 8; p < b.length; ) {
    const len = b.readUInt32BE(p);
    if (b.toString('ascii', p + 4, p + 8) === 'IDAT') idat.push(b.subarray(p + 8, p + 8 + len));
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = ct === 6 ? 4 : 3;
  const stride = w * bpp;
  const px = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const up = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (ft === 1) v += a;
      else if (ft === 2) v += up;
      else if (ft === 3) v += (a + up) >> 1;
      else if (ft === 4) {
        const pa = Math.abs(up - c), pb = Math.abs(a - c), pc = Math.abs(a + up - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c;
      }
      cur[x] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      px[o] = cur[x * bpp];
      px[o + 1] = cur[x * bpp + 1];
      px[o + 2] = cur[x * bpp + 2];
      px[o + 3] = bpp === 4 ? cur[x * bpp + 3] : 255;
    }
    prev = cur;
  }
  return { w, h, px };
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

export function writePng(file, { w, h, px }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}
