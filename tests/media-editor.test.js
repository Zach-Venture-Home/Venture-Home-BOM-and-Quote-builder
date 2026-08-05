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
assert.match(app, /\{item:"Span Mlo 24 Panel",category:"Equipment",cost:2550\.00\}/,'Span Mlo 24 Panel must be available under Equipment at $2,550');
assert.match(app, /\{item:"500 KCMIL triplex by the ft",category:"Wire",cost:7\.04\}/,'500 KCMIL triplex must be available under Wire at $7.04 per foot');
assert.match(app, /\{item:"Dig only thru dirt by the ft",category:"Trench",cost:20\.00\}/,'dirt-only digging must be available under Trench at $20 per foot');
assert.match(app, /\{item:"Dig only thru concrete by the ft",category:"Trench",cost:40\.00\}/,'concrete-only digging must be available under Trench at $40 per foot');
assert.match(app, /\{item:"320 A Meter Main",category:"Enclosures",cost:1103\.01\}/,'320 A Meter Main must be available under Enclosures at $1,103.01');
assert.match(app, /\['Project Coordinating & Permits',customerPricing\.fees\]/,'customer proposal must use the approved fees label');
assert.match(app, /value===0 \|\| value===0\.125 \|\| value===0\.20/,'0%, 12.5%, and 20% must be valid markup choices');
assert.match(html, /name="materialMarkupMain" value="0"/,'main quote controls must include 0% markup');
assert.match(html, /name="materialMarkupPricing" value="0"/,'pricing review controls must include 0% markup');
assert.match(app, /const APP_VERSION='v2\.2\.7'/,'app release version must be current');
assert.match(html, /styles\.css\?v=2\.2\.7["']/,'stylesheet URL must be cache-busted for the current release');
assert.match(html, /app\.js\?v=2\.2\.7["']/,'app script URL must be cache-busted for the current release');

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'duplicate HTML ids found');
for (const id of ['photoEditStatus', 'equipmentSearch', 'savePhotoButton', 'photoCanvasWrap', 'diagramEditStatus', 'diagramSaveTitle', 'saveDiagramButton']) {
  assert.ok(ids.includes(id), `missing #${id}`);
}

console.log('media-editor contract tests passed');
