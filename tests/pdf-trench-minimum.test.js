const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const pricing=require('../pricing-core.js');

const appPath=path.join(__dirname,'..','app.js');
const app=fs.readFileSync(appPath,'utf8');
const logoPrefix='const BRAND_PDF_LOGO = ';
const logoStart=app.indexOf(logoPrefix);
const logoEnd=app.indexOf('\n',logoStart);
assert.ok(logoStart>=0&&logoEnd>logoStart,'brand logo source must be available');
const BRAND_PDF_LOGO=vm.runInNewContext('('+app.slice(logoStart+logoPrefix.length,logoEnd).replace(/;\s*$/,'')+')');
const builderStart=app.indexOf('function buildProfessionalPdf(doc){');
const builderEnd=app.lastIndexOf('\ninit();');
assert.ok(builderStart>=0&&builderEnd>builderStart,'professional PDF builder must be available');

const context={
  BRAND_PDF_LOGO,
  money:value=>Number(value).toLocaleString('en-US',{style:'currency',currency:'USD'}),
  currentPricingMode:()=> 'standard',
  laborSummaryLabel:()=> 'Labor after 1.3x multiplier',
  materialMarkupLabel:()=> '12.5%',
  dataUrlToHex:dataUrl=>Buffer.from(String(dataUrl).split(',')[1]||'','base64').toString('hex')+'>',
  console
};
vm.createContext(context);
vm.runInContext(app.slice(builderStart,builderEnd)+'\nglobalThis.buildProfessionalPdf=buildProfessionalPdf;',context);

const selected=[{item:'Dig only thru dirt by the ft',category:'Trench',cost:20,qty:10}];
const quoteRows=pricing.internalQuoteRows(selected);
const minimumRowCount=quoteRows.filter(row=>row.minimumApplied).length;
const rows=quoteRows.map(row=>({
  item:row.item+(minimumRowCount>1?' (share of $1,200 trench minimum)':' ($1,200 trench minimum applied)'),
  qty:String(row.qty),
  category:row.category,
  unitCost:context.money(row.baseUnitCost),
  lineTotal:context.money(row.baseLineTotal)
}));
const totals=pricing.calculateTotals(selected,.125,1.3);
const pdf=context.buildProfessionalPdf({
  type:'quote',
  title:'Custom Quote',
  rows,
  totals,
  projectName:'Trench Minimum QA',
  projectAddress:'1 Test Street',
  scopeOfWork:'Verify the trench minimum line and end markup.',
  sitePhotos:[],
  savedDiagrams:[]
});

assert.match(pdf,/\(\$1,200\.00\) Tj/,'PDF must display the $1,200 trench base line and materials subtotal');
assert.match(pdf,/\(\$150\.00\) Tj/,'PDF must display the separate 12.5% end markup');
assert.match(pdf,/\(\$1,350\.00\) Tj/,'PDF must retain the correct final total');
assert.doesNotMatch(pdf,/Minimum trench pricing adjustment/,'PDF must not expose a separate trench adjustment row');
assert.doesNotMatch(pdf,/\(\$1,000\.00\) Tj/,'PDF must not show the old $1,000 adjustment line');

if(process.env.VH_TRENCH_QA_PDF) fs.writeFileSync(process.env.VH_TRENCH_QA_PDF,Buffer.from(pdf,'latin1'));
console.log('trench minimum PDF tests passed');
