const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const helperNames = [
  'cloneStroke',
  'rotatePhotoStroke',
  'markupBounds',
  'normalizePhotoRotation',
  'photoMarkupCanRotate',
  'rotatePhotoPoint',
  'photoMarkupGeometry',
  'photoPointInMarkupFrame',
  'photoCanvasUiScale',
  'resizeRotatedPhotoStroke',
  'selectionHandles'
];

function extractTopLevelFunction(name) {
  const marker = `function ${name}(`;
  const start = app.indexOf(marker);
  assert.notEqual(start, -1, `missing ${name} in app.js`);
  const next = app.indexOf('\nfunction ', start + marker.length);
  assert.notEqual(next, -1, `could not find the end of ${name} in app.js`);
  return app.slice(start, next);
}

const canvas = {
  width: 1000,
  getBoundingClientRect: () => ({width: 1000})
};
const context = {
  document: {
    getElementById(id) {
      assert.equal(id, 'photoCanvas');
      return canvas;
    }
  }
};
vm.createContext(context);
vm.runInContext(
  `${helperNames.map(extractTopLevelFunction).join('\n')}\nthis.helpers={${helperNames.join(',')}};`,
  context
);

const {
  normalizePhotoRotation,
  photoPointInMarkupFrame,
  resizeRotatedPhotoStroke,
  rotatePhotoStroke,
  selectionHandles
} = context.helpers;

function approx(actual, expected, message, epsilon = 1e-9) {
  assert.ok(
    Number.isFinite(actual) && Math.abs(actual - expected) <= epsilon,
    `${message}: expected ${expected}, received ${actual}`
  );
}

function handle(handles, name) {
  const result = handles.find(item => item.name === name);
  assert.ok(result, `missing ${name} selection handle`);
  return result;
}

function approxPoint(actual, expected, message) {
  approx(actual.x, expected.x, `${message} x`);
  approx(actual.y, expected.y, `${message} y`);
}

assert.equal(normalizePhotoRotation(undefined), 0, 'legacy rotation must default to zero');
assert.equal(normalizePhotoRotation(Number.NaN), 0, 'NaN rotation must default to zero');
assert.equal(normalizePhotoRotation(Number.POSITIVE_INFINITY), 0, 'infinite rotation must default to zero');
assert.equal(normalizePhotoRotation('45'), 45, 'numeric strings must normalize');
assert.equal(normalizePhotoRotation(360), 0, 'full turns must normalize to zero');
assert.equal(normalizePhotoRotation(540), -180, 'positive rotations must wrap into the signed range');
assert.equal(normalizePhotoRotation(-181), 179, 'negative rotations must wrap into the signed range');

const equipment = {
  type: 'equipment',
  assetId: 'main_service_panel',
  opacity: 0.8,
  rotation: 90,
  start: {x: 60, y: 40},
  end: {x: 140, y: 80}
};

const handles = selectionHandles(equipment);
assert.equal(handles.length, 9, 'rotatable equipment must expose eight resize handles and one rotation handle');
const expectedHandles = {
  nw: {x: 120, y: 20},
  n: {x: 120, y: 60},
  ne: {x: 120, y: 100},
  e: {x: 100, y: 100},
  se: {x: 80, y: 100},
  s: {x: 80, y: 60},
  sw: {x: 80, y: 20},
  w: {x: 100, y: 20},
  rotate: {x: 152, y: 60}
};
for (const [name, point] of Object.entries(expectedHandles)) {
  approxPoint(handle(handles, name), point, `${name} handle must rotate around the equipment center`);
}

approxPoint(
  photoPointInMarkupFrame(equipment, {x: 100, y: 95}),
  {x: 135, y: 60},
  'inverse frame must map a point inside the rotated equipment to local coordinates'
);
approxPoint(
  photoPointInMarkupFrame(equipment, {x: 135, y: 60}),
  {x: 100, y: 25},
  'inverse frame must expose points outside the rotated equipment local bounds'
);

function gesturePoint(degrees, radius = 100) {
  const radians = (degrees - 90) * Math.PI / 180;
  return {x: 100 + Math.cos(radians) * radius, y: 60 + Math.sin(radians) * radius};
}

const unsnapped = rotatePhotoStroke(equipment, gesturePoint(22), false);
approx(unsnapped.rotation, 22, 'rotation gesture must follow the pointer angle');
const snapped = rotatePhotoStroke(equipment, gesturePoint(22), true);
assert.equal(snapped.rotation, 15, 'shift rotation gesture must snap to 15-degree increments');
assert.equal(equipment.rotation, 90, 'rotation gestures must not mutate the source snapshot');
assert.notEqual(unsnapped, equipment, 'rotation gestures must return a cloned stroke');

const beforeResize = JSON.stringify(equipment);
const originalNorthWest = handle(handles, 'nw');
const dragTarget = {x: 60, y: 120};
const resized = resizeRotatedPhotoStroke(equipment, 'se', dragTarget);
const resizedHandles = selectionHandles(resized);
approxPoint(
  handle(resizedHandles, 'nw'),
  originalNorthWest,
  'rotated resize must keep the opposite anchor fixed in world coordinates'
);
approxPoint(
  handle(resizedHandles, 'se'),
  dragTarget,
  'rotated resize must place the dragged handle at the pointer'
);
assert.equal(resized.rotation, equipment.rotation, 'rotated resize must preserve rotation');
assert.equal(JSON.stringify(equipment), beforeResize, 'rotated resize must not mutate its source snapshot');

console.log('photo editor geometry tests passed');
