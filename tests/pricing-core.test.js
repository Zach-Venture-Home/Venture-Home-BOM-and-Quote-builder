const assert=require('node:assert/strict');
const pricing=require('../pricing-core.js');

const total=(rows,markup=.125,laborMultiplier=1.3)=>pricing.calculateTotals(rows,markup,laborMultiplier);
assert.equal(total([{item:'Trench thru dirt by the ft',category:'Trench',cost:40,qty:10}]).materialServicesBase,1200);
assert.equal(total([{item:'Trench thru concrete by the ft',category:'Trench',cost:60,qty:25}]).materialServicesBase,1500);
assert.equal(total([{item:'Dig only thru dirt by the ft',category:'Trench',cost:20,qty:10}]).materialServicesBase,1200);
assert.equal(total([{item:'Dig only thru concrete by the ft',category:'Trench',cost:40,qty:31}]).materialServicesBase,1240);
assert.equal(total([{item:'Minimum trench pricing',category:'Trench',cost:1200,qty:1}]).materialServicesBase,1200);
assert.equal(total([{item:'Trench thru dirt by the ft',category:'Trench',cost:40,qty:10},{item:'Minimum trench pricing',category:'Trench',cost:1200,qty:1}]).materialServicesBase,1200);
const internalTrenchRows=pricing.internalQuoteRows([{item:'Dig only thru dirt by the ft',category:'Trench',cost:20,qty:10}]);
assert.equal(internalTrenchRows.length,1);
assert.equal(internalTrenchRows[0].baseLineTotal,1200);
assert.equal(internalTrenchRows[0].baseUnitCost,120);
assert.equal(internalTrenchRows[0].minimumApplied,true);
assert.equal(internalTrenchRows.some(row=>row.automatic),false);
const multiTrenchRows=pricing.internalQuoteRows([
  {item:'Dig only thru dirt by the ft',category:'Trench',cost:20,qty:10},
  {item:'Dig only thru concrete by the ft',category:'Trench',cost:40,qty:5}
]);
assert.equal(multiTrenchRows.length,2);
assert.equal(multiTrenchRows.reduce((sum,row)=>sum+row.baseLineTotal,0),1200);
assert.equal(multiTrenchRows.every(row=>row.minimumApplied),true);
const exactMinimumRows=pricing.internalQuoteRows([{item:'Dig only thru concrete by the ft',category:'Trench',cost:40,qty:30}]);
assert.equal(exactMinimumRows[0].baseLineTotal,1200);
assert.equal(exactMinimumRows[0].minimumApplied,false);
const legacyMinimumRows=pricing.internalQuoteRows([{item:'Minimum trench pricing',category:'Trench',cost:1200,qty:1}]);
assert.equal(legacyMinimumRows.length,1);
assert.equal(legacyMinimumRows[0].item,'Trenching');
assert.equal(legacyMinimumRows[0].baseLineTotal,1200);
assert.equal(legacyMinimumRows[0].minimumApplied,true);
const overMinimumRows=pricing.internalQuoteRows([{item:'Dig only thru concrete by the ft',category:'Trench',cost:40,qty:40}]);
assert.equal(overMinimumRows[0].baseLineTotal,1600);
assert.equal(overMinimumRows[0].baseUnitCost,40);
assert.equal(overMinimumRows[0].minimumApplied,false);
const mixedInternalRows=pricing.internalQuoteRows([
  {item:'Dig only thru dirt by the ft',category:'Trench',cost:20,qty:10},
  {item:'Panel',category:'Equipment',cost:100,qty:1}
]);
assert.equal(mixedInternalRows.reduce((sum,row)=>sum+row.baseLineTotal,0),1300);
assert.equal(mixedInternalRows.find(row=>row.item==='Panel').baseLineTotal,100);
const mixedTotals=total([
  {item:'Dig only thru dirt by the ft',category:'Trench',cost:20,qty:10},
  {item:'Panel',category:'Equipment',cost:100,qty:1}
]);
assert.equal(mixedTotals.beforeMarkup,1300);
assert.equal(mixedTotals.markupAmount,162.5);
assert.equal(mixedTotals.grand,1462.5);
for(const [markup,expectedMarkup,expectedGrand] of [[0,0,1200],[.125,150,1350],[.20,240,1440]]){
  const quote=total([{item:'Dig only thru dirt by the ft',category:'Trench',cost:20,qty:10}],markup,1.3);
  assert.equal(internalTrenchRows.reduce((sum,row)=>sum+row.baseLineTotal,0),1200);
  assert.equal(quote.beforeMarkup,1200);
  assert.equal(quote.markupAmount,expectedMarkup);
  assert.equal(quote.grand,expectedGrand);
}
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
const twentyFivePercentQuote=total([{item:'Panel',category:'Equipment',cost:1000,qty:1}],.25,1.3);
assert.equal(twentyFivePercentQuote.beforeMarkup,1000);
assert.equal(twentyFivePercentQuote.markupAmount,250);
assert.equal(twentyFivePercentQuote.grand,1250);
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
const detailedMultiTrenchRows=pricing.customerDetailedRows([
  {item:'Dig only thru dirt by the ft',category:'Trench',cost:20,qty:10},
  {item:'Dig only thru concrete by the ft',category:'Trench',cost:40,qty:5}
],.125,1.3);
assert.equal(detailedMultiTrenchRows.reduce((sum,row)=>sum+row.customerPrice,0),1350);
assert.equal(pricing.validateProject({rows:[]}).length,5);
assert.equal(pricing.validateProject({projectName:'Smith',projectAddress:'1 Main St',workType:'EV Charger',scopeOfWork:'Install charger',rows:[{item:'Charger',category:'Equipment',cost:1,qty:1}]}).length,0);
console.log('pricing-core tests passed');
