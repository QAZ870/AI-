(function(root){
'use strict';
function parseCSV(text){
 const rows=[]; let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++) { const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){row.push(cell.trim());cell='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(x=>x!==''))rows.push(row);row=[];cell='';}
  else cell+=c;
 }
 if(quoted)throw Error('CSV 引号未闭合，请检查文件。');
 row.push(cell.trim());if(row.some(x=>x!==''))rows.push(row);
 if(!rows.length)throw Error('文件为空。');
 const headers=rows.shift().map(x=>x.replace(/^\uFEFF/,'').toLowerCase());
 const required=['date','open','high','low','close','volume'];
 if(new Set(headers).size!==headers.length)throw Error('表头存在重复字段。');
 if(required.some(x=>!headers.includes(x)))throw Error('缺少必需字段：date, open, high, low, close, volume。');
 const records=rows.map((r,i)=>{const obj={row:i+2,_width:r.length===headers.length};headers.forEach((h,j)=>obj[h]=r[j]??'');return obj;});
 const dates=new Map(); records.forEach(r=>dates.set(r.date,(dates.get(r.date)||0)+1));
 const issues=[],valid=[];let excluded=0;
 records.forEach(r=>{
  const errors=[];
  if(!r._width)errors.push('列数与表头不一致');
  const d=new Date(r.date+'T00:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==r.date)errors.push('日期无效');
  if(dates.get(r.date)>1)errors.push('日期重复（该日期所有记录排除）');
  const out={date:r.date,row:r.row};
  required.slice(1).forEach(k=>{out[k]=Number(r[k]);if(r[k]===''||!Number.isFinite(out[k])||(k==='volume'?out[k]<0:out[k]<=0))errors.push(k+' 缺失或数值无效');});
  if(!errors.length&&(out.high<Math.max(out.open,out.close)||out.low>Math.min(out.open,out.close)||out.high<out.low))errors.push('最高/最低价与开收盘价不一致');
  if(errors.length){excluded++;issues.push({row:r.row,date:r.date,message:errors.join('；'),excluded:true});} else valid.push(out);
 });
 valid.sort((a,b)=>a.date.localeCompare(b.date));
 for(let i=1;i<valid.length;i++){const change=valid[i].close/valid[i-1].close-1;if(Math.abs(change)>.10)issues.push({row:valid[i].row,date:valid[i].date,message:'相邻有效记录收盘变化 '+(change*100).toFixed(2)+'%，需复核；已保留',excluded:false});}
 return {total:records.length,valid,excluded,issues};
}
function sampleCSV(){let s='date,open,high,low,close,volume\n',p=100,n=0;for(let t=Date.UTC(2024,0,1);n<180;t+=86400000){let d=new Date(t);if([0,6].includes(d.getUTCDay()))continue;const o=p*(1+Math.sin(n*2)*.002);p=o*(1+Math.sin(n*.43)*.008+Math.cos(n*.11)*.004);s+=[d.toISOString().slice(0,10),o.toFixed(3),(Math.max(o,p)*1.004).toFixed(3),(Math.min(o,p)*.996).toFixed(3),p.toFixed(3),Math.round(1000000*(1+.2*Math.sin(n)))].join(',')+'\n';n++;}return s;}
const api={parseCSV,sampleCSV}; if(typeof module!=='undefined')module.exports=api;else root.QuantData=api;
})(globalThis);
