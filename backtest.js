(function(root){
'use strict';
function fail(message){throw Error(message);}
function validateRows(rows){
 if(!Array.isArray(rows)||rows.length<2)fail('回测至少需要两条日线记录。');
 for(let index=0;index<rows.length;index++){
  const row=rows[index];
  if(!/^\d{4}-\d{2}-\d{2}$/.test(row.date))fail('日期无效：'+row.date);
  if(index&&row.date<=rows[index-1].date)fail('行情日期必须严格递增：'+row.date);
  for(const field of ['open','high','low','close'])if(!Number.isFinite(row[field])||row[field]<=0)fail('价格无效：'+row.date+' '+field);
  if(!Number.isFinite(row.volume)||row.volume<0)fail('成交量无效：'+row.date);
  if(row.high<Math.max(row.open,row.close)||row.low>Math.min(row.open,row.close)||row.high<row.low)fail('OHLC 关系无效：'+row.date);
 }
}
function indexByDate(rows){return new Map(rows.map((row,index)=>[row.date,index]));}
function validateDividends(dividends,rows){
 const dates=indexByDate(rows), seen=new Set();
 for(const dividend of dividends){
  for(const field of ['recordDate','exDate','payDate'])if(!dates.has(dividend[field]))fail('分红日期不在行情中：'+dividend[field]);
  if(!(dividend.recordDate<dividend.exDate&&dividend.exDate<dividend.payDate))fail('分红日期顺序必须为登记日、除息日、发放日。');
  if(seen.has(dividend.exDate))fail('除息日重复：'+dividend.exDate);
  seen.add(dividend.exDate);
  if(!Number.isFinite(dividend.cashPer10Shares)||dividend.cashPer10Shares<0)fail('分红金额无效：'+dividend.exDate);
 }
}
 function runBuyAndHold(rows,config={},dividends=[]){
 validateRows(rows);
 const initialCash=config.initialCash??10000,costRate=config.costRate??0.001,lotSize=config.lotSize??100,entryIndex=config.entryIndex??0;
 if(!Number.isFinite(initialCash)||initialCash<=0)fail('初始资金无效。');
 if(!Number.isFinite(costRate)||costRate<0)fail('成本率无效。');
 if(!Number.isInteger(lotSize)||lotSize<=0)fail('每手份额必须为正整数。');
 if(!Number.isInteger(entryIndex)||entryIndex<0||entryIndex>=rows.length)fail('入场日无效。');
 validateDividends(dividends,rows);
 const dividendsByDate=new Map(dividends.map(dividend=>[dividend.exDate,dividend]));
 const paymentsByDate=new Map(dividends.map(dividend=>[dividend.payDate,dividend]));
 let cash=initialCash,shares=0,receivable=0,peak=-Infinity;
 const daily=rows.map((row,index)=>{
  if(index===entryIndex){
   shares=Math.floor(cash/(row.open*(1+costRate))/lotSize)*lotSize;
   if(shares<lotSize)fail('初始资金不足以买入一手。');
   const tradeValue=shares*row.open;
   cash-=tradeValue+tradeValue*costRate;
  }
  if(index&&dividendsByDate.has(row.date)){
   const dividend=dividendsByDate.get(row.date);
   const recordIndex=rows.findIndex(candidate=>candidate.date===dividend.recordDate);
   if(recordIndex>=index)fail('除息日前未完成权益登记：'+row.date);
   if(entryIndex<=recordIndex)receivable+=shares*dividend.cashPer10Shares/10;
  }
  if(paymentsByDate.has(row.date)){
   const dividend=paymentsByDate.get(row.date);
   const amount=shares*dividend.cashPer10Shares/10;
   if(receivable>=amount){
    receivable-=amount;cash+=amount;
   } else if(entryIndex<=rows.findIndex(candidate=>candidate.date===dividend.recordDate)){
    fail('应收分红不足：'+row.date);
   }
  }
  const netValue=cash+shares*row.close+receivable;
  peak=Math.max(peak,netValue);
  return {date:row.date,cash,shares,dividendReceivable:receivable,close:row.close,netValue,drawdown:netValue/peak-1};
 });
 const ending=daily.at(-1);
 return {initialCash,shares,endingCash:ending.cash,endingNetValue:ending.netValue,cumulativeReturn:ending.netValue/initialCash-1,maxDrawdown:Math.min(...daily.map(day=>day.drawdown)),daily};
}
const api={runBuyAndHold};
if(typeof module!=='undefined')module.exports=api;else root.QuantBacktest=api;
})(globalThis);
