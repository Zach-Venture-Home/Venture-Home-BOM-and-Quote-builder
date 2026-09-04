const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const start = app.indexOf('const PRESET_STORAGE_KEY');
const end = app.indexOf('\nfunction saveSelectionAsPreset', start);
assert.ok(start >= 0 && end > start, 'pricing-library application functions must be available');

const library = {
  'Service Upgrade': {
    scope: 'Service Upgrade',
    scopeText: 'Replace service equipment.',
    items: [
      {item: 'Main Panel', category: 'Equipment', qty: 1},
      {item: 'Main Panel', category: 'Equipment', qty: 2},
      {item: 'Labor Electrician', category: 'Labor', qty: 4},
      {item: 'Permit Fee - $200', category: 'Fees', qty: 1}
    ]
  }
};
const elements = {presetPicker: {value: ''}, workType: {value: ''}};
const notices = [];
const storage = new Map([['vh_scopePresets', JSON.stringify(library)], ['vh_autoApplyPreset', 'true']]);
const context = vm.createContext({
  Array, Date, JSON, Map, Number, Object, Set, String,
  WORK_TYPES: [],
  materials: [
    {item: 'Main Panel', category: 'Equipment', cost: 800},
    {item: 'Labor Electrician', category: 'Labor', cost: 50},
    {item: 'Permit Fee - $200', category: 'Fees', cost: 200}
  ],
  selected: [],
  localStorage: {getItem: key => storage.has(key) ? storage.get(key) : null, setItem: (key, value) => storage.set(key, value)},
  document: {getElementById: id => elements[id] || null},
  applyWorkType: () => {},
  persist: () => {},
  renderSelected: () => {},
  updatePresetStatus: () => {},
  populateWorkTypes: () => {},
  showNotice: message => notices.push(message),
  confirm: () => true,
  alert: message => { throw new Error(message); },
  prompt: () => null
});
vm.runInContext(app.slice(start, end), context);

function assertCompleteCalculatorSelection(label) {
  const rows = context.selected;
  assert.equal(rows.length, 3, label + ' must populate material, labor, and fee rows');
  assert.deepEqual(Array.from(rows, row => [row.item, row.category, row.cost, row.qty]), [
    ['Main Panel', 'Equipment', 800, 3],
    ['Labor Electrician', 'Labor', 50, 4],
    ['Permit Fee - $200', 'Fees', 200, 1]
  ], label + ' must preserve current costs and quantities while merging duplicates');
}

vm.runInContext('applyPresetByScope("Service Upgrade", {silent:false,confirmReplace:false})', context);
assertCompleteCalculatorSelection('manual library application');

context.selected = [];
vm.runInContext('maybeAutoApplyPresetForWorkType("Service Upgrade")', context);
assertCompleteCalculatorSelection('work-type auto-fill');

context.selected = [];
vm.runInContext('loadPricingLibraryEntry("Service Upgrade")', context);
assertCompleteCalculatorSelection('Pricing Library selection');
assert.equal(elements.presetPicker.value, 'Service Upgrade');
assert.equal(elements.workType.value, 'Service Upgrade');
assert.ok(notices.some(message => /applied to the calculator/.test(message)), 'successful selection must notify the user');

console.log('pricing library application tests passed');
