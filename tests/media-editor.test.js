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
assert.match(app, /if\(style\.tool==='select'\)\{/,'photo drawing tools must be allowed to start over existing markup');
assert.doesNotMatch(app.match(/function endDiagramAction\(\).*\n/)?.[0] || '', /setDiagramTool\('select'\)/,'diagram drawing tool should remain active for overlapping and consecutive lines');
assert.match(app, /Math\.min\(widthScale,heightScale\)/,'photo fit must account for both viewport width and height');
assert.match(app, /classList\.toggle\('mediaEditorActive',mediaActive\)/,'media editor viewport mode must be enabled from tab navigation');
assert.match(app, /function fittedCanvasTextLayout\(/,'responsive text layout helper is required');
assert.match(app, /Math\.abs\(w\),Math\.abs\(h\),Math\.max\(14,o\.size\|\|16\)/,'diagram text must render inside its resized box');
assert.match(app, /drawFittedCanvasText\(ctx,st\.text\|\|''/,'photo text must render inside its resized box');

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'duplicate HTML ids found');
for (const id of ['photoEditStatus', 'equipmentSearch', 'savePhotoButton', 'diagramEditStatus', 'diagramSaveTitle', 'saveDiagramButton']) {
  assert.ok(ids.includes(id), `missing #${id}`);
}

console.log('media-editor contract tests passed');
