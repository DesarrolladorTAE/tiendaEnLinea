const fs = require('fs');
(async () => {
const assert = require('node:assert/strict');
const source = fs.readFileSync('src/utils/posSaleInfo.js', 'utf8');
const {saleInfo,posDate,posDateValue,summarizeSales,uniqueSales,saleDayKey,saleAmounts,validAmount,posMoney} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
assert.equal(saleInfo({status:'paid'}).type,'unknown');
assert.equal(saleInfo({status:'paid',invoice_period_date:'2026-10-08'}).type,'unknown');
assert.equal(saleInfo({status:'paid',credit_account_id:12}).type,'credit_paid');
assert.equal(saleInfo({status:'paid',credit:{is_credit:false}}).type,'cash');
assert.equal(saleInfo({status:'paid',credit_account_id:12,invoice_period_date:'2026-10-08'}).paymentDate,null);
assert.equal(saleInfo({status:'paid',credit_account_id:12,credit_paid_at:'2026-10-08'}).paymentDate,'2026-10-08');
assert.equal(saleInfo({invoice:{status:'timbrada'}}).invoiced,true);
assert.equal(posDate(null),'No disponible');
assert.equal(posDate('bad date'),'No disponible');
assert.match(posDate('2026-10-08'),/^08/);
assert.match(posDate('2026-10-08T02:00:00Z'),/^07/);
assert.equal(posDateValue('2026-10-08 14:35:00').toISOString(),'2026-10-08T20:35:00.000Z');

assert.equal(saleInfo({status:'paid',credit_movements:[]}).type,'unknown');
assert.equal(saleInfo({status:'paid',credit_account_id:null}).type,'cash');
assert.equal(saleInfo({status:'paid',credit_account_id:4,is_credit:false}).type,'credit_paid');
assert.equal(saleInfo({credit_status:'liquidado',credit_paid_at:'2026-10-08'}).type,'credit_paid');
assert.equal(saleInfo({status:'credit',credit_account_id:4}).type,'credit');
assert.equal(saleDayKey({created_at:'2026-09-25T12:00:00Z',invoice_period_date:'2026-10-08 09:30:00'}),'2026-10-08');
assert.equal(saleDayKey({created_at:'2026-09-25T12:00:00Z'}),null);
assert.equal(saleDayKey({invoice_period_date:'2026-10-02T02:53:55Z'}),'2026-10-01');
const mixed = [
  {id:1,status:'paid',credit_account_id:null,total_amount:'100',facturable:true},
  {id:'1',status:'paid',credit_account_id:null,total_amount:'100',facturable:true},
  {id:2,status:'paid',credit_account_id:4,total_amount:'200',facturable:true},
  {id:3,status:'paid',credit_account_id:null,total_amount:'300',invoice_status:'timbrada',facturable:true},
  {id:4,status:'paid',total_amount:'400',facturable:true,fuera_de_rango:true},
].map(sale => ({ ...sale, isr_retention_total: 0 }));
assert.equal(uniqueSales(mixed).length,4);
assert.deepEqual(summarizeSales(mixed), {
 cash:{count:2,amount:400,missing:0}, credit_paid:{count:1,amount:200,missing:0},
 invoiced:{count:1,amount:300,missing:0}, facturable:{count:2,amount:300,missing:0}, unknown:{count:1,amount:400,missing:0}, retention:{amount:0,missing:0},
});
// Exact totals from the supplied endpoint response, without customer data.
const amounts = [2167.5,521,1287,503,399,631,449,164,2592,1324,1966,1057.25];
const sample = amounts.map((total_amount,id)=>({id,status:'paid',credit_movements:[],invoice_status:'pending',total_amount,isr_retention_total:0,facturable:true,fuera_de_rango:false}));
assert.deepEqual(summarizeSales(sample).facturable,{count:12,amount:13060.75,missing:0});
assert.deepEqual(summarizeSales(sample).unknown,{count:12,amount:13060.75,missing:0});
if (process.argv[2]) {
 const payload = JSON.parse(fs.readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,''));
 assert.deepEqual(summarizeSales(payload.data).facturable,{count:12,amount:0,missing:12});
 assert.deepEqual(summarizeSales(payload.data).unknown,{count:12,amount:0,missing:12});
 console.log('JSON anterior verificado: 12 ventas sin campos suficientes para determinar su neto.');
}
const retained = {id:100,status:'paid',credit_account_id:null,total_amount:'1160.000000',iva_total:'160',isr_retention_total:'12.5',isr_retention_applied:true,net_total_amount:'1147.5',facturable:true};
assert.deepEqual(saleAmounts(retained),{gross:1160,iva:160,retention:12.5,net:1147.5,subtotal:1000,hasRetention:true});
assert.equal(saleAmounts({...retained,net_total_amount:undefined}).net,1147.5);
assert.equal(saleAmounts({...retained,net_total_amount:'1100'}).net,1100);
assert.equal(saleAmounts({total_amount:500,isr_retention_total:0,isr_retention_applied:false}).net,500);
assert.equal(saleAmounts({total_amount:500}).net,null);
assert.equal(saleAmounts({total_amount:500,isr_retention_total:''}).net,null);
assert.equal(saleAmounts({total_amount:'bad',isr_retention_total:0}).net,null);
assert.equal(validAmount(false),null);
assert.equal(validAmount(Infinity),null);
assert.equal(validAmount(''),null);
assert.equal(validAmount('0.00'),0);
assert.equal(posMoney(1147.5),'$1,147.50');
assert.equal(summarizeSales([retained,retained]).cash.amount,1147.5);
assert.equal(summarizeSales([retained,retained]).facturable.amount,1147.5);
assert.deepEqual(summarizeSales([retained,retained]).retention,{amount:12.5,missing:0});
assert.equal(summarizeSales([{...retained,credit_account_id:4}]).credit_paid.amount,1147.5);
assert.equal(summarizeSales([{...retained,invoice_status:'timbrada'}]).invoiced.amount,1147.5);
console.log('Verificaciones correctas: clasificación, totales, duplicados, periodo y fechas.');
})().catch(e=>{console.error(e);process.exitCode=1});
