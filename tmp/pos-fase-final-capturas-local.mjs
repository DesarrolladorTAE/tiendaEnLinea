import {createServer} from 'node:http';
import {readFileSync, existsSync, statSync} from 'node:fs';
import {resolve, extname, sep} from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const root = resolve('tmp/pos-fase-final-staging');
const html = readFileSync(resolve(root,'index.html'),'utf8');
const types = {'.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg','.woff2':'font/woff2'};
const key = '2bb3f93a-cc52-485c-95c3-fd4e8fcf56ab';
const active = (key, operational_enabled = false) =>
  ({key,available:true,enabled:true,visible:true,store_enabled:true,source:'pos', operational_enabled});
const calendar = {data:[],current_page:1,last_page:1,total:0};
const apiCalls = [];
const server = createServer(async (req,res) => {
  const url = new URL(req.url,'http://127.0.0.1:48033');
  const path = url.pathname;
  if(path.startsWith('/api/')) {
    const token = req.headers.authorization;
    const pilot = token === 'Bearer pos-piloto-ficticio';
    const terminal = pilot ? 71 : 72;
    apiCalls.push([req.method,path,token]);
    const modules = [active('sales'),...(pilot ? [active('service_sales',true),active('sales_v2_idempotency',true)] : [])];
    const routes = {
      '/api/pos/me':{id:terminal,store_id:3,branch_id:12,name:pilot?'Terminal piloto':'Terminal de control',abilities:['sell-only'],warehouse_ids:[]},
      '/api/pos/modules':{data:modules},
      '/api/pos/modules/enabled':{data:modules},
      [`/api/pos/${terminal}/cash`]:{cash_control_enabled:false},
      '/api/branches/12/bookings':calendar,
      '/api/branches/12/services':{services:calendar},
      '/api/my-products-by-pos1':{products:[],meta:{last_page:1}},
    };
    const valid = token === 'Bearer pos-control-ficticio' || pilot;
    const response = routes[path] ?? {data:[],products:[],meta:{last_page:1}};
    res.writeHead(path.endsWith('/v2/sales') || (!valid && path.includes('/pos/')) ? 403 : 200,{'Content-Type':'application/json'});
    return res.end(JSON.stringify(response));
  }
  if(path === '/prueba/pos') {
    const variant = url.searchParams.get('fixture');
    const tag = `<script>localStorage.setItem('POS_TOKEN', ${JSON.stringify(variant === 'piloto' ? 'pos-piloto-ficticio' : 'pos-control-ficticio')});${variant === 'recuperacion' ? `localStorage.setItem('pos-v2-recovery:72', ${JSON.stringify(JSON.stringify({key}))});` : ''}</script>`;
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    return res.end(html.replace('<head>', '<head>' + tag));
  }
  const file = resolve(root,'.'+path);
  if(file.startsWith(root+sep) && existsSync(file) && statSync(file).isFile()) {
    res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream'});
    return res.end(readFileSync(file));
  }
  res.writeHead(404); res.end();
});
await new Promise(resolve => server.listen(48033,'127.0.0.1',resolve));
try {
  for (const [variant,view,expected] of [
    ['piloto','servicios&vista=agenda','Agenda de servicios'],
    ['control','venta','Terminal de control'],
    ['recuperacion','venta','Consultar venta'],
  ]) {
    const profile = resolve('tmp','pos-fase-final-chrome-'+variant+'-'+Date.now());
    const image = resolve('tmp/pos-fase-final-capturas',variant+'.png');
    const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',[
      '--headless=new','--disable-gpu','--disable-background-networking','--disable-extensions','--no-first-run','--no-proxy-server','--no-sandbox',
      '--window-size=1440,950','--virtual-time-budget=6500','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost',
      '--user-data-dir='+profile,'--screenshot='+image,'--dump-dom',
      'http://127.0.0.1:48033/prueba/pos?seccion='+view+'&fixture='+variant,
    ],{windowsHide:true,stdio:['ignore','pipe','inherit']});
    let dom = '';
    chrome.stdout.setEncoding('utf8').on('data',chunk=>dom+=chunk);
    assert.equal(await new Promise((done,fail)=>{chrome.once('close',done);chrome.once('error',fail);}),0);
    assert.ok(dom.includes(expected),variant+' missing '+expected+' '+dom.slice(-700));
    if (variant === 'control') assert.ok(!dom.includes('Agenda de servicios'));
    console.log(variant,statSync(image).size);
  }
  assert.ok(apiCalls.some(([,path,token])=>path==='/api/pos/modules' && token==='Bearer pos-piloto-ficticio'));
  assert.ok(apiCalls.some(([,path,token])=>path==='/api/pos/modules' && token==='Bearer pos-control-ficticio'));
  assert.ok(!apiCalls.some(([method,path])=> method==='POST' && path==='/api/v2/sales'));
  assert.ok(!apiCalls.some(([,path,token])=>path.startsWith('/api/branches/') && token==='Bearer pos-control-ficticio'));
} finally {server.close();}
