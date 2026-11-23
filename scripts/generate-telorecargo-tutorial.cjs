const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync('docs/tutorial-recargas-telorecargo.md', 'utf8');
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (text) => escape(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/→/g, '&rarr;');
function markdown(text) {
  const lines = text.trim().split(/\r?\n/);
  let html = '', list = '';
  const close = () => { if (list) { html += `</${list}>`; list = ''; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) { close(); continue; }
    if (line.startsWith('|')) {
      close(); const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      i--; html += '<table><thead><tr>' + rows[0].split('|').slice(1, -1).map(x => `<th>${inline(x.trim())}</th>`).join('') + '</tr></thead><tbody>';
      for (const row of rows.slice(2)) html += '<tr>' + row.split('|').slice(1, -1).map(x => `<td>${inline(x.trim())}</td>`).join('') + '</tr>';
      html += '</tbody></table>'; continue;
    }
    if (/^#{2,3} /.test(line)) { close(); const depth = line.match(/^#+/)[0].length; html += `<h${depth}>${inline(line.slice(depth + 1))}</h${depth}>`; continue; }
    const item = line.match(/^(\d+\.|-) (.*)/);
    if (item) { const type = item[1] === '-' ? 'ul' : 'ol'; if (list !== type) { close(); html += `<${type}>`; list = type; } html += `<li>${inline(item[2])}</li>`; continue; }
    close(); html += `<p>${inline(line)}</p>`;
  }
  close(); return html;
}
const sections = source.split(/(?=^## \d+\.)/m).slice(1);
const groups = [[0],[1],[2],[3],[4,5],[6],[7],[8,9]];
const logo = fs.readFileSync('public/assets/telorecargo.png').toString('base64');
const titles = ['Conoce el módulo', 'Vender una recarga', 'Cobro y cambio', 'Entrega del ticket', 'Historial y estados', 'Recuperar una operación', 'Solicitar saldo', 'Administración y ayuda'];
const pages = groups.map((group, index) => `<section class="page"><header><div class="brand">Mi Tienda en Línea MX<span>GUÍA DE USO · PUNTO DE VENTA</span></div><img src="data:image/png;base64,${logo}"></header><div class="kicker">RECARGAS TELORECARGO / ${String(index+1).padStart(2,'0')}</div><h1>${titles[index]}</h1>${index === 0 ? '<p class="lead">Tutorial para personal de caja y administración. Desde la elección de compañía hasta la entrega del comprobante.</p>' : ''}<main>${group.map(i => markdown(sections[i])).join('')}</main><footer><span>Telorecargo · Manual de operación</span><span>${index+1} / ${groups.length}</span></footer></section>`).join('');
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><title>Tutorial de recargas Telorecargo</title><style>
@page{size:Letter;margin:0}*{box-sizing:border-box}body{margin:0;color:#20334c;background:#fff;font:10pt/1.43 'Segoe UI',Arial,sans-serif}.page{position:relative;width:215.9mm;height:279.4mm;padding:14mm 16mm 16mm;break-after:page;overflow:hidden}.page:last-child{break-after:auto}header{display:flex;align-items:center;justify-content:space-between;padding-bottom:5mm;border-bottom:1px solid #d8e5f2;margin-bottom:6mm}.brand{font-size:13pt;font-weight:800;color:#11355d}.brand span{display:block;font-size:7pt;letter-spacing:1.2px;color:#69819c;margin-top:2mm}header img{width:30mm;height:16mm;object-fit:contain}.kicker{font-size:7.5pt;color:#1464bf;letter-spacing:1px;font-weight:800}h1{font-size:25pt;line-height:1.1;letter-spacing:-.7px;color:#102c50;margin:2mm 0 5mm}h2{font-size:13pt;color:#125db0;margin:5mm 0 2mm;break-after:avoid}h3{font-size:11pt;color:#11355d;margin:4mm 0 1.5mm;break-after:avoid}p{margin:0 0 2.5mm}.lead{font-size:11pt;color:#60758e;margin-bottom:5mm}strong{font-weight:700;color:#122f51}ol,ul{margin:2mm 0 3mm;padding-left:6mm}li{margin-bottom:1.7mm;padding-left:1mm}li::marker{color:#1565c0;font-weight:700}table{border-collapse:separate;border-spacing:0;width:100%;margin:3mm 0 4mm;font-size:9pt;border:1px solid #dce6f0;border-radius:8px;overflow:hidden}th{background:#eaf3ff;color:#164b85;text-align:left;font-weight:750}th,td{padding:2.3mm 3mm;border-bottom:1px solid #e3ebf3;vertical-align:top}tr:last-child td{border-bottom:0}tbody tr:nth-child(even){background:#f8fafc}td:first-child{width:32%;font-weight:600}footer{position:absolute;bottom:8mm;left:16mm;right:16mm;display:flex;justify-content:space-between;border-top:1px solid #dce6f0;padding-top:3mm;color:#69819c;font-size:8pt}
</style>${pages}</html>`;
fs.mkdirSync('tmp/pdfs', {recursive:true});
fs.mkdirSync('output/pdf', {recursive:true});
fs.writeFileSync('tmp/pdfs/tutorial-recargas-telorecargo.html', html);
console.log(path.resolve('tmp/pdfs/tutorial-recargas-telorecargo.html'));
