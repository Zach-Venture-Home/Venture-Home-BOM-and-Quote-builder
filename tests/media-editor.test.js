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
assert.match(app, /function syncPhotoWorkspaceFrame\(/,'photo workspace must follow the rendered photo dimensions');
assert.match(app, /photoWorkspaceMaxHeight\(\)-28/,'photo fit must use the available editor viewport height');
assert.match(app, /classList\.toggle\('mediaEditorActive',mediaActive\)/,'media editor viewport mode must be enabled from tab navigation');
assert.match(app, /function fittedCanvasTextLayout\(/,'responsive text layout helper is required');
assert.match(app, /Math\.abs\(w\),Math\.abs\(h\),Math\.max\(14,o\.size\|\|16\)/,'diagram text must render inside its resized box');
assert.match(app, /drawFittedCanvasText\(ctx,st\.text\|\|''/,'photo text must render inside its resized box');
assert.match(app, /const DIAGRAM_SYMBOL_GLYPHS=/,'diagram symbols must have a shared icon map');
assert.match(app, /symbol:diagramSymbol/,'placed diagram symbols must preserve their selected icon type');
assert.match(app, /function drawDiagramSymbol\(/,'diagram symbols must render their designated palette icon');
assert.match(app, /const APP_VERSION='v2\.2\.1'/,'app release version must be current');
assert.match(html, /styles\.css\?v=2\.2\.1["']/,'stylesheet URL must be cache-busted for the current release');
assert.match(html, /app\.js\?v=2\.2\.1["']/,'app script URL must be cache-busted for the current release');

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'duplicate HTML ids found');
for (const id of ['photoEditStatus', 'equipmentSearch', 'savePhotoButton', 'photoCanvasWrap', 'diagramEditStatus', 'diagramSaveTitle', 'saveDiagramButton']) {
  assert.ok(ids.includes(id), `missing #${id}`);
}

console.log('media-editor contract tests passed');
