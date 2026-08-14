const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'equipment-library.js'), 'utf8');
const context = {};
vm.runInNewContext(`${source}\nthis.library = PHOTO_EQUIPMENT_LIBRARY;`, context);
const library = context.library;

assert.ok(Array.isArray(library));
assert.equal(library.length, 17, 'unexpected equipment cutout count');
assert.equal(new Set(library.map(item => item.id)).size, library.length, 'equipment IDs must be unique');

function inspectPng(filePath) {
  const data = fs.readFileSync(filePath);
  assert.equal(data.subarray(1, 4).toString(), 'PNG', `${filePath} must be a PNG`);
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  const colorType = data[25];
  assert.equal(colorType, 6, `${filePath} must use RGBA pixels`);
  const idat = [];
  let offset = 8;
  while (offset < data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.subarray(offset + 4, offset + 8).toString();
    if (type === 'IDAT') idat.push(data.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  let prior = Buffer.alloc(stride);
  let transparent = 0;
  for (let y = 0; y < height; y++) {
    const filter = inflated[y * (stride + 1)];
    const raw = inflated.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const left = x >= bytesPerPixel ? row[x - bytesPerPixel] : 0;
      const up = prior[x];
      const upperLeft = x >= bytesPerPixel ? prior[x - bytesPerPixel] : 0;
      let value = raw[x];
      if (filter === 1) value = (value + left) & 255;
      else if (filter === 2) value = (value + up) & 255;
      else if (filter === 3) value = (value + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) {
        const p = left + up - upperLeft;
        const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upperLeft);
        value = (value + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upperLeft)) & 255;
      }
      row[x] = value;
    }
    for (let x = 3; x < stride; x += 4) if (row[x] === 0) transparent++;
    prior = row;
  }
  return {width, height, transparent};
}

for (const item of library) {
  assert.match(item.id, /^[a-z0-9_]+$/);
  assert.ok(item.name && item.category);
  assert.match(item.src, /^assets\/equipment\/[a-z0-9-]+\.png$/);
  const filePath = path.join(root, item.src);
  assert.ok(fs.existsSync(filePath), `missing ${item.src}`);
  const png = inspectPng(filePath);
  assert.ok(png.width >= 300 && png.height >= 300, `${item.id} is too small`);
  assert.ok(png.transparent > png.width * png.height * 0.05, `${item.id} needs a transparent background`);
}

console.log('equipment library tests passed');
