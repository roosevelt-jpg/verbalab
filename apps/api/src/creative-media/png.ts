/** Minimal uncompressed RGB PNG encoder (no native deps). */

function crcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
}

const CRC = crcTable();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u32(n: number): Uint8Array {
  return Uint8Array.of((n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff);
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = u32(data.length);
  const body = Buffer.concat([typeBytes, Buffer.from(data)]);
  const crc = u32(crc32(new Uint8Array(body)));
  return Buffer.concat([Buffer.from(len), body, Buffer.from(crc)]);
}

/** Deflate-store (no compression) zlib stream for small images. */
function zlibStore(raw: Uint8Array): Buffer {
  const blocks: Buffer[] = [];
  let offset = 0;
  while (offset < raw.length) {
    const size = Math.min(65535, raw.length - offset);
    const last = offset + size >= raw.length;
    const header = Buffer.alloc(5);
    header[0] = last ? 0x01 : 0x00;
    header[1] = size & 0xff;
    header[2] = (size >>> 8) & 0xff;
    header[3] = (~size) & 0xff;
    header[4] = ((~size) >>> 8) & 0xff;
    blocks.push(header, Buffer.from(raw.subarray(offset, offset + size)));
    offset += size;
  }
  const deflated = Buffer.concat(blocks);
  // zlib header 78 01 + adler32
  let s1 = 1;
  let s2 = 0;
  for (let i = 0; i < raw.length; i += 1) {
    s1 = (s1 + raw[i]!) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  const adler = u32(((s2 << 16) | s1) >>> 0);
  return Buffer.concat([Buffer.from([0x78, 0x01]), deflated, Buffer.from(adler)]);
}

export function encodePngRgb(
  width: number,
  height: number,
  fill: (x: number, y: number) => [number, number, number],
): Buffer {
  const stride = 1 + width * 3;
  const raw = new Uint8Array(stride * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * stride;
    raw[row] = 0; // filter none
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = fill(x, y);
      const i = row + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.concat([
    Buffer.from(u32(width)),
    Buffer.from(u32(height)),
    Buffer.from([8, 2, 0, 0, 0]),
  ]);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', new Uint8Array(ihdr)),
    chunk('IDAT', new Uint8Array(zlibStore(raw))),
    chunk('IEND', new Uint8Array(0)),
  ]);
}
