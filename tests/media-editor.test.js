const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

for (const name of [
  'redoPhotoDrawing', 'duplicateSelectedMarkup', 'moveSelectedPhotoLayer',
  'editPhoto', 'applyPhotoSelectionStyle', 'photoExportDataUrl',
  'redoDiagramObject', 'duplicateSelectedDiagramObject', 'moveSelectedDiagramLayer',
  'loadDiagram', 'applyDiagramSelectionStyle', 'diagramExportDataUrl'
]) assert.match(app, new RegExp(`function ${name}\\(`), `missing ${name}`);

assert.match(app, /originalData:currentPhotoOriginalData/);
assert.match(app, /strokes:photoSnapshot\(\)/);
assert.match(app, /objects:diagramSnapshot\(\)/);
assert.match(app, /sitePhotos:optionChecked\('internalPhotos'\)\?sitePhotos:\[\]/);
assert.match(app, /savedDiagrams:optionChecked\('internalDiagrams'\)\?savedDiagrams:\[\]/);
assert.doesNotMatch(app.match(/function saveDiagramImage\(\).*\n/)?.[0] || '', /prompt\(/);
assert.doesNotMatch(app, /\{item:"Minimum trench pricing",category:"Trench"/, 'manual trench-minimum material should stay hidden');

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'duplicate HTML ids found');
for (const id of ['photoEditStatus', 'equipmentSearch', 'savePhotoButton', 'diagramEditStatus', 'diagramSaveTitle', 'saveDiagramButton']) {
  assert.ok(ids.includes(id), `missing #${id}`);
}

console.log('media-editor contract tests passed');
