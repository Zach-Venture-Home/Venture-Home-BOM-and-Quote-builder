const assert=require('node:assert/strict');
const pricing=require('../pricing-core.js');

const total=(rows,markup=.125,laborMultiplier=1.3)=>pricing.calculateTotals(rows,markup,laborMultiplier);
assert.equal(total([{item:'Trench thru dirt by the ft',category:'Trench',cost:40,qty:10}]).materialServicesBase,1200);
assert.equal(total([{item:'Trench thru concrete by the ft',category:'Trench',cost:60,qty:25}]).materialServicesBase,1500);
assert.equal(total([{item:'Dig only thru dirt by the ft',category:'Trench',cost:20,qty:10}]).materialServicesBase,1200);
assert.equal(total([{item:'Dig only thru concrete by the ft',category:'Trench',cost:40,qty:31}]).materialServicesBase,1240);
assert.equal(total([{item:'Minimum trench pricing',category:'Trench',cost:1200,qty:1}]).materialServicesBase,1200);
assert.equal(total([{item:'Trench thru dirt by the ft',category:'Trench',cost:40,qty:10},{item:'Minimum trench pricing',category:'Trench',cost:1200,qty:1}]).materialServicesBase,1200);
const laborQuote=total([{item:'Labor',category:'Labor',cost:100,qty:2}]);
assert.equal(laborQuote.laborBase,200);
assert.equal(laborQuote.laborAdjusted,260);
assert.equal(laborQuote.beforeMarkup,260);
assert.equal(laborQuote.markupAmount,32.5);
assert.equal(laborQuote.grand,292.5);
const noMarkupQuote=total([{item:'Panel',category:'Equipment',cost:1000,qty:1},{item:'Labor',category:'Labor',cost:100,qty:2}],0,1);
assert.equal(noMarkupQuote.laborBase,200);
assert.equal(noMarkupQuote.laborMultiplierAmount,0);
assert.equal(noMarkupQuote.laborAdjusted,200);
assert.equal(noMarkupQuote.beforeMarkup,1200);
assert.equal(noMarkupQuote.markupAmount,0);
assert.equal(noMarkupQuote.grand,1200);
const laborOnlyQuote=total([{item:'Panel',category:'Equipment',cost:1000,qty:1},{item:'Labor',category:'Labor',cost:100,qty:2}],0,1.3);
assert.equal(laborOnlyQuote.laborAdjusted,260);
assert.equal(laborOnlyQuote.markupAmount,0);
assert.equal(laborOnlyQuote.grand,1260);
const detailedRows=pricing.customerDetailedRows([
  {item:'Panel',category:'Equipment',cost:1000,qty:1},
  {item:'Labor',category:'Labor',cost:100,qty:2}
],.125,1.3);
assert.equal(detailedRows.reduce((sum,row)=>sum+row.customerPrice,0),1417.5);
assert.equal(detailedRows.find(row=>row.item==='Labor').customerPrice,292.5);
const detailedTrenchRows=pricing.customerDetailedRows([{item:'Dig only thru dirt by the ft',category:'Trench',cost:20,qty:10}],.125,1.3);
assert.equal(detailedTrenchRows.length,1);
assert.equal(detailedTrenchRows[0].customerPrice,1350);
assert.equal(detailedTrenchRows.some(row=>row.automatic),false);
assert.equal(pricing.validateProject({rows:[]}).length,5);
assert.equal(pricing.validateProject({projectName:'Smith',projectAddress:'1 Main St',workType:'EV Charger',scopeOfWork:'Install charger',rows:[{item:'Charger',category:'Equipment',cost:1,qty:1}]}).length,0);
console.log('pricing-core tests passed');
