(function(root){
'use strict';
function fail(message){throw Error(message);}
const fields=[['revenue','revenue'],['cost','cost'],['netprofit','netProfit'],['operatingcashflow','operatingCashFlow'],['totalassets','totalAssets'],['totalliabilities','totalLiabilities']];
const headersRequired=['year',...fields.map(([header])=>header)];
function parseCSV(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){row.push(cell.trim());cell='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(x=>x!==''))rows.push(row);row=[];cell='';}
  else cell+=c;
 }
 if(quoted)fail('基本面 CSV 引号未闭合，请检查文件。');
 row.push(cell.trim());if(row.some(x=>x!==''))rows.push(row);
 if(!rows.length)fail('基本面文件为空。');
 const headers=rows.shift().map(x=>x.replace(/^\uFEFF/,'').toLowerCase());
 if(new Set(headers).size!==headers.length)fail('基本面表头存在重复字段。');
 if(headersRequired.some(x=>!headers.includes(x)))fail('缺少必需字段：year, revenue, cost, netProfit, operatingCashFlow, totalAssets, totalLiabilities。');
 const records=rows.map((r,i)=>{const obj={row:i+2,_width:r.length===headers.length};headers.forEach((h,j)=>obj[h]=r[j]??'');return obj;});
 const issues=[],valid=[];let excluded=0;
 records.forEach(r=>{
  const errors=[];if(!r._width)errors.push('列数与表头不一致');
  const year=Number(r.year);if(!Number.isInteger(year)||year<1900||year>2200)errors.push('年份无效');
  const out={row:r.row,year};
  fields.forEach(([header,key])=>{out[key]=Number(r[header]);if(r[header]===''||!Number.isFinite(out[key])||out[key]<0)errors.push(key+' 缺失或数值无效');});
  if(out.revenue<=0)errors.push('revenue 必须大于 0');
  if(out.cost>out.revenue*2)errors.push('cost 超出收入两倍，需核对单位');
  if(errors.length){excluded++;issues.push({row:r.row,year:r.year,message:errors.join('；'),excluded:true});}else valid.push(out);
 });
 valid.sort((a,b)=>a.year-b.year);
 const seen=new Set(),dedup=[];for(const row of valid){if(seen.has(row.year)){excluded++;issues.push({row:row.row,year:row.year,message:'年份重复（该年份后续记录排除）',excluded:true});}else{seen.add(row.year);dedup.push(row);}}
 const calculated=dedup.map((row,index)=>({...row,
  revenueYoYPct:index?((row.revenue/dedup[index-1].revenue)-1)*100:null,
  netProfitYoYPct:index?((row.netProfit/dedup[index-1].netProfit)-1)*100:null,
  grossMarginPct:(row.revenue-row.cost)/row.revenue*100,
  cashFlowToProfitPct:row.netProfit?row.operatingCashFlow/row.netProfit*100:null,
  debtRatioPct:row.totalAssets?row.totalLiabilities/row.totalAssets*100:null
 }));
 return {total:records.length,valid:calculated,excluded,issues};
}
function sampleCSV(){return 'year,revenue,cost,netProfit,operatingCashFlow,totalAssets,totalLiabilities\n2023,100,60,10,12,200,80\n2024,110,66,11,13,220,88\n2025,121,72.6,12.1,14,242,96.8\n';}
 function metricsCSV(rows){
  const headers=['year','revenue','revenueYoYPct','netProfit','grossMarginPct','operatingCashFlow','cashFlowToProfitPct','debtRatioPct'];
  const format=value=>value===null||value===undefined?'':Number(value).toFixed(4);
  return [headers.join(','),...(rows||[]).map(row=>[row.year,format(row.revenue),format(row.revenueYoYPct),format(row.netProfit),format(row.grossMarginPct),format(row.operatingCashFlow),format(row.cashFlowToProfitPct),format(row.debtRatioPct)].join(','))].join('\n')+'\n';
 } const api={parseCSV,metricsCSV,sampleCSV};if(typeof module!=='undefined')module.exports=api;else root.QuantFundamentals=api;
})(globalThis);
