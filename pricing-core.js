(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.VenturePricing=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const TRENCH_MINIMUM=1200;
  const roundMoney=value=>Math.round((Number.isFinite(Number(value))?Number(value):0)*100)/100;
  const quantity=value=>{const n=Number(value);return Number.isFinite(n)&&n>0?Math.min(n,100000):0;};
  const category=row=>String(row?.category||'').trim().toLowerCase();
  const name=row=>String(row?.item||'').trim().toLowerCase();
  const isLabor=row=>category(row)==='labor';
  const isFee=row=>category(row)==='fees'||['permit fee','disco/reco fee','truck roll x1'].includes(name(row));
  const isRepair=row=>['repairs','drywall repair'].includes(category(row));
  const isTrenchMinimum=row=>category(row)==='trench'&&name(row)==='minimum trench pricing';
  const isMeasuredTrench=row=>category(row)==='trench'&&!isTrenchMinimum(row);
  function effectiveRows(rows){
    const source=(Array.isArray(rows)?rows:[]).filter(row=>quantity(row?.qty)>0);
    const hasMinimum=source.some(isTrenchMinimum);
    const measured=source.filter(isMeasuredTrench).reduce((sum,row)=>sum+roundMoney(Number(row.cost)*quantity(row.qty)),0);
    const result=source.filter(row=>!isTrenchMinimum(row)).map(row=>({...row,qty:quantity(row.qty)}));
    if(hasMinimum||measured>0){
      const adjustment=roundMoney(Math.max(0,TRENCH_MINIMUM-measured));
      if(adjustment>0) result.push({item:measured>0?'Minimum trench pricing adjustment':'Minimum trench pricing',category:'Trench',cost:adjustment,qty:1,automatic:true});
    }
    return result;
  }
  function calculateTotals(rows,markup=0.125,laborMultiplier=1.3){
    let materialBase=0,repairBase=0,adminFeeBase=0,materialServicesBase=0,laborBase=0;
    effectiveRows(rows).forEach(row=>{
      const base=roundMoney(Number(row.cost)*quantity(row.qty));
      if(isLabor(row)) laborBase=roundMoney(laborBase+base);
      else if(isFee(row)) adminFeeBase=roundMoney(adminFeeBase+base);
      else {materialServicesBase=roundMoney(materialServicesBase+base);if(isRepair(row))repairBase=roundMoney(repairBase+base);else materialBase=roundMoney(materialBase+base);}
    });
    const laborMultiplierAmount=roundMoney(laborBase*(laborMultiplier-1));
    const laborAdjusted=roundMoney(laborBase*laborMultiplier);
    const nonLaborBase=roundMoney(materialServicesBase+adminFeeBase);
    const beforeMarkup=roundMoney(nonLaborBase+laborAdjusted);
    const markupAmount=roundMoney(beforeMarkup*markup);
    const grand=roundMoney(beforeMarkup+markupAmount);
    return {materialBase,repairBase,feeBase:adminFeeBase,adminFeeBase,adminFeeSell:adminFeeBase,materialMarkup:0,feeMarkup:0,nonLaborBase,markupAmount,nonLaborSell:nonLaborBase,materialServicesBase,materialServicesSell:materialServicesBase,laborBase,laborMultiplierAmount,laborMarkup:laborMultiplierAmount,laborAdjusted,laborSell:laborAdjusted,beforeMarkup,materialSell:materialServicesBase,fees:adminFeeBase,grand,trenchAdjustment:effectiveRows(rows).filter(row=>row.automatic).reduce((sum,row)=>sum+row.cost,0)};
  }
  function internalQuoteRows(rows){
    const effective=effectiveRows(rows);
    const adjustmentCents=effective.filter(row=>row.automatic).reduce((sum,row)=>sum+Math.round(roundMoney(Number(row.cost)*quantity(row.qty))*100),0);
    const visible=effective.filter(row=>!row.automatic).map(row=>{
      const qty=quantity(row.qty);
      const baseUnitCost=roundMoney(Number(row.cost));
      return {...row,qty,baseUnitCost,baseLineTotal:roundMoney(baseUnitCost*qty),minimumApplied:false};
    });
    if(adjustmentCents<=0) return visible;
    const trenchRows=visible.filter(isMeasuredTrench);
    const measuredCents=trenchRows.reduce((sum,row)=>sum+Math.round(row.baseLineTotal*100),0);
    if(measuredCents<=0){
      visible.push({item:'Trenching',category:'Trench',cost:TRENCH_MINIMUM,qty:1,baseUnitCost:TRENCH_MINIMUM,baseLineTotal:TRENCH_MINIMUM,minimumApplied:true});
      return visible;
    }
    const targetCents=measuredCents+adjustmentCents;
    const allocations=trenchRows.map((row,order)=>{
      const sourceCents=Math.round(row.baseLineTotal*100);
      const rawCents=targetCents*(sourceCents/measuredCents);
      return {row,order,sourceCents,cents:Math.floor(rawCents),fraction:rawCents-Math.floor(rawCents)};
    });
    let remaining=targetCents-allocations.reduce((sum,entry)=>sum+entry.cents,0);
    const ranked=allocations.slice().sort((a,b)=>b.fraction-a.fraction||b.sourceCents-a.sourceCents||a.order-b.order);
    for(let index=0;remaining>0&&ranked.length;index++,remaining--) ranked[index%ranked.length].cents++;
    allocations.forEach(entry=>{
      entry.row.baseLineTotal=roundMoney(entry.cents/100);
      entry.row.baseUnitCost=roundMoney(entry.row.baseLineTotal/entry.row.qty);
      entry.row.minimumApplied=true;
    });
    return visible;
  }
  function customerDetailedRows(rows,markup=0.125,laborMultiplier=1.3){
    const visible=internalQuoteRows(rows);
    const priced=visible.map(row=>{
      let adjustedBase=row.baseLineTotal;
      if(isLabor(row)) adjustedBase=roundMoney(adjustedBase*laborMultiplier);
      const rawCents=Math.max(0,adjustedBase*(1+markup)*100);
      return {...row,adjustedBase,cents:Math.floor(rawCents),fraction:rawCents-Math.floor(rawCents)};
    });
    const targetCents=Math.round(calculateTotals(rows,markup,laborMultiplier).grand*100);
    let remaining=targetCents-priced.reduce((sum,row)=>sum+row.cents,0);
    const allocation=priced.slice().sort((a,b)=>b.fraction-a.fraction||b.adjustedBase-a.adjustedBase);
    let index=0;
    while(remaining>0&&allocation.length){allocation[index%allocation.length].cents++;remaining--;index++;}
    index=0;
    while(remaining<0&&allocation.length){const row=allocation[index%allocation.length];if(row.cents>0){row.cents--;remaining++;}index++;}
    return priced.map(({adjustedBase,cents,fraction,baseUnitCost,baseLineTotal,minimumApplied,...row})=>({...row,customerPrice:roundMoney(cents/100)}));
  }
  function validateProject(project){
    const issues=[];
    if(!String(project?.projectName||'').trim()) issues.push({field:'projectName',message:'Add a project or customer name.'});
    if(!String(project?.projectAddress||'').trim()) issues.push({field:'projectAddress',message:'Add the project address.'});
    if(!String(project?.workType||'').trim()) issues.push({field:'workType',message:'Select a work type.'});
    if(!String(project?.scopeOfWork||'').trim()) issues.push({field:'scopeOfWork',message:'Add a scope of work.'});
    if(!effectiveRows(project?.rows).length) issues.push({field:'materials',message:'Add at least one material, service, fee, or labor item.'});
    return issues;
  }
  return {TRENCH_MINIMUM,roundMoney,effectiveRows,calculateTotals,internalQuoteRows,customerDetailedRows,validateProject,isTrenchMinimum,isMeasuredTrench};
});
