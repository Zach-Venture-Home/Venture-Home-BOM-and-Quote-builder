const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const equipmentLibrary = fs.readFileSync(path.join(root, 'equipment-library.js'), 'utf8');

for (const name of [
  'redoPhotoDrawing', 'duplicateSelectedMarkup', 'moveSelectedPhotoLayer',
  'editPhoto', 'applyPhotoSelectionStyle', 'photoExportDataUrl',
  'togglePhotoWorkspace', 'togglePhotoTools', 'rotatePhotoStroke',
  'setSelectedPhotoRotation', 'rotateSelectedPhotoMarkup',
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
assert.match(app, /wrap\.clientHeight-verticalPadding/,'photo fit must use the rendered editor viewport height');
assert.match(app, /classList\.toggle\('photoWorkspaceExpanded',next\)/,'photo editor must offer a full-window workspace');
assert.match(app, /classList\.toggle\('toolsCollapsed'\)/,'photo editor tool panels must be collapsible');
assert.match(app, /rotation:0, start:p/,'new equipment must start with a persisted rotation value');
assert.match(app, /hit\.handle==='rotate' \? 'rotate'/,'the round selection handle must start rotation mode');
assert.match(app, /ctx\.rotate\(geometry\.radians\)/,'equipment rendering must apply its saved rotation');
assert.match(app, /photoPointInMarkupFrame\(st,p\)/,'rotated hit testing must use inverse rotation');
assert.match(app, /canvas\.setPointerCapture\(event\.pointerId\)/,'photo manipulation must retain the active pointer outside the item bounds');
assert.match(app, /photoRotation'\)\?\.addEventListener\('input'/,'exact rotation entry must update while the value is edited');
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
assert.match(app, /\{item:"4 gang meter",category:"Enclosures",cost:1000\.67\}/,'4 gang meter must be available under Enclosures at $1,000.67');
assert.match(app, /\{item:"4 gang meter main",category:"Enclosures",cost:1915\.00\}/,'4 gang meter main must be available under Enclosures at $1,915.00');
assert.match(app, /\{item:"6 gang meter main",category:"Enclosures",cost:2295\.14\}/,'6 gang meter main must be available under Enclosures at $2,295.14');
assert.match(app, /\{item:"Meter Socket Pedestal Assembly",category:"Enclosures",cost:187\.19\}/,'Meter Socket Pedestal Assembly must be available under Enclosures at $187.19');
assert.match(app, /\['Project Coordinating & Permits',customerPricing\.fees\]/,'customer proposal must use the approved fees label');
assert.match(app, /function downloadCustomerDetailedPDF\(\)/,'customer detailed quote export must be available');
assert.match(app, /VenturePricing\.customerDetailedRows\(selected,currentMaterialMarkup\(\),currentLaborMultiplier\(\)\)/,'customer detailed quote must use customer-safe allocated line pricing');
assert.match(html, /Customer Detailed Quote PDF/,'documents tab must expose the customer detailed quote');
assert.match(html, /equipment-library\.js\?v=2\.3\.4/,'equipment cutout library must load before the app');
assert.match(app, /function equipmentAssetSource\(/,'photo editor must support external equipment cutouts');
for (const id of ['meter','tap_box','main_service_panel','ac_disconnect','enphase_combiner','tesla_solar_inverter','powerwall3','tesla_wall_connector','meter_main','subpanel','smart_panel','backup_gateway','ev_charger_pedestal','nema_14_50_receptacle','emt_1in_1ft','emt_1in_90','emt_1in_lb']) {
  assert.match(equipmentLibrary, new RegExp(`id:'${id}'`), `missing equipment cutout ${id}`);
}
assert.match(app, /value===0 \|\| value===0\.125 \|\| value===0\.20/,'0%, 12.5%, and 20% must be valid markup choices');
assert.match(app, /function currentLaborMultiplier\(\)\{return currentMaterialMarkup\(\)===0 && !zeroMarkupUsesLaborMultiplier\(\) \? 1 : LABOR_MULTIPLIER;\}/,'zero-markup pricing must support base labor and multiplied labor modes');
assert.match(app, /zeroMarkupLaborMultiplier:zeroMarkupUsesLaborMultiplier\(\)/,'saved projects and backups must retain the zero-markup labor mode');
assert.match(app, /p\.zeroMarkupLaborMultiplier===true/,'loading a project must restore the zero-markup labor mode');
assert.match(app, /current\.zeroMarkupLaborMultiplier===true/,'backup imports must restore the zero-markup labor mode');
assert.match(html, /name="materialMarkupMain" value="0"/,'main quote controls must include 0% markup');
assert.match(html, /name="materialMarkupPricing" value="0"/,'pricing review controls must include 0% markup');
assert.match(html, /data-zero-labor="true"> 0% \+ Labor 1\.3×/,'both markup control groups must expose the labor-only zero-markup mode');
assert.match(app, /const APP_VERSION='v2\.3\.4'/,'app release version must be current');
assert.match(html, /styles\.css\?v=2\.3\.4["']/,'stylesheet URL must be cache-busted for the current release');
assert.match(html, /pricing-core\.js\?v=2\.3\.4["']/,'pricing engine URL must be cache-busted for the current release');
assert.match(html, /app\.js\?v=2\.3\.4["']/,'app script URL must be cache-busted for the current release');

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'duplicate HTML ids found');
for (const id of ['photoEditStatus', 'equipmentSearch', 'savePhotoButton', 'photoCanvasWrap', 'photoRotation', 'photoWorkspaceToggle', 'photoToolsToggle', 'photoEditorSidebar', 'diagramEditStatus', 'diagramSaveTitle', 'saveDiagramButton']) {
  assert.ok(ids.includes(id), `missing #${id}`);
}

console.log('media-editor contract tests passed');
