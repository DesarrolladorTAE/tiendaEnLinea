import fs from 'node:fs';
import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';
Object.assign(globalThis, { DOMMatrix, ImageData, Path2D });
const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
const doc = await getDocument({data:new Uint8Array(fs.readFileSync('output/pdf/tutorial-recargas-telorecargo.pdf')), useSystemFonts:true}).promise;
const summaries = [];
const montage = createCanvas(3*440, Math.ceil(doc.numPages/3)*580);
const mc = montage.getContext('2d'); mc.fillStyle='#dce5ef'; mc.fillRect(0,0,montage.width,montage.height);
for (let i=1;i<=doc.numPages;i++) {
 const page=await doc.getPage(i), viewport=page.getViewport({scale:1.35});
 const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
 await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
 fs.writeFileSync(`tmp/pdfs/page-${i}.png`,canvas.toBuffer('image/png'));
 mc.drawImage(canvas, ((i-1)%3)*440+10,Math.floor((i-1)/3)*580+10,420,544);
 const text=await page.getTextContent();
 summaries.push({page:i,characters:text.items.map(x=>x.str).join(' ').length,tail:text.items.slice(-9).map(x=>x.str).join(' ')});
}
fs.writeFileSync('tmp/pdfs/montage.png',montage.toBuffer('image/png'));
console.log(JSON.stringify({pages:doc.numPages,summaries},null,2));
