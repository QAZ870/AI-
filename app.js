'use strict';
const el=id=>document.getElementById(id);
const simulatedBacktestConfig={initialCash:10000,costRate:.001,lotSize:100,entryIndex:0};
function chart(rows){
 const box=el('chart');box.replaceChildren();if(!rows.length){box.textContent='没有可展示的有效记录。';return;}
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 1040 280');svg.setAttribute('role','img');svg.setAttribute('aria-label','有效行情收盘价折线图');
 function add(tag,attrs,text){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;svg.append(n);return n;}
 const values=rows.map(r=>r.close),lo=Math.min(...values),hi=Math.max(...values),pad=(hi-lo)*.12||lo*.02,min=lo-pad,max=hi+pad;
 const x=i=>70+i/Math.max(1,rows.length-1)*940,y=v=>230-(v-min)/(max-min)*210;
 for(let i=0;i<5;i++){const v=min+(max-min)*i/4;add('line',{x1:70,x2:1010,y1:y(v),y2:y(v),stroke:'#e7edf2'});add('text',{x:60,y:y(v)+4,'text-anchor':'end',fill:'#718198','font-size':12},v.toFixed(2));}
 add('polyline',{points:rows.map((r,i)=>`${x(i)},${y(r.close)}`).join(' '),fill:'none',stroke:'#168774','stroke-width':2.5});
 if(rows.length===1)add('circle',{cx:x(0),cy:y(rows[0].close),r:4,fill:'#168774'});
 add('text',{x:70,y:263,fill:'#718198','font-size':12},rows[0].date);add('text',{x:1010,y:263,fill:'#718198','font-size':12,'text-anchor':'end'},rows.at(-1).date);box.append(svg);
}
function clearBacktest(message='请先使用模拟行情。'){
 ['backtest-ending','backtest-return','backtest-drawdown','backtest-shares','backtest-range'].forEach(id=>el(id).textContent='—');
 el('backtest-chart').replaceChildren();el('backtest-status').className='muted';el('backtest-status').textContent=message;
}
function backtestChart(rows,daily){
 const box=el('backtest-chart');box.replaceChildren();if(!rows.length)return;
 const indexedPrice=rows.map(row=>row.close/rows[0].close*100),indexedNav=daily.map(day=>day.netValue/daily[0].netValue*100),values=indexedPrice.concat(indexedNav),lo=Math.min(...values),hi=Math.max(...values),pad=(hi-lo)*.12||1,min=lo-pad,max=hi+pad;
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 1040 280');svg.setAttribute('role','img');svg.setAttribute('aria-label','收盘价指数与策略净值指数对比图');
 const add=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))n.setAttribute(key,value);if(text!==undefined)n.textContent=text;svg.append(n);return n;};
 const x=index=>70+index/Math.max(1,rows.length-1)*940,y=value=>230-(value-min)/(max-min)*210;
 for(let index=0;index<5;index++){const value=min+(max-min)*index/4;add('line',{x1:70,x2:1010,y1:y(value),y2:y(value),stroke:'#e7edf2'});add('text',{x:60,y:y(value)+4,'text-anchor':'end',fill:'#718198','font-size':12},value.toFixed(1));}
 add('polyline',{points:indexedNav.map((value,index)=>`${x(index)},${y(value)}`).join(' '),fill:'none',stroke:'#168774','stroke-width':2.5});add('polyline',{points:indexedPrice.map((value,index)=>`${x(index)},${y(value)}`).join(' '),fill:'none',stroke:'#4169a1','stroke-width':2.5});
 add('text',{x:70,y:263,fill:'#718198','font-size':12},rows[0].date);add('text',{x:1010,y:263,fill:'#718198','font-size':12,'text-anchor':'end'},rows.at(-1).date);box.append(svg);
}
function renderBacktest(rows,synthetic){
 if(!synthetic){el('backtest-run').disabled=true;clearBacktest('真实导入数据待完成授权、单位和交易日历核验，暂不运行回测。');return;}
 el('backtest-run').disabled=false;
 try{
  const result=QuantBacktest.runBuyAndHold(rows,simulatedBacktestConfig,[]);
  el('backtest-ending').textContent=result.endingNetValue.toFixed(2);el('backtest-return').textContent=(result.cumulativeReturn*100).toFixed(2)+'%';el('backtest-drawdown').textContent=(result.maxDrawdown*100).toFixed(2)+'%';el('backtest-shares').textContent=result.shares;el('backtest-range').textContent=rows[0].date+' 至 '+rows.at(-1).date;el('backtest-status').className='muted';el('backtest-status').textContent='模拟基准已运行；不含现金分红，仅验证规则和指标计算。';backtestChart(rows,result.daily);
 }catch(error){clearBacktest(error.message);}
}
el('backtest-run').onclick=()=>{if(currentSynthetic)renderBacktest(currentRows,true);};
let currentRows=[],currentSynthetic=true;
function render(text,name,synthetic){
 try{const d=QuantData.parseCSV(text);currentRows=d.valid;currentSynthetic=synthetic;el('total').textContent=d.total;el('valid').textContent=d.valid.length;el('excluded').textContent=d.excluded;el('range').textContent=d.valid.length?d.valid[0].date+' 至 '+d.valid.at(-1).date:'无有效日期';
 el('notice').textContent=synthetic?'当前使用模拟行情，仅验证界面与数据流程，不代表真实 ETF。':'当前为用户导入数据。来源、复权、分红与成交量单位尚未核实。';
 el('status').className='muted';el('status').textContent='已载入：'+name+'。记录编号为 CSV 记录序号（包含表头）。';
  chart(d.valid);renderBacktest(d.valid,synthetic);el('issues').replaceChildren();if(!d.issues.length)el('issues').textContent='基础字段与数值检查通过；不代表数据完整或已具备研究条件。';
 d.issues.slice(0,200).forEach(i=>{const n=document.createElement('div');n.className='issue'+(i.excluded?' error':'');n.textContent=`记录 ${i.row} · ${i.date}：${i.message}`;el('issues').append(n);});
 if(d.issues.length>200)el('issues').append(document.createTextNode('仅显示前 200 条问题。'));
 el('table').replaceChildren();d.valid.slice(0,100).forEach(r=>{const tr=document.createElement('tr');['date','open','high','low','close','volume'].forEach(k=>{const td=document.createElement('td');td.textContent=r[k];tr.append(td);});el('table').append(tr);});
 }catch(e){fail(e.message);}
}
function fail(message){currentRows=[];currentSynthetic=false;['total','valid','excluded','range'].forEach(id=>el(id).textContent='—');el('table').replaceChildren();el('issues').replaceChildren();chart([]);clearBacktest('文件未载入，暂不运行回测。');el('notice').textContent='文件未载入，请修正后重试。';el('status').className='error';el('status').textContent=message;}
let loadVersion=0;
el('file').addEventListener('change',async e=>{const token=++loadVersion,f=e.target.files[0];if(!f)return;if(f.size>5*1024*1024){fail('文件超过 5 MB，请先截取研究区间。');return;}try{const text=await f.text();if(token===loadVersion)render(text,f.name,false);}catch{if(token===loadVersion)fail('读取失败，请选择 UTF-8 编码的 CSV 文件。');}});
el('sample').onclick=()=>{loadVersion++;el('file').value='';render(QuantData.sampleCSV(),'模拟行情 · 180 条',true);};
el('download').onclick=()=>{const url=URL.createObjectURL(new Blob(['\uFEFF'+QuantData.sampleCSV()],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='quantlab_SYNTHETIC_sample.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
render(QuantData.sampleCSV(),'模拟行情 · 180 条',true);

function fundamentalChart(rows){
 const box=el('fund-chart');box.replaceChildren();if(!rows.length){box.textContent='没有可展示的基本面记录。';return;}
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 1040 300');svg.setAttribute('role','img');svg.setAttribute('aria-label','基本面收入与归母净利润趋势图');
 function add(tag,attrs,text){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;svg.append(n);return n;}
 const values=rows.flatMap(r=>[r.revenue,r.netProfit]),lo=0,hi=Math.max(...values)*1.15,x=i=>90+i/Math.max(1,rows.length-1)*870,y=v=>245-v/hi*190;
 for(let i=0;i<5;i++){const v=hi*i/4,yy=y(v);add('line',{x1:90,x2:960,y1:yy,y2:yy,stroke:'#e7edf2'});add('text',{x:80,y:yy+4,'text-anchor':'end',fill:'#718198','font-size':12},v.toFixed(0));}
 [['revenue','#168774','营业收入'],['netProfit','#df8b21','归母净利润']].forEach(([key,color,label],seriesIndex)=>{const points=rows.map((r,i)=>`${x(i)},${y(r[key])}`).join(' ');add('polyline',{points,fill:'none',stroke:color,'stroke-width':3});rows.forEach((r,i)=>{add('circle',{cx:x(i),cy:y(r[key]),r:5,fill:color});add('text',{x:x(i),y:y(r[key])-10,'text-anchor':'middle',fill:color,'font-size':11},r[key].toFixed(1));});add('line',{x1:100+seriesIndex*170,y1:280,x2:125+seriesIndex*170,y2:280,stroke:color,'stroke-width':3});add('text',{x:132+seriesIndex*170,y:284,fill:'#526477','font-size':13},label);});
 rows.forEach((r,i)=>add('text',{x:x(i),y:270,'text-anchor':'middle',fill:'#718198','font-size':13},r.year));box.append(svg);
}
function renderFundamentals(text,name){
 try{const d=QuantFundamentals.parseCSV(text),rows=d.valid,latest=rows.at(-1);currentFundamentalRows=rows;el('fundamental-status').className=d.excluded?'error':'muted';el('fundamental-status').textContent=`已载入：${name}；有效 ${rows.length} 年，排除 ${d.excluded} 条。`;
  if(!latest){['fund-revenue','fund-revenue-yoy','fund-profit','fund-cash-quality','fund-debt-ratio'].forEach(id=>el(id).textContent='—');el('fund-table').replaceChildren();el('fund-issues').textContent='没有有效记录。';fundamentalChart([]);return;}
  el('fund-revenue').textContent=latest.revenue.toFixed(2);el('fund-revenue-yoy').textContent=latest.revenueYoYPct===null?'—':latest.revenueYoYPct.toFixed(2)+'%';el('fund-profit').textContent=latest.netProfit.toFixed(2);el('fund-cash-quality').textContent=latest.cashFlowToProfitPct===null?'—':latest.cashFlowToProfitPct.toFixed(2)+'%';el('fund-debt-ratio').textContent=latest.debtRatioPct===null?'—':latest.debtRatioPct.toFixed(2)+'%';fundamentalChart(rows);
  el('fund-table').replaceChildren();rows.forEach(r=>{const tr=document.createElement('tr');const cells=[r.year,r.revenue.toFixed(2),r.revenueYoYPct===null?'—':r.revenueYoYPct.toFixed(2)+'%',r.netProfit.toFixed(2),r.grossMarginPct.toFixed(2)+'%',r.operatingCashFlow.toFixed(2),r.cashFlowToProfitPct===null?'—':r.cashFlowToProfitPct.toFixed(2)+'%',r.debtRatioPct===null?'—':r.debtRatioPct.toFixed(2)+'%'];cells.forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td);});el('fund-table').append(tr);});
  el('fund-issues').replaceChildren();const messages=d.issues.map(i=>`第 ${i.row} 行 · ${i.year||''}：${i.message}`);if(!messages.length){['趋势：先观察收入与利润是否同向。','质量：现金流/利润下降时，应回到现金流量表核验原因。','证据：正式分析需补充年报页码和行业对比。'].forEach(message=>{const n=document.createElement('div');n.className='issue';n.textContent=message;el('fund-issues').append(n);});}else messages.forEach(message=>{const n=document.createElement('div');n.className='issue error';n.textContent=message;el('fund-issues').append(n);});
 }catch(e){currentFundamentalRows=[];el('fundamental-status').className='error';el('fundamental-status').textContent=e.message;['fund-revenue','fund-revenue-yoy','fund-profit','fund-cash-quality','fund-debt-ratio'].forEach(id=>el(id).textContent='—');el('fund-table').replaceChildren();el('fund-issues').textContent='文件未载入，请修正后重试。';fundamentalChart([]);}
}
function downloadText(text,name){const url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
let currentFundamentalRows=[];
let fundamentalLoadVersion=0;
el('fundamental-file').addEventListener('change',async e=>{const token=++fundamentalLoadVersion,f=e.target.files[0];if(!f)return;if(f.size>2*1024*1024){renderFundamentals('',f.name);el('fundamental-status').textContent='基本面文件超过 2 MB，请先截取研究区间。';return;}try{const text=await f.text();if(token===fundamentalLoadVersion)renderFundamentals(text,f.name);}catch{if(token===fundamentalLoadVersion)renderFundamentals('',f.name);}});
el('fundamental-sample').onclick=()=>{fundamentalLoadVersion++;el('fundamental-file').value='';renderFundamentals(QuantFundamentals.sampleCSV(),'虚构公司教学案例');};
el('fundamental-download').onclick=()=>downloadText(QuantFundamentals.sampleCSV(),'quantlab_fundamentals_case.csv');
el('fundamental-export').onclick=()=>{if(!currentFundamentalRows.length){el('fundamental-status').className='error';el('fundamental-status').textContent='没有可导出的有效指标。';return;}downloadText(QuantFundamentals.metricsCSV(currentFundamentalRows),'quantlab_fundamental_metrics.csv');};
renderFundamentals(QuantFundamentals.sampleCSV(),'虚构公司教学案例');
